import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import type { PageSettings } from "./EditorRibbon";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteFootnote, updateFootnote, type FootnoteItem } from "@/lib/footnotes";
import { pageGeometry } from "@/lib/writer-layout";

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
  return <div ref={host} className="writer-paper-host">
    {children}
    <div className="writer-margin-layer" style={{ width: layout.width, left: layout.left, top: layout.top }}>
      {Array.from({ length: layout.pages }, (_, index) => {
        const notes = footnotes.filter(fn => pageOf(fn.number) === index);
        const hidden = index === 0 && settings.differentFirstPage;
        return <div key={index} className="writer-page-margins" style={{ top: index * (layout.height + 16), height: layout.height }}>
          {!hidden && <input className="writer-internal-header" aria-label={`En-tête de la page ${index + 1}`} value={settings.headerText} onChange={e => setSettings(s => ({ ...s, headerText: e.target.value }))} />}
          <div className="writer-internal-bottom">
            {notes.length > 0 && <section className="writer-internal-notes" aria-label={`Notes de la page ${index + 1}`}><hr />{notes.map(fn => <div key={fn.number} id={`fn-${fn.number}`} className="writer-note-row">
              <a href={`#fnref-${fn.number}`} onClick={e => { e.preventDefault(); editor?.view.dom.querySelector(`#fnref-${fn.number}`)?.scrollIntoView({ block: "center" }); }} aria-label={`Retour à la note ${fn.number}`}>{fn.number}</a>
              <input data-fn-input={fn.number} aria-label={`Texte de la note ${fn.number}`} value={fn.note} onChange={e => { if (editor) updateFootnote(editor, fn.pos, e.target.value); }} onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
              <Button size="icon" variant="ghost" aria-label={`Supprimer la note ${fn.number}`} onClick={() => { if (editor) deleteFootnote(editor, fn.pos); }}><Trash2 /></Button>
            </div>)}</section>}
            {!hidden && <div className="writer-footer-row"><input aria-label={`Pied de la page ${index + 1}`} value={settings.footerText} onChange={e => setSettings(s => ({ ...s, footerText: e.target.value }))} />{settings.pageNumbers && <span>{index + 1}</span>}</div>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}