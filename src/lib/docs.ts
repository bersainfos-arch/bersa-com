export const CATEGORIES = [
  { id: "general", label: "Général" },
  { id: "academique", label: "Académique" },
  { id: "administratif", label: "Administratif" },
  { id: "juridique", label: "Juridique" },
] as const;

export const MAX_CHARS = 30000;

export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function exportHtml(title: string, html: string) {
  const doc = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title.replace(/</g, "&lt;")}</title><style>body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.6;max-width:794px;margin:40px auto;padding:0 60px}</style></head><body>${html}</body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
  a.download = (title || "document") + ".html";
  a.click();
  URL.revokeObjectURL(a.href);
}
