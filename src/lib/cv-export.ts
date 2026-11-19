/** Single-page A4 CV export: captures the rendered CV exactly as shown, fitted on one page. */
export const A4_W = 794;
export const A4_H = 1123;

/** Scale factor so content of height h fits one A4 page (never enlarges). */
export function onePageScale(contentHeight: number): number {
  return contentHeight > A4_H ? A4_H / contentHeight : 1;
}

export async function renderCvPage(paper: HTMLElement, pixelRatio = 3): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  const clone = paper.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, { transform: "none", position: "fixed", left: "-10000px", top: "0", width: `${A4_W}px`, background: "#ffffff" });
  document.body.appendChild(clone);
  try {
    await document.fonts.ready;
    await Promise.all(Array.from(clone.querySelectorAll("img")).map((img) => img.decode().catch(() => {})));
    const h = Math.max(A4_H, clone.scrollHeight);
    const shot = await toCanvas(clone, { pixelRatio, width: A4_W, height: h, backgroundColor: "#ffffff", cacheBust: true });
    const page = document.createElement("canvas");
    page.width = A4_W * pixelRatio;
    page.height = A4_H * pixelRatio;
    const ctx = page.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, page.width, page.height);
    const s = onePageScale(h);
    const w = page.width * s;
    ctx.drawImage(shot, (page.width - w) / 2, 0, w, page.height * (h / A4_H) * s);
    return page;
  } finally {
    clone.remove();
  }
}

export async function cvPdfBlob(page: HTMLCanvasElement): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  pdf.addImage(page.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);
  return pdf.output("blob");
}

export function cvPngBlob(page: HTMLCanvasElement): Promise<Blob> {
  return new Promise((ok, ko) => page.toBlob((b) => (b ? ok(b) : ko(new Error("png"))), "image/png"));
}

export async function cvDocxBlob(page: HTMLCanvasElement): Promise<Blob> {
  const { Document, Packer, Paragraph, ImageRun } = await import("docx");
  const png = await (await cvPngBlob(page)).arrayBuffer();
  const doc = new Document({
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 } } },
      children: [new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [new ImageRun({ type: "png", data: png, transformation: { width: A4_W, height: A4_H - 2 } })] })],
    }],
  });
  return Packer.toBlob(doc);
}
