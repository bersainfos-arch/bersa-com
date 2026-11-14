export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
export const PAGE_MARGIN = (2.5 / 2.54) * 96;
export const TEXT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN;
export const PARAGRAPH_INDENT = (1.25 / 2.54) * 96;
export const PAGE_GAP = 8;
export const MAX_ZOOM = 4;
export const BODY_LINE = (11 * 96 / 72) * 1.5;
const NOTE_LINE = (8 * 96 / 72) * 1.5;
export const BODY_HEIGHT = PAGE_HEIGHT - 2 * PAGE_MARGIN;

export type DocumentBlock =
  | { id: string; type: "title" | "paragraph"; text: string }
  | { id: string; type: "note"; text: string; referenceId: string };
export type PageBlock = {
  id: string;
  sourceId: string;
  type: "title" | "paragraph";
  text: string;
  start: number;
  end: number;
  continuation: boolean;
  noteNumbers: number[];
};
export type PageNote = { id: string; sourceId: string; text: string; number: number; continuation: boolean };
export type DocumentPage = { blocks: PageBlock[]; notes: PageNote[] };
export type MeasureText = (text: string, kind: "title" | "paragraph" | "note") => number;
export type View = { scale: number; x: number; y: number };

export function fittedScale(width: number): number {
  return Math.max(1, width - 16) / TEXT_WIDTH;
}

export function initialView(width: number): View {
  const scale = fittedScale(width);
  return { scale, x: 8 - PAGE_MARGIN * scale, y: 8 };
}

export function stackHeight(pages: number, scale: number): number {
  return pages * PAGE_HEIGHT * scale + Math.max(0, pages - 1) * PAGE_GAP;
}

export function clampView(view: View, width: number, height: number, pages: number, minimum: number): View {
  const scale = Math.min(fittedScale(width) * MAX_ZOOM, Math.max(minimum, view.scale));
  const pageWidth = PAGE_WIDTH * scale;
  const atMinimum = Math.abs(scale - fittedScale(width)) < 0.00001;
  const x = atMinimum ? initialView(width).x
    : pageWidth <= width ? (width - pageWidth) / 2
    : Math.max(width - pageWidth, Math.min(0, view.x));
  return { scale, x, y: Math.min(8, Math.max(Math.min(8, height - stackHeight(pages, scale) - 8), view.y)) };
}

export function zoomAt(view: View, scale: number, x: number, y: number): View {
  const ratio = scale / view.scale;
  return { scale, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio };
}

/** Keep offsets into the original string: editing a fragment never discards its siblings. */
function lines(text: string, kind: "title" | "paragraph" | "note", measure: MeasureText): Array<{ start: number; end: number }> {
  if (!text) return [{ start: 0, end: 0 }];
  const result: Array<{ start: number; end: number }> = [];
  let start = 0;
  while (start < text.length) {
    const available = TEXT_WIDTH - (kind === "paragraph" && start === 0 ? PARAGRAPH_INDENT : kind === "note" ? 20 : 0);
    let lo = start + 1;
    let hi = text.indexOf("\n", start);
    if (hi < 0) hi = text.length;
    const newline = hi;
    let end = start;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (measure(text.slice(start, mid), kind) <= available) { end = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    end = Math.max(start + 1, end);
    if (end < newline) {
      const space = text.lastIndexOf(" ", end - 1);
      if (space > start) end = space + 1;
    } else if (newline < text.length) end = newline + 1;
    result.push({ start, end });
    start = end;
  }
  return result;
}

/** Deterministic pagination at reference A4 size, independent of device zoom. */
export function paginateBlocks(blocks: readonly DocumentBlock[], measure: MeasureText): DocumentPage[] {
  const pages: DocumentPage[] = [];
  let page: DocumentPage = { blocks: [], notes: [] };
  let used = 0;
  let reserved = 0;
  const flush = () => { if (page.blocks.length || page.notes.length) pages.push(page); page = { blocks: [], notes: [] }; used = 0; reserved = 0; };
  const allNotes = blocks.filter((block): block is Extract<DocumentBlock, { type: "note" }> => block.type === "note");
  for (const block of blocks) {
    if (block.type === "note") continue;
    const attached = allNotes.filter(note => note.referenceId === block.id);
    const pending = attached.map(note => ({ note, rows: lines(note.text, "note", measure), number: allNotes.indexOf(note) + 1 }));
    const noteHeight = pending.reduce((sum, item) => sum + item.rows.length * NOTE_LINE + 4, 0);
    // A long note is continued on dedicated pages rather than clipped off the paper.
    const firstReserve = pending.length ? Math.min(noteHeight, BODY_HEIGHT * 0.45) + 20 : 0;
    const rows = lines(block.text, block.type, measure);
    const lineHeight = block.type === "title" ? 24 : BODY_LINE;
    if (used && BODY_HEIGHT - used - reserved - firstReserve < lineHeight * Math.min(rows.length, 2) + 12) flush();
    const firstPage = page;
    let rowIndex = 0;
    while (rowIndex < rows.length) {
      const extraReserve = page === firstPage ? firstReserve : 0;
      const capacity = Math.floor((BODY_HEIGHT - used - reserved - extraReserve - 12) / lineHeight);
      if (capacity < 1) { flush(); continue; }
      const count = Math.min(capacity, rows.length - rowIndex);
      const first = rows[rowIndex];
      const last = rows[rowIndex + count - 1];
      if (!first || !last) break;
      page.blocks.push({ id: `${block.id}-${first.start}`, sourceId: block.id, type: block.type, text: block.text.slice(first.start, last.end), start: first.start, end: last.end, continuation: rowIndex > 0, noteNumbers: rowIndex === 0 ? pending.map(item => item.number) : [] });
      used += count * lineHeight + 12;
      rowIndex += count;
      if (page === firstPage && pending.length) {
        let remaining = firstReserve - 20;
        for (const item of pending) {
          const take = Math.max(0, Math.min(item.rows.length, Math.floor((remaining - 4) / NOTE_LINE)));
          const end = item.rows[take - 1]?.end ?? 0;
          if (take) page.notes.push({ id: item.note.id, sourceId: item.note.id, number: item.number, text: item.note.text.slice(0, end), continuation: false });
          item.rows = item.rows.slice(take);
          remaining -= take * NOTE_LINE + 4;
        }
        reserved += firstReserve;
      }
      if (rowIndex < rows.length) flush();
    }
    // Notes start on the page of their reference; overflow retains its number at the foot of following pages.
    if (pending.some(item => item.rows.length)) {
      flush();
      for (const item of pending) {
        while (item.rows.length) {
          const take = Math.max(1, Math.floor((BODY_HEIGHT - reserved - 24) / NOTE_LINE));
          const segment = item.rows.splice(0, take);
          const first = segment[0];
          const last = segment.at(-1);
          if (!first || !last) break;
          page.notes.push({ id: `${item.note.id}-${first.start}`, sourceId: item.note.id, number: item.number, text: item.note.text.slice(first.start, last.end), continuation: first.start > 0 });
          reserved += segment.length * NOTE_LINE + 24;
          if (item.rows.length) flush();
        }
      }
      flush();
    }
  }
  flush();
  // Rejecting orphan notes silently would lose user content. Give them their own page instead.
  for (const note of allNotes.filter(note => !blocks.some(block => block.type !== "note" && block.id === note.referenceId))) {
    const rows = lines(note.text, "note", measure);
    const capacity = Math.floor((BODY_HEIGHT - 24) / NOTE_LINE);
    for (let i = 0; i < rows.length; i += capacity) {
      const first = rows[i]; const last = rows[Math.min(i + capacity - 1, rows.length - 1)];
      if (first && last) pages.push({ blocks: [], notes: [{ id: `${note.id}-${i}`, sourceId: note.id, number: allNotes.indexOf(note) + 1, text: note.text.slice(first.start, last.end), continuation: i > 0 }] });
    }
  }
  return pages.length ? pages : [{ blocks: [], notes: [] }];
}