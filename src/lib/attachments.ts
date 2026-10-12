export type Attachment = { name: string; type: "text" | "pdf" | "image" | "other"; content: string; mediaType: string };
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export async function readAttachment(file: File): Promise<Attachment> {
  if (!file.size || file.size > MAX_ATTACHMENT_BYTES) throw new Error("Fichier vide ou supérieur à 5 Mo.");
  const base = { name: file.name, mediaType: file.type };
  if (/\.(txt|md|csv|json|rtf)$/i.test(file.name) || file.type.startsWith("text/")) return { ...base, type: "text", content: (await file.text()).slice(0, 50000) };
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!result.value.trim()) throw new Error("Ce document ne contient pas de texte lisible.");
    return { ...base, type: "text", content: result.value.slice(0, 50000) };
  }
  const pdf = /\.pdf$/i.test(file.name);
  const image = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
  if (pdf || image) {
    const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(file); });
    return { ...base, type: pdf ? "pdf" : "image", mediaType: pdf ? "application/pdf" : file.type, content };
  }
  return { ...base, type: "other", content: "" };
}