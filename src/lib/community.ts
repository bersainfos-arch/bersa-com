import { supabase } from "@/integrations/supabase/client";
export const currencies = ["USD", "CDF", "XAF", "XOF", "EUR"] as const;
export const SLIDE_INTERVAL = 4000;
export const SLIDE_LIMIT = 20;
export function convertedAmount(usd: number, currency: string, rate?: number) { return currency === "USD" ? usd : rate && rate > 0 ? Math.round(usd * rate * 100) / 100 : null; }
export function courseAccess(status: string) { return status === "active"; }
export async function uploadCommunity(userId: string, file: File) {
 if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("Fichier : 20 Mo maximum.");
 const path = `${userId}/${crypto.randomUUID()}.${file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "bin"}`;
 const { error } = await supabase.storage.from("community").upload(path, file); if (error) throw error; return path;
}
export async function signedCommunity(path: string) { const { data, error } = await supabase.storage.from("community").createSignedUrl(path, 300); if (error || !data) throw error ?? new Error("Fichier indisponible."); return data.signedUrl; }
export async function extractKnowledge(file: File) {
 if (/\.pdf$/i.test(file.name)) {
  const pdfjs = await import("pdfjs-dist"); const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url"); pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const text = await page.getTextContent(); pages.push(text.items.map(item => "str" in item ? item.str : "").join(" ")); }
  await pdf.cleanup(); const text = pages.join("\n"); if (!text.trim()) throw new Error("PDF sans texte : fournissez une version lisible ou une transcription."); return text.slice(0, 500000);
 }
 const { readAttachment } = await import("@/lib/attachments"); const result = await readAttachment(file); if (result.type !== "text") throw new Error("Ajoutez un PDF textuel, un fichier Word .docx ou un texte."); return result.content;
}