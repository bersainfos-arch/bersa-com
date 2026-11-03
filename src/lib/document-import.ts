let pendingFile: File | null = null;
export function queueDocumentFile(file: File) { pendingFile = file; }
export function takeDocumentFile() { const file = pendingFile; pendingFile = null; return file; }
export function sanitizeDocumentHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form,input,button,link,meta").forEach(el => el.remove());
  for (const el of doc.body.querySelectorAll("*")) for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("on") || attr.name === "style" || ((attr.name === "href" || attr.name === "src") && !/^(https?:|data:image\/(png|jpeg|webp);base64,|#)/i.test(attr.value))) el.removeAttribute(attr.name);
  }
  return doc.body.innerHTML;
}
export async function importDocumentFile(file: File): Promise<{ html: string }> {
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    if (!result.value.trim()) throw new Error("Document Word vide.");
    return { html: sanitizeDocumentHtml(result.value) };
  }
  if (/\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    try {
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const text = await page.getTextContent();
        pages.push(text.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join(""));
      }
    } finally { await pdf.cleanup(); }
    if (!pages.join("").trim()) throw new Error("PDF numérisé sans texte : ajoutez-le avec le trombone pour analyse.");
    return { html: pages.map(text => textHtml(text)).join('<div class="page-break"></div>') };
  }
  if (/\.(txt|md|csv)$/i.test(file.name)) return { html: textHtml(await file.text()) };
  throw new Error("Choisissez Word (.docx), PDF ou texte.");
}
function textHtml(text: string) {
  return text.split(/\n/).map(line => `<p>${line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`).join("");
}
