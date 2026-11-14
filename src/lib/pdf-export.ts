import { formatPageNumber } from "./writer-layout";
/** Paginate exported blocks and keep each note with its reference page. */
export async function buildPdf(html: string, opts: { marginPx: number; lineSpacing: number; headerText?: string; footerText?: string; differentFirstPage?: boolean | undefined; pageNumbers?: boolean; pageNumberAlign?: "left" | "center" | "right" | undefined; pageNumberFormat?: "arabic" | "roman" | undefined; columns?: number | undefined; landscape?: boolean }) {
  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const width = opts.landscape ? 1123 : 794, pageH = opts.landscape ? 794 : 1123;
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;color:#000;font-family:'Times New Roman',serif;font-size:13pt;line-height:${opts.lineSpacing};`;
  const source = document.createElement("div"); source.innerHTML = html;
  document.body.appendChild(host);
  const pages: { sheet: HTMLDivElement; body: HTMLDivElement; notes: HTMLDivElement }[] = [];
  const makePage = () => {
    const sheet = document.createElement("div");
    sheet.style.cssText = `position:relative;width:${width}px;height:${pageH}px;background:#fff;padding:${opts.marginPx}px;box-sizing:border-box;`;
    const body = document.createElement("div");
    if (opts.columns && opts.columns > 1) body.style.cssText = `column-count:${opts.columns};column-gap:24px;`;
    const notes = document.createElement("div");
    notes.style.cssText = `position:absolute;bottom:${opts.marginPx / 2}px;left:${opts.marginPx}px;right:${opts.marginPx}px;font-size:10pt;line-height:1.3;`;
    sheet.append(body, notes); host.appendChild(sheet);
    const page = { sheet, body, notes }; pages.push(page); return page;
  };
  const refreshNotes = (page: typeof pages[number]) => {
    page.notes.replaceChildren();
    const refs = page.body.querySelectorAll<HTMLElement>("sup.footnote-ref");
    if (!refs.length) return;
    const rule = document.createElement("hr"); rule.style.cssText = "width:30%;margin:0 0 8px;border:0;border-top:1px solid currentColor;"; page.notes.appendChild(rule);
    refs.forEach(ref => { const p = document.createElement("p"); p.style.margin = "2px 0"; p.textContent = `${ref.dataset["fnNum"]}. ${ref.dataset["note"] || ""}`; page.notes.appendChild(p); });
  };
  try {
    let page = makePage();
    for (const node of Array.from(source.childNodes)) {
      if (node instanceof HTMLElement && (node.classList.contains("page-break") || node.dataset["type"] === "page-break")) { page = makePage(); continue; }
      page.body.appendChild(node);
      if (node instanceof HTMLElement) {
        node.querySelectorAll("img").forEach(img => { img.style.maxWidth = "100%"; });
        await Promise.all(Array.from(node.querySelectorAll("img")).map(img => img.decode().catch(() => undefined)));
      }
      refreshNotes(page);
      const capacity = pageH - opts.marginPx * 2 - page.notes.offsetHeight;
      if (page.body.childNodes.length > 1 && page.body.getBoundingClientRect().height > capacity) {
        node.remove(); refreshNotes(page); page = makePage(); page.body.appendChild(node); refreshNotes(page);
      }
    }
    const wmm = opts.landscape ? 297 : 210, hmm = opts.landscape ? 210 : 297;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: opts.landscape ? "landscape" : "portrait" });
    for (const [i, page] of pages.entries()) {
      if (i) pdf.addPage();
      const url = await toPng(page.sheet, { pixelRatio: 2, backgroundColor: "#ffffff", width, height: pageH });
      pdf.addImage(url, "PNG", 0, 0, wmm, hmm);
      pdf.setFontSize(9);
      if (!(opts.differentFirstPage && i === 0)) {
        if (opts.headerText) pdf.text(opts.headerText, wmm / 2, 8, { align: "center" });
        if (opts.footerText) pdf.text(opts.footerText, wmm / 2, hmm - 5, { align: "center" });
        if (opts.pageNumbers) {
          const align = opts.pageNumberAlign || "center";
          const x = align === "left" ? 20 : align === "right" ? wmm - 20 : wmm / 2;
          pdf.text(formatPageNumber(i + 1, opts.pageNumberFormat), x, hmm - (opts.footerText && align === "center" ? 9 : 5), { align });
        }
      }
    }
    return pdf.output("blob");
  } finally { host.remove(); }
}
