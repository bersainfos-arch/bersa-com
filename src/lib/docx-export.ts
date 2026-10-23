// Real Office Open XML (.docx) writer: builds WordprocessingML from Tiptap JSON
// and packs it in a ZIP archive (stored entries, CRC32) without external deps.

export type JNode = { type: string; attrs?: any; content?: JNode[]; text?: string; marks?: { type: string; attrs?: any }[] };
export type DocxOptions = { marginCm?: number; lineSpacing?: number; landscape?: boolean; headerText?: string; footerText?: string; pageNumbers?: boolean; title?: string };
type Img = { id: string; name: string; data: Uint8Array; ext: string; w: number; h: number };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const enc = new TextEncoder();

let CRC: Uint32Array | null = null;
export function crc32(data: Uint8Array) {
  if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const chunks: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name); const crc = crc32(f.data); const size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true);
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    chunks.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true);
    ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((a, c) => a + c.length, 0)); let p = 0;
  for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

const hex = (c?: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (a: any, i: number) => String(a[i]); if (!c) return ""; const m = c.trim().match(/^#?([0-9a-f]{6})$/i) || c.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i); if (!m) { const r = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return r ? [g(r,1), g(r,2), g(r,3)].map(n => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase() : ""; } return (m.length === 4 ? g(m,1) + g(m,1) + g(m,2) + g(m,2) + g(m,3) + g(m,3) : g(m,1)).toUpperCase(); };
const ptSize = (s?: string) => { if (!s) return 0; const n = parseFloat(s); if (!n) return 0; return Math.round((s.endsWith("px") ? n * 0.75 : n) * 2); };

function runs(nodes: JNode[] = []): string {
  return nodes.map(n => {
    if (n.type === "hardBreak") return "<w:r><w:br/></w:r>";
    if (n.type === "footnote") return `<w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>${esc(String(n.attrs?.number ?? "*"))}</w:t></w:r>`;
    if (n.type !== "text" || !n.text) return "";
    let pr = ""; let link = "";
    for (const m of n.marks ?? []) {
      if (m.type === "bold") pr += "<w:b/>";
      else if (m.type === "italic") pr += "<w:i/>";
      else if (m.type === "underline") pr += '<w:u w:val="single"/>';
      else if (m.type === "strike") pr += "<w:strike/>";
      else if (m.type === "subscript") pr += '<w:vertAlign w:val="subscript"/>';
      else if (m.type === "superscript") pr += '<w:vertAlign w:val="superscript"/>';
      else if (m.type === "highlight") pr += `<w:shd w:val="clear" w:color="auto" w:fill="${hex(m.attrs?.color) || "FFFF00"}"/>`;
      else if (m.type === "link") link = m.attrs?.href ?? "";
      else if (m.type === "textStyle") {
        const c = hex(m.attrs?.color); if (c) pr += `<w:color w:val="${c}"/>`;
        const f = m.attrs?.fontFamily?.split(",")[0]?.replace(/['"]/g, "").trim(); if (f) pr += `<w:rFonts w:ascii="${esc(f)}" w:hAnsi="${esc(f)}" w:cs="${esc(f)}"/>`;
        const sz = ptSize(m.attrs?.fontSize); if (sz) pr += `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
      }
    }
    if (link) pr += '<w:color w:val="1D4ED8"/><w:u w:val="single"/>';
    return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(n.text)}</w:t></w:r>`;
  }).join("");
}

function para(n: JNode, extra = "", style = ""): string {
  const al = n.attrs?.textAlign; const jc = al === "center" ? "center" : al === "right" ? "right" : al === "justify" ? "both" : "";
  const pPr = `${style ? `<w:pStyle w:val="${style}"/>` : ""}${extra}${jc ? `<w:jc w:val="${jc}"/>` : ""}`;
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}${runs(n.content)}</w:p>`;
}

function blocks(nodes: JNode[] = [], ctx: { imgs: Img[]; list?: { num: number; lvl: number } | undefined; widthTwips: number }): string {
  return nodes.map(n => {
    switch (n.type) {
      case "paragraph": return para(n, ctx.list ? `<w:numPr><w:ilvl w:val="${ctx.list.lvl}"/><w:numId w:val="${ctx.list.num}"/></w:numPr>` : "");
      case "heading": return para(n, "", `Heading${Math.min(3, n.attrs?.level ?? 1)}`);
      case "blockquote": return blocks(n.content, ctx).replace(/<w:p>(<w:pPr>)?/g, (_m, p) => `<w:p><w:pPr><w:ind w:left="720"/>${p ? "" : "</w:pPr>"}`);
      case "codeBlock": return (n.content?.[0]?.text ?? "").split("\n").map(l => `<w:p><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr><w:t xml:space="preserve">${esc(l)}</w:t></w:r></w:p>`).join("");
      case "bulletList": case "orderedList": {
        const lvl = ctx.list ? Math.min(ctx.list.lvl + 1, 8) : 0;
        const num = n.type === "bulletList" ? 1 : 2;
        return (n.content ?? []).map(li => blocks(li.content, { ...ctx, list: { num, lvl } })).join("");
      }
      case "horizontalRule": return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr></w:pPr></w:p>';
      case "pageBreak": return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      case "image": {
        const img = ctx.imgs.find(i => i.name === n.attrs?.src);
        if (!img) return "";
        const maxW = ctx.widthTwips * 635; // twips→EMU
        let cx = img.w * 9525, cy = img.h * 9525;
        if (cx > maxW) { cy = Math.round(cy * maxW / cx); cx = maxW; }
        return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${img.id.replace("rIdImg", "")}" name="Image"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="img"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${img.id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
      }
      case "table": {
        const rows = n.content ?? []; const cols = Math.max(1, ...rows.map(r => r.content?.length ?? 1));
        const cw = Math.floor(ctx.widthTwips / cols);
        const b = '<w:top w:val="single" w:sz="4" w:color="888888"/><w:left w:val="single" w:sz="4" w:color="888888"/><w:bottom w:val="single" w:sz="4" w:color="888888"/><w:right w:val="single" w:sz="4" w:color="888888"/><w:insideH w:val="single" w:sz="4" w:color="888888"/><w:insideV w:val="single" w:sz="4" w:color="888888"/>';
        return `<w:tbl><w:tblPr><w:tblW w:w="${cw * cols}" w:type="dxa"/><w:tblBorders>${b}</w:tblBorders><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${Array.from({ length: cols }, () => `<w:gridCol w:w="${cw}"/>`).join("")}</w:tblGrid>${rows.map(r => `<w:tr>${(r.content ?? []).map(c => `<w:tc><w:tcPr><w:tcW w:w="${cw}" w:type="dxa"/>${c.type === "tableHeader" ? '<w:shd w:val="clear" w:color="auto" w:fill="DBEAFE"/>' : ""}</w:tcPr>${blocks(c.content, { ...ctx, list: undefined, widthTwips: cw }) || "<w:p/>"}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl><w:p/>`;
      }
      default: return n.content ? blocks(n.content, ctx) : "";
    }
  }).join("");
}

function collectImages(n: JNode, out: string[]) { if (n.type === "image" && n.attrs?.src) out.push(n.attrs.src); n.content?.forEach(c => collectImages(c, out)); }

async function loadImage(src: string, idx: number): Promise<Img | null> {
  try {
    const blob = await (await fetch(src)).blob();
    let ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
    let data = new Uint8Array(await blob.arrayBuffer());
    const bmp = await createImageBitmap(blob);
    if (!["png", "jpg", "gif"].includes(ext)) { // convert webp/svg etc. to PNG
      const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height; c.getContext("2d")!.drawImage(bmp, 0, 0);
      data = new Uint8Array(await (await new Promise<Blob>(r => c.toBlob(b => r(b!), "image/png"))).arrayBuffer()); ext = "png";
    }
    return { id: `rIdImg${idx + 1}`, name: src, data, ext, w: bmp.width, h: bmp.height };
  } catch { return null; }
}

export async function buildDocx(doc: JNode, opts: DocxOptions = {}): Promise<Blob> {
  const srcs: string[] = []; collectImages(doc, srcs);
  const imgs = typeof window === "undefined" ? [] : (await Promise.all([...new Set(srcs)].map(loadImage))).filter(Boolean) as Img[];
  return new Blob([buildDocxBytes(doc, opts, imgs) as BlobPart], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

export function buildDocxBytes(doc: JNode, opts: DocxOptions = {}, imgs: Img[] = []): Uint8Array {
  const W = 11906, H = 16838; const m = Math.round((opts.marginCm ?? 2.5) * 567);
  const [pw, ph] = opts.landscape ? [H, W] : [W, H];
  const line = Math.round((opts.lineSpacing ?? 1.6) * 240);
  const body = blocks(doc.content, { imgs, widthTwips: pw - 2 * m }) || "<w:p/>";
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  const hasHeader = !!opts.headerText; const hasFooter = !!opts.footerText || opts.pageNumbers !== false;
  const sect = `<w:sectPr>${hasHeader ? '<w:headerReference w:type="default" r:id="rIdHeader"/>' : ""}${hasFooter ? '<w:footerReference w:type="default" r:id="rIdFooter"/>' : ""}<w:pgSz w:w="${pw}" w:h="${ph}"${opts.landscape ? ' w:orient="landscape"' : ""}/><w:pgMar w:top="${m}" w:right="${m}" w:bottom="${m}" w:left="${m}" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>`;
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}${sect}</w:body></w:document>`;
  const pageField = '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>';
  const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve">${esc(opts.headerText ?? "")}</w:t></w:r></w:p></w:hdr>`;
  const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${opts.footerText ? `<w:r><w:t xml:space="preserve">${esc(opts.footerText)}  </w:t></w:r>` : ""}${opts.pageNumbers !== false ? pageField : ""}</w:p></w:ftr>`;
  const hStyle = (i: number, sz: number) => `<w:style w:type="paragraph" w:styleId="Heading${i}"><w:name w:val="heading ${i}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="${i - 1}"/></w:pPr><w:rPr><w:b/><w:color w:val="1E3A8A"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr></w:style>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="${line}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${hStyle(1, 36)}${hStyle(2, 30)}${hStyle(3, 27)}</w:styles>`;
  const lvls = (fmt: string) => Array.from({ length: 9 }, (_, i) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${fmt === "bullet" ? (i % 2 ? "◦" : "•") : `%${i + 1}.`}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (i + 1)}" w:hanging="360"/></w:pPr></w:lvl>`).join("");
  const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0">${lvls("bullet")}</w:abstractNum><w:abstractNum w:abstractNumId="1">${lvls("decimal")}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;
  const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="${R}/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="${R}/numbering" Target="numbering.xml"/>${hasHeader ? `<Relationship Id="rIdHeader" Type="${R}/header" Target="header1.xml"/>` : ""}${hasFooter ? `<Relationship Id="rIdFooter" Type="${R}/footer" Target="footer1.xml"/>` : ""}${imgs.map(i => `<Relationship Id="${i.id}" Type="${R}/image" Target="media/${i.id}.${i.ext}"/>`).join("")}</Relationships>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>${hasHeader ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ""}${hasFooter ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ""}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const root = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(opts.title ?? "Document BERSA")}</dc:title><dc:creator>BERSA</dc:creator></cp:coreProperties>`;
  const files = [
    { name: "[Content_Types].xml", data: enc.encode(ct) },
    { name: "_rels/.rels", data: enc.encode(root) },
    { name: "docProps/core.xml", data: enc.encode(core) },
    { name: "word/document.xml", data: enc.encode(document) },
    { name: "word/styles.xml", data: enc.encode(styles) },
    { name: "word/numbering.xml", data: enc.encode(numbering) },
    { name: "word/_rels/document.xml.rels", data: enc.encode(rels) },
    ...(hasHeader ? [{ name: "word/header1.xml", data: enc.encode(header) }] : []),
    ...(hasFooter ? [{ name: "word/footer1.xml", data: enc.encode(footer) }] : []),
    ...imgs.map(i => ({ name: `word/media/${i.id}.${i.ext}`, data: i.data })),
  ];
  return zip(files);
}
