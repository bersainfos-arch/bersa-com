let pendingFile: File | null = null;
export function queueDocumentFile(file: File) { pendingFile = file; }
export function takeDocumentFile() { const file = pendingFile; pendingFile = null; return file; }
export function sanitizeDocumentHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Suppression des scripts et balises dangereuses, mais conservation des styles visuels
  doc.querySelectorAll("script,iframe,object,embed,form,input,button,link,meta").forEach(el => el.remove());
  
  for (const el of doc.body.querySelectorAll("*")) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      } else if (attr.name === "style") {
        // Préserver uniquement les styles sûrs (alignement, marges, interligne, couleurs)
        const safeStyles = attr.value
          .split(";")
          .filter(rule => /^(text-align|font-weight|font-style|color|background-color|margin|padding|border|line-height)/i.test(rule.trim()))
          .join("; ");
        if (safeStyles) {
          el.setAttribute("style", safeStyles);
        } else {
          el.removeAttribute("style");
        }
      } else if ((attr.name === "href" || attr.name === "src") && !/^(https?:|data:image\/(png|jpeg|webp);base64,|#)/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }
  return doc.body.innerHTML;
}
export async function importDocumentFile(file: File): Promise<{ html: string }> {
  // 1. Fichiers Word récents .docx
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    if (!result.value.trim()) throw new Error("Document Word vide.");
    return { html: sanitizeDocumentHtml(result.value) };
  }

  // 2. Fichiers Word classiques .doc ou HTML exportés
  if (/\.(doc|html|htm)$/i.test(file.name)) {
    const text = await file.text();
    if (/<\w+[^>]*>/.test(text)) {
      return { html: sanitizeDocumentHtml(text) };
    }
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      if (result.value.trim()) return { html: sanitizeDocumentHtml(result.value) };
    } catch {}
    return { html: textHtml(text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")) };
  }

  // 3. Fichiers PDF (extraction du texte et pagination)
  if (/\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist");
    try {
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
            pdfjs.GlobalWorkerOptions.workerSrc = (worker.default || worker) as unknown as string;
    } catch {}
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    try {
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const text = await page.getTextContent();
        pages.push(text.items.map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "")).join(""));
      }
    } finally {
      await pdf.cleanup();
    }
    if (!pages.join("").trim()) throw new Error("PDF numérisé sans texte modifiable.");
    return { html: pages.map((t) => textHtml(t)).join('<div class="page-break"></div>') };
  }

  // 4. Fichiers texte
  if (/\.(txt|md|csv)$/i.test(file.name)) return { html: textHtml(await file.text()) };

  throw new Error("Choisissez un fichier Word (.docx, .doc), PDF ou texte.");
}

function textHtml(text: string) {
  return text.split(/\n/).map(line => `<p>${line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`).join("");
}
