import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { clampView, fittedScale, initialView, PAGE_WIDTH, zoomAt, type View } from "./layout";

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function useDocumentGestures(pageCount: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 8 });
  const [moving, setMoving] = useState(false);
  const current = useRef(view);
  const size = useRef({ width: 360, height: 600 });
  const minimum = useRef(fittedScale(360));
  const pointers = useRef(new Map<number, Point>());
  const frame = useRef(0);
  const velocity = useRef({ x: 0, y: 0, time: 0 });
  const tap = useRef({ time: 0, point: { x: 0, y: 0 } });
  const start = useRef({ point: { x: 0, y: 0 }, moved: false, pinched: false });

  const commit = useCallback((next: View) => {
    const bounded = clampView(next, size.current.width, size.current.height, pageCount, minimum.current);
    current.current = bounded;
    setView(bounded);
    return bounded;
  }, [pageCount]);

  const stop = useCallback(() => { cancelAnimationFrame(frame.current); setMoving(false); }, []);
  const fit = useCallback(() => {
    stop(); minimum.current = fittedScale(size.current.width);
    commit(initialView(size.current.width));
  }, [commit, stop]);
  const zoom = useCallback((factor: number) => {
    stop();
    const { width, height } = size.current;
    commit(zoomAt(current.current, Math.max(minimum.current, Math.min(fittedScale(width) * 4, current.current.scale * factor)), width / 2, height / 2));
  }, [commit, stop]);
  const wholePage = useCallback(() => {
    stop();
    const scale = (size.current.width - 16) / PAGE_WIDTH;
    minimum.current = scale;
    commit({ scale, x: 8, y: 8 });
  }, [commit, stop]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    let lastWidth = 0;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width <= 0) return;
      size.current = { width: rect.width, height: rect.height };
      if (rect.width !== lastWidth) { lastWidth = rect.width; fit(); }
      else commit(current.current);
    });
    observer.observe(element);
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); stop();
      const mode = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.current.height : 1;
      if (event.ctrlKey || event.metaKey) {
        const rect = element.getBoundingClientRect();
        const scale = Math.max(minimum.current, Math.min(fittedScale(size.current.width) * 4, current.current.scale * Math.exp(-event.deltaY * mode * 0.0015)));
        commit(zoomAt(current.current, scale, event.clientX - rect.left, event.clientY - rect.top));
      } else commit({ ...current.current, x: current.current.x - event.deltaX * mode, y: current.current.y - event.deltaY * mode });
    };
    const rotate = () => fit();
    window.addEventListener("orientationchange", rotate);
    element.addEventListener("wheel", wheel, { passive: false });
    return () => { observer.disconnect(); stop(); element.removeEventListener("wheel", wheel); window.removeEventListener("orientationchange", rotate); };
  }, [commit, fit, stop]);

  const point = (event: ReactPointerEvent<HTMLDivElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('[contenteditable="true"]'))) return;
    stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    pointers.current.set(event.pointerId, p);
    if (pointers.current.size === 1) start.current = { point: p, moved: false, pinched: false };
    else { start.current.pinched = true; tap.current.time = 0; }
    velocity.current = { x: 0, y: 0, time: performance.now() };
    setMoving(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const before = [...pointers.current.values()];
    const next = point(event);
    pointers.current.set(event.pointerId, next);
    if (distance(next, start.current.point) > 6) start.current.moved = true;
    const after = [...pointers.current.values()];
    const a = before[0], b = before[1], c = after[0], d = after[1];
    if (a && b && c && d) {
      const oldCenter = midpoint(a, b), center = midpoint(c, d);
      const scale = Math.max(minimum.current, Math.min(fittedScale(size.current.width) * 4, current.current.scale * distance(c, d) / Math.max(1, distance(a, b))));
      const anchored = zoomAt(current.current, scale, oldCenter.x, oldCenter.y);
      commit({ ...anchored, x: anchored.x + center.x - oldCenter.x, y: anchored.y + center.y - oldCenter.y });
    } else {
      const dx = next.x - previous.x, dy = next.y - previous.y;
      const dt = Math.max(8, performance.now() - velocity.current.time);
      velocity.current = { x: dx / dt, y: dy / dt, time: performance.now() };
      commit({ ...current.current, x: current.current.x + dx, y: current.current.y + dy });
    }
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (pointers.current.size) { velocity.current = { x: 0, y: 0, time: performance.now() }; return; }
    const now = performance.now();
    if (event.type !== "pointercancel" && !start.current.moved && !start.current.pinched) {
      const p = point(event);
      if (now - tap.current.time < 300 && distance(p, tap.current.point) < 24) {
        const fitted = fittedScale(size.current.width);
        if (current.current.scale > fitted * 1.1) fit();
        else commit(zoomAt(current.current, fitted * 2, p.x, p.y));
        tap.current.time = 0;
      } else tap.current = { time: now, point: p };
      setMoving(false); return;
    }
    if (event.type === "pointercancel" || start.current.pinched || now - velocity.current.time > 100 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setMoving(false); return; }
    let vx = velocity.current.x, vy = velocity.current.y, previousTime = now;
    const animate = (time: number) => {
      const dt = Math.min(32, time - previousTime); previousTime = time;
      const old = current.current;
      const next = commit({ ...old, x: old.x + vx * dt, y: old.y + vy * dt });
      if (Math.abs(next.x - old.x) < 0.01) vx = 0;
      if (Math.abs(next.y - old.y) < 0.01) vy = 0;
      const friction = Math.exp(-dt / 180); vx *= friction; vy *= friction;
      if (Math.hypot(vx, vy) > 0.02) frame.current = requestAnimationFrame(animate);
      else { setMoving(false); setView({ ...current.current }); }
    };
    frame.current = requestAnimationFrame(animate);
  };
  const goToPage = (number: number) => {
    stop(); commit({ ...current.current, y: 8 - (number - 1) * (1123 * current.current.scale + 8) });
  };
  return { viewportRef, view, moving, fit, zoom, wholePage, goToPage, onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
    zoomPercent: Math.round(view.scale / fittedScale(size.current.width) * 100) };
}