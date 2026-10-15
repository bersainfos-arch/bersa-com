import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Attachment } from "@/lib/attachments";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Msg = { role: "user" | "assistant"; content: string };

export const ACTIONS: Record<string, string> = {
  generate: "Rédige le texte demandé, structuré et adapté à la longueur précisée, sans préambule inutile.",
  long_outline: "Élabore un plan universitaire rigoureux et symétrique (Chapitres, Sections, Paragraphes §, A et B) avec le nombre estimé de pages pour chaque partie.",
  long_chapter: "Rédige ce chapitre/section spécifique dans la continuité du plan général et du résumé des sections précédentes. Respecte l'équilibre et le style sans répéter ce qui a déjà été dit.",
  correct: "Corrige l'orthographe, la grammaire, la typographie et la ponctuation du texte. Renvoie uniquement le texte corrigé.",
  rephrase: "Reformule le texte dans un style soutenu, fluide et académique, tout en conservant le sens exact.",
  expand: "Développe et enrichis l'argumentation avec profondeur méthodologique, exemples et nuances conceptuelles.",
  summarize: "Produis une synthèse analytique fidèle, structurée et concise du texte suivant.",
  humanize: "Rends ce texte naturel, harmonieux et fluide, sans artifices ni clichés.",
  improve: "Améliore la clarté, l'élégance du style et l'enchaînement logique des idées.",
  continue: "Poursuis la rédaction dans la continuité exacte du ton, de la structure et du propos entamé.",
  outline: "Élabore un plan universitaire rigoureux et symétrique respectant la structure : CHAPITRE > Section > § > A > B.",
  suggest: "Formule des recommandations méthodologiques précises pour consolider ce travail de recherche.",
  translate: "Traduis le texte fidèlement (respect du registre de langue et du vocabulaire technique).",
  cv: "Rédige un CV professionnel complet, clair et valorisant selon les normes actuelles.",
  references: "Présente les références bibliographiques ou infrapaginales selon les normes académiques strictes (ouvrages, articles, J.O., jurisprudence, webographie). Marque toute référence incertaine de la mention [Référence à vérifier par l'auteur].",
  academic: "Applique la démarche de recherche scientifique universitaire : problématique, hypothèses, démonstration et règles de citation rigoureuses.",
  chat: "",
};

// Guide académique d'excellence BERSA (Directives Prof. Jules-Eminence NZUNDU NZALALEMBA)
const SYSTEM = `Tu es BERSA, l'assistant d'élite de recherche et de rédaction académique et scientifique de la plateforme Berceau du Savoir (slogan : « Le berceau du savoir, au service de votre plume », signature : « Transformez vos idées en résultats »).

DIRECTIVES MÉTHODOLOGIQUES ET SCIENTIFIQUES STRICTES :

1. STRUCTURE ET SYMÉTRIE OBLIGATOIRE DES TRAVAUX :
Tout travail universitaire doit impérativement obéir à la structure symétrique et hiérarchique suivante :
- INTRODUCTION GENERALE
-Etat de la question 
- Problématique
- Hypothèses
- Choix et intéret du sujet ou travail
Délimitation de l'étude: délimitation sur le temps, l'espace et matériel
Méthodes et techniques de recherche
Strucures du travail
 - CHAPITRE (ex. CHAPITRE 1 : ...)
  - Section (ex. Section 1 : ...)
    - Paragraphe § (ex. §1. ...)
      - Points alphabétiques majuscules (A. puis B.)
Règle d'or de symétrie : il n'y a pas de point A sans point B ; pas de paragraphe §1 sans §2 ; pas de Section 1 sans Section 2.
En cas de subdivisions ultérieures sous A ou B, suivre l'ordre : a. puis b. (pas de a sans b), puis 1. puis 2., puis 1.1.

2. RÈGLES DE RÉFÉRENCEMENT INFRAPAGINAL (BAS DE PAGE) :
Pour chaque source mentionnée, utilise le format académique précis :
a) Textes officiels & législatifs : Art. X, [Intitulé complet du texte], J.O. RDC (en italique ou mention officielle), date. (À la 2e citation : Art. Y, [Titre sommaire], précité(e)).
b) Jurisprudence : Nom de la juridiction (ex. C.S.J., Cour d'appel, TGI), numéro de rôle, parties en cause, date de la décision, recueil/bulletin, page.
c) Ouvrages doctrinaux : Initiale prénom. NOM EN MAJUSCULE, Titre de l'ouvrage en italique, Ville d'édition, Maison d'édition, Année, p. X. (Ex: M. VILLEY, Leçons d'histoire du droit, Paris, Dalloz, 1962, p. 1).
d) Articles de revue : Initiale prénom. NOM EN MAJUSCULE, « Titre de l'article entre guillemets », in Titre de la revue en italique, Vol./N°, Année, pp. X-Y.
e) Webographie : Initiale prénom. NOM, « Titre », Disponible sur : URL exacte, (Consulté le JJ mois AAAA, à HHh MM’).
f) Notes de cours : Initiale prénom. NOM, Titre du cours, Notes de cours destinés aux étudiants de [Promotion/Option], Université, inédit, Année, p. X.
g) Thèses : Initiale prénom. NOM, Titre de la thèse en italique, Thèse, Université, Année, p. X.
h) Expressions latines rigoureuses :
   - Idem, p. X : si référence identique à la note immédiatement précédente mais page différente.
   - Ibidem., p. X : si la note suivante se réfère encore au même ouvrage.
   - op. cit., p. X : pour un ouvrage cité antérieurement (non immédiatement précédent).
   - loc. cit., p. X : pour un article de revue cité antérieurement.

3. ANTI-HALLUCINATION ABSOLUE :
Ne fabrique JAMAIS d'auteurs, d'éditeurs, d'années de parution, d'articles de loi inexistants ou de jurisprudence imaginaire.
Si une donnée n'est pas certaine ou vérifiée dans le contexte fourni, note expressément : « [Référence à vérifier par l'auteur] ».

4. DISPOSITION TYPOGRAPHIQUE ET STYLE :
Rédige en français académique châtié, clair, neutre et rigoureux. Pas de puces fantaisistes : utilise les tirets simples ou la numérotation. N'utilise pas d'astérisques doubles ** pour les titres.`;

export const runWriter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: string; messages: Msg[]; attachments?: Attachment[]; docContext?: string }) => {
    const action = ACTIONS[input?.action] !== undefined ? input.action : "chat";
    const messages = (input?.messages ?? [])
      .slice(-12)
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 15000) })) as Msg[];
    if (!messages.length || !messages[messages.length - 1]?.content.trim()) throw new Error("Texte vide");
    const attachments = (input.attachments ?? []).slice(0, 3);
    for (const a of attachments) {
      if (!["text", "pdf", "image", "other"].includes(a.type) || a.content.length > 7 * 1024 * 1024 || a.name.length > 250) throw new Error("Pièce jointe invalide.");
      if (a.type === "image" && !["image/png", "image/jpeg", "image/webp"].includes(a.mediaType)) throw new Error("Image non prise en charge.");
    }
    return { action, messages, attachments, docContext: input?.docContext?.slice(0, 5000) };
  })
  .handler(async ({ data, context }) => {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) throw new Error("Assistant non configuré");
    const { data: q, error: qe } = await context.supabase.rpc("consume_ai_quota");
    if (qe) throw new Error("Quota indisponible");
    const quota = q as { ok: boolean; used: number; limit: number };
    if (!quota.ok) throw new Error(`QUOTA_EXHAUSTED: quota quotidien atteint (${quota.used}/${quota.limit}). Consultez les abonnements Standard ou Premium.`);

    let promptEnrichi = msgsContent(data.messages, data.action, data.docContext);

    const { geminiText } = await import("@/lib/ai/gemini.server");
    type Part = import("@/lib/ai/gemini.server").GeminiPart;
    const parts: Part[] = [{ text: promptEnrichi }];

    for (const a of data.attachments) {
      if (a.type === "text") parts.push({ text: `[Document source joint ${a.name}] :\n${a.content.slice(0, 50000)}` });
      if (a.type === "pdf") parts.push({ inline_data: { mime_type: "application/pdf", data: a.content } });
      if (a.type === "image") parts.push({ inline_data: { mime_type: a.mediaType, data: a.content } });
    }

    const { knowledgeContext } = await import("@/lib/knowledge.server");
    const knowledge = await knowledgeContext(context.supabase, data.messages[data.messages.length - 1]?.content ?? "");
    if (knowledge) parts.push({ text: `[SOURCES DOCUMENTAIRES RÉELLES CONSULTÉES VIA INTERNET & BERSA] :\n${knowledge}` });

    const contents = data.messages.slice(0, -1).map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "model" | "user",
      parts: [{ text: m.content }] as Part[],
    }));
    contents.push({ role: "user", parts });

    const text = await geminiText(contents, SYSTEM, getRequest().signal);
    if (!text.trim()) throw new Error("L’Assistant n’a pas produit de texte. La demande est terminée.");
    return { reply: text.replace(/\*\*?|__|^#+\s*/gm, "").trim(), used: quota.used, limit: quota.limit };
  });

function msgsContent(messages: Msg[], action: string, docContext?: string): string {
  const last = messages[messages.length - 1]?.content ?? "";
  const prefix = ACTIONS[action] ? `${ACTIONS[action]}\n\n` : "";
  const contextNote = docContext ? `[CONTEXTE GLOBAL DU DOCUMENT ET PLAN EN COURS] :\n${docContext}\n\n` : "";
  return `${prefix}${contextNote}${last}`;
}
