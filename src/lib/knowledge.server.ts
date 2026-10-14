import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Nettoyage de la requête pour extraire les mots-clés essentiels de recherche
function extractKeywords(text: string): string {
  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !/^(pour|dans|avec|cette|mais|vous|nous|votre|notre|faire|plus|tout)$/i.test(w))
    .slice(0, 6);
  return words.length ? words.join(" ") : text.slice(0, 60);
}

// Recherche encyclopédique Web (Wikipédia) avec liens vérifiés
async function fetchWebEncyclopedie(query: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const url = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BERSA-App/1.0 (contact: bersainfos@gmail.com)" },
      signal: signal ?? AbortSignal.timeout(2500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data?.query?.search ?? []).slice(0, 2);
    return items.map((it: { title: string; snippet: string }) => {
      const cleanSnippet = it.snippet.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"');
      const pageUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(it.title)}`;
      return `[Source Web / Encyclopédie] « ${it.title} » : ${cleanSnippet} (Lien : ${pageUrl})`;
    });
  } catch {
    return [];
  }
}

// Recherche académique et scientifique (OpenAlex : articles réels, thèses, auteurs)
async function fetchAcademicSources(query: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=2`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BERSA-App/1.0 (mailto:bersainfos@gmail.com)" },
      signal: signal ?? AbortSignal.timeout(2500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const works = (data?.results ?? []).slice(0, 2);
    return works.map((w: any) => {
      const authors = (w.authorships ?? [])
        .slice(0, 2)
        .map((a: any) => a.author?.display_name)
        .filter(Boolean)
        .join(", ");
      const year = w.publication_year ? ` (${w.publication_year})` : "";
      const doi = w.doi ? ` - ${w.doi}` : "";
      return `[Source Académique] « ${w.title} » par ${authors || "Collectif"}${year}${doi}`;
    });
  } catch {
    return [];
  }
}

export async function knowledgeContext(client: SupabaseClient<Database>, text: string): Promise<string> {
  const keywords = extractKeywords(text);

  // Exécution parallèle : BDD interne BERSA + Web Wikipédia + Articles académiques
  const [internalRes, webRes, academicRes] = await Promise.allSettled([
    client.rpc("search_bersa_knowledge", { query_text: text.slice(0, 1500) }),
    fetchWebEncyclopedie(keywords),
    fetchAcademicSources(keywords),
  ]);

  const sections: string[] = [];

  // 1. Documents internes de la plateforme BERSA
  if (internalRes.status === "fulfilled" && !internalRes.value.error) {
    const docs = (internalRes.value.data ?? []).map((k) => `Document BERSA : ${k.title}\n${k.content}`);
    if (docs.length) sections.push(...docs);
  }

  // 2. Données fiables issues du Web (Wikipédia)
  if (webRes.status === "fulfilled" && webRes.value.length) {
    sections.push("DONNÉES DU WEB EN DIRECT :\n" + webRes.value.join("\n"));
  }

  // 3. Références universitaires et scientifiques (OpenAlex)
  if (academicRes.status === "fulfilled" && academicRes.value.length) {
    sections.push("SOURCES ET ÉTUDES SCIENTIFIQUES RÉELLES :\n" + academicRes.value.join("\n"));
  }

  return sections.join("\n\n");
        }
