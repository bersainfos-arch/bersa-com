import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import type { PageSettings } from "./EditorRibbon";
import { updateFootnote, type FootnoteItem } from "@/lib/footnotes";
import { pageGeometry, formatPageNumber } from "@/lib/writer-layout";

/** Zone de texte qui revient à la ligne et grandit vers le bas au lieu de déborder du papier. */
function autoGrow(el: HTMLTextAreaElement | null) { if (!el) return; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }

export function WriterPaper({ editor, settings, setSettings, footnotes, children }: {
  editor: Editor | null;
  settings: PageSettings;
  setSettings: React.Dispatch<React.SetStateAction<PageSettings>>;
  footnotes: FootnoteItem[];
  children: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ width: 794, height: 1123, left: 0, top: 0, pages: 1 });
  useEffect(() => {
    if (!editor || !host.current) return;
    const sheet = editor.view.dom;
    sheet.dataset["noteReserve"] = String(footnotes.length ? Math.min(180, 25 + footnotes.length * 26) : 0);
    const measure = () => {
      if (!host.current) return;
      const rect = sheet.getBoundingClientRect(), parent = host.current.getBoundingClientRect();
      const geometry = pageGeometry(sheet.clientWidth);
      setLayout({ width: rect.width, height: geometry.height, left: rect.left - parent.left, top: rect.top - parent.top, pages: Number(sheet.dataset["pages"]) || 1 });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(sheet);
    const mutation = new MutationObserver(measure);
    mutation.observe(sheet, { attributes: true, attributeFilter: ["data-pages"] });
    sheet.dispatchEvent(new CustomEvent("writer-layout-change"));
    measure();
    return () => { resize.disconnect(); mutation.disconnect(); };
  }, [editor, footnotes.length, settings.margin, settings.orientation, settings.format]);
  const pageOf = (number: number) => {
    const sheet = editor?.view.dom;
    const ref = sheet?.querySelector(`[data-fn-num="${number}"]`);
    if (!sheet || !ref) return 0;
    return Math.min(layout.pages - 1, Math.max(0, Math.floor((ref.getBoundingClientRect().top - sheet.getBoundingClientRect().top) / (layout.height + 16))));
  };
  // Réserve réelle mesurée : une note longue qui revient à la ligne repousse le texte, sans chevaucher le corps.
  useEffect(() => {
    const sheet = editor?.view.dom, root = host.current;
    if (!sheet || !root) return;
    const heights = Array.from(root.querySelectorAll<HTMLElement>(".writer-internal-notes")).map(el => el.offsetHeight);
    const reserve = heights.length ? Math.min(layout.height * 0.45, Math.max(...heights) + 10) : 0;
    if (Math.abs((Number(sheet.dataset["noteReserve"]) || 0) - reserve) > 4) {
      sheet.dataset["noteReserve"] = String(Math.round(reserve));
      sheet.dispatchEvent(new CustomEvent("writer-layout-change"));
    }
  });
  const scale = layout.width / 794;
  const align = settings.pageNumberAlign || "center";
  return <div ref={host} className="writer-paper-host">
    {children}
    <div className="writer-margin-layer" style={{ width: layout.width, left: layout.left, top: layout.top, ["--margin-font" as string]: `${Math.max(6, 11 * scale)}px`, ["--note-font" as string]: `${Math.max(6, 10.5 * scale)}px` } as React.CSSProperties}>
      {Array.from({ length: layout.pages }, (_, index) => {
        const notes = footnotes.filter(fn => pageOf(fn.number) === index);
        const hidden = index === 0 && settings.differentFirstPage;
        const number = settings.pageNumbers ? <span className={`writer-page-number align-${align}`}>{formatPageNumber(index + 1, settings.pageNumberFormat)}</span> : null;
        return <div key={index} className="writer-page-margins" style={{ top: index * (layout.height + 16), height: layout.height }}>
          {!hidden && <textarea ref={autoGrow} rows={1} className="writer-internal-header" aria-label={`En-tête de la page ${index + 1}`} value={settings.headerText} onChange={e => { autoGrow(e.currentTarget); setSettings(s => ({ ...s, headerText: e.target.value })); }} />}
          <div className="writer-internal-bottom">
            {notes.length > 0 && <section className="writer-internal-notes" aria-label={`Notes de bas de page de la page ${index + 1}`}><hr />{notes.map(fn => <div key={fn.number} id={`fn-${fn.number}`} className="writer-note-row">
              <a href={`#fnref-${fn.number}`} onClick={e => { e.preventDefault(); editor?.view.dom.querySelector(`#fnref-${fn.number}`)?.scrollIntoView({ block: "center" }); }} aria-label={`Retour à la note ${fn.number}`}><sup>{fn.number}</sup></a>
              <textarea ref={autoGrow} rows={1} data-fn-input={fn.number} aria-label={`Note de bas de page ${fn.number}`} value={fn.note} onChange={e => { autoGrow(e.currentTarget); if (editor) updateFootnote(editor, fn.pos, e.target.value); }} />
            </div>)}</section>}
            {!hidden && <div className="writer-footer-row">
              {align === "left" && number}
              <textarea ref={autoGrow} rows={1} aria-label={`Pied de la page ${index + 1}`} value={settings.footerText} onChange={e => { autoGrow(e.currentTarget); setSettings(s => ({ ...s, footerText: e.target.value })); }} />
              {align !== "left" && number}
            </div>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
