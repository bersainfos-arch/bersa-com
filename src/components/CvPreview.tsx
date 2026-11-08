import { useEffect, useRef, useState } from "react";
/** Scale the A4 document to its container without changing exported markup. */
export function CvPreview({ html, compact = false }: { html: string; compact?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 0.2, height: 225 });
  useEffect(() => {
    const outer = container.current;
    const inner = paper.current;
    if (!outer || !inner) return;
    const measure = () => {
      const scale = Math.min(1, outer.clientWidth / 794);
      setSize({ scale, height: inner.scrollHeight * scale });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(outer); observer.observe(inner); measure();
    return () => observer.disconnect();
  }, [html]);
  return <div ref={container} className="w-full min-w-0 overflow-hidden" style={{ height: size.height }}>
    <div ref={paper} className={`w-[794px] origin-top-left ${compact ? "[&>div]:!min-h-0 [&>div>div>div]:!min-h-0" : ""}`} style={{ transform: `scale(${size.scale})` }} dangerouslySetInnerHTML={{ __html: html }} />
  </div>;
}