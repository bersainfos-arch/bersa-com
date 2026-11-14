/** Crée un vrai fichier PDF A4 à partir du contenu du document, sans passer par l'impression. */
export async function buildPdf(html: string, opts: { marginPx: number; lineSpacing: number; headerText?: string; footerText?: string; differentFirstPage?: boolean | undefined; pageNumbers?: boolean; columns?: number | undefined; landscape?: boolean }) {
  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const width = opts.landscape ? 1123 : 794, pageH = opts.landscape ? 794 : 1123;
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;background:#fff;color:#000;font-family:'Times New Roman',serif;font-size:13pt;line-height:${opts.lineSpacing};padding:${opts.marginPx}px;box-sizing:border-box;${opts.columns && opts.columns > 1 ? `column-count:${opts.columns};column-gap:24px;` : ""}`;
  host.innerHTML = html;
  const refs = Array.from(host.querySelectorAll<HTMLElement>("sup.footnote-ref"));
  if (refs.length) {
    const notes = document.createElement("section"); notes.style.cssText = "margin-top:24px;font-size:10pt;border-top:1px solid;width:100%";
    refs.forEach(ref => { const p = document.createElement("p"); p.textContent = `${ref.dataset["fnNum"]}. ${ref.dataset["note"] || ""}`; notes.appendChild(p); });
    host.appendChild(notes);
  }
  host.querySelectorAll("img").forEach(i => { (i as HTMLImageElement).style.maxWidth = "100%"; });
  document.body.appendChild(host);
  try {
    const url = await toPng(host, { pixelRatio: 2, backgroundColor: "#ffffff", width, height: host.scrollHeight });
    const wmm = opts.landscape ? 297 : 210, hmm = opts.landscape ? 210 : 297;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: opts.landscape ? "landscape" : "portrait" });
    const total = (host.scrollHeight / width) * wmm;
    const pages = Math.max(1, Math.ceil(total / hmm - 0.01));
    for (let i = 0; i < pages; i++) {
      if (i) pdf.addPage();
      pdf.addImage(url, "PNG", 0, -i * hmm, wmm, total);
      pdf.setFontSize(9);
      if (opts.headerText && !(opts.differentFirstPage && i === 0)) { pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, wmm, 12, "F"); pdf.text(opts.headerText, wmm / 2, 8, { align: "center" }); }
      pdf.setFillColor(255, 255, 255); pdf.rect(0, hmm - 12, wmm, 12, "F");
      if (!(opts.differentFirstPage && i === 0)) pdf.text(`${opts.footerText || ""}${opts.pageNumbers ? `  ${i + 1}` : ""}`, wmm / 2, hmm - 5, { align: "center" });
    }
    void pageH;
    return pdf.output("blob");
  } finally { host.remove(); }
}
