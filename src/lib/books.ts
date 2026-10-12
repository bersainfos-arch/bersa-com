import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
export type Book = Database["public"]["Tables"]["books"]["Row"];
export function validateSummary(summary: string, generated: boolean, validated: boolean) {
 if (!summary.trim()) return "Un résumé est requis.";
 if (summary.length > 5000) return "Le résumé ne doit pas dépasser 5 000 caractères.";
 if (generated && !validated) return "Validez le résumé généré avant publication.";
 return null;
}
export function purchasable(book: Pick<Book, "status" | "currency" | "price_usd" | "file_path">) {
 return book.status === "published" && book.currency === "USD" && (book.price_usd ?? 0) > 0 && Boolean(book.file_path);
}
export async function downloadBook(id: string) {
 const { data: allowed, error: issue } = await supabase.rpc("can_access_book", { _book: id });
 if (issue || !allowed) throw new Error("Téléchargement disponible uniquement après paiement vérifié.");
 const { data: book } = await supabase.from("books").select("file_path").eq("id", id).single();
 let url: string | undefined;
 if (book?.file_path) {
  const { data, error } = await supabase.storage.from("books").createSignedUrl(book.file_path, 60, { download: true });
  if (error) throw new Error("Fichier indisponible."); url = data?.signedUrl;
 } else {
  const { data } = await supabase.from("book_links").select("external_link").eq("book_id", id).maybeSingle();
  if (data?.external_link && /^https:\/\//.test(data.external_link)) url = data.external_link;
 }
 if (!url) throw new Error("Aucun fichier disponible.");
 const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.click();
}