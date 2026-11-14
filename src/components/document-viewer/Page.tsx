import { Fragment } from "react";
import type { DocumentPage, PageBlock } from "./layout";

export function highlightedText(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = [];
  let start = 0;
  const lower = text.toLocaleLowerCase();
  const needle = query.toLocaleLowerCase();
  for (let index = lower.indexOf(needle); index >= 0; index = lower.indexOf(needle, start)) {
    parts.push(<Fragment key={`text-${start}`}>{text.slice(start, index)}</Fragment>);
    parts.push(<mark key={`match-${index}`}>{text.slice(index, index + query.length)}</mark>);
    start = index + query.length;
  }
  parts.push(<Fragment key={`end-${start}`}>{text.slice(start)}</Fragment>);
  return parts;
}

export type PageProps = {
  page: DocumentPage;
  number: number;
  header: string;
  gap: number;
  editable: boolean;
  query: string;
  onEdit: (block: PageBlock, text: string) => void;
};

export function Page({ page, number, header, gap, editable, query, onEdit }: PageProps) {
  return (
    <article className="dv-page" aria-label={`Page ${number}`} style={{ marginBottom: gap }}>
      <header className="dv-page-header">{number} | {header}</header>
      <div className="dv-page-body">
        {page.blocks.map(block => {
          const Tag = block.type === "title" ? "h2" : "p";
          return <Fragment key={block.id}>
            <Tag data-continuation={block.continuation}>
              <span contentEditable={editable} suppressContentEditableWarning onBlur={event => {
                if (editable) onEdit(block, event.currentTarget.innerText);
              }}>{editable ? block.text : highlightedText(block.text, query)}</span>
              {block.noteNumbers.map(number => <sup key={number}> {number}</sup>)}
            </Tag>
          </Fragment>;
        })}
      </div>
      {page.notes.length > 0 && <footer className="dv-notes" aria-label={`Notes de bas de page ${number}`}>
        {page.notes.map(note => <div className="dv-note" key={note.id}>
          <sup>{note.number}</sup><span>{highlightedText(note.text, query)}{note.continuation && " (suite)"}</span>
        </div>)}
      </footer>}
      <i className="dv-corner dv-corner-tl" aria-hidden="true" />
      <i className="dv-corner dv-corner-tr" aria-hidden="true" />
      <i className="dv-corner dv-corner-bl" aria-hidden="true" />
      <i className="dv-corner dv-corner-br" aria-hidden="true" />
    </article>
  );
}