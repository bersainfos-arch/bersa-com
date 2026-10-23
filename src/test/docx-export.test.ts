import { describe, it, expect } from "vitest";
import mammoth from "mammoth";
import { buildDocxBytes, crc32 } from "@/lib/docx-export";

const doc = { type: "doc", content: [
  { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Mémoire de fin d'études" }] },
  { type: "paragraph", content: [{ type: "text", text: "Texte en gras", marks: [{ type: "bold" }] }] },
  { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Point A" }] }] }] },
  { type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Cellule" }] }] }] }] },
] };

describe("export Word réel", () => {
  it("produit une archive ZIP .docx (signature PK) et non du HTML", () => {
    const bytes = buildDocxBytes(doc);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
  it("le fichier se relit comme un document Word avec titre, gras, liste et tableau", async () => {
    const bytes = buildDocxBytes(doc);
    const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    expect(value).toContain("<h1>Mémoire de fin d'études</h1>");
    expect(value).toContain("<strong>Texte en gras</strong>");
    expect(value).toContain("<li>Point A</li>");
    expect(value).toContain("<td><p>Cellule</p></td>");
  });
  it("calcule le CRC32 standard", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});
