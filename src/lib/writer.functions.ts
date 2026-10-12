import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant"; content: string };

export const ACTIONS: Record<string, string> = {
  generate: "Rédige un texte complet, long et structuré sur le sujet suivant.",
  correct: "Corrige l'orthographe, la grammaire et la ponctuation du texte suivant. Renvoie uniquement le texte corrigé.",
  rephrase: "Reformule le texte suivant dans un style clair et soutenu.",
  expand: "Développe et enrichis le texte suivant avec plus de détails et d'arguments.",
  summarize: "Résume le texte suivant de façon claire et fidèle.",
  improve: "Améliore le style, la clarté et la cohérence du texte suivant.",
  continue: "Poursuis la rédaction du texte suivant dans le même style.",
  outline: "Propose un plan détaillé (parties, chapitres, sections numérotées) pour le sujet suivant.",
  suggest: "Donne des suggestions concrètes pour améliorer ou approfondir ce travail.",
  translate: "Traduis le texte suivant (français ↔ anglais selon la langue d'origine).",
  cv: "Rédige un CV professionnel bien structuré à partir des informations suivantes.",
  references: "Propose des références bibliographiques au format APA, réelles et vérifiables, sur le sujet suivant. Indique de les vérifier.",
  academic: "Aide académique : réponds avec rigueur méthodologique à la demande suivante.",
  chat: "",
};

const SYSTEM =
  "Tu es BERSA, assistant de rédaction professionnel de la plateforme Berceau du Savoir (slogan : « Le berceau du savoir, au service de votre plume »). Tu rédiges en français sauf demande contraire, des textes structurés et soignés, adaptés au contexte de la RDC et de l'Afrique centrale. N'utilise ni markdown ni astérisques : titres en majuscules, listes avec tirets simples. Ne cite jamais d'année future. Pour une commande de rédaction payante, oriente vers l'onglet Rédaction ou WhatsApp +243 818 147 637.";

export const runWriter = createServerFn({ method: "POST" })
  .inputValidator((input: { action: string; messages: Msg[] }) => {
    const action = ACTIONS[input?.action] !== undefined ? input.action : "chat";
    const messages = (input?.messages ?? [])
      .slice(-12)
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 15000) })) as Msg[];
    if (!messages.length || !messages[messages.length - 1]?.content.trim()) throw new Error("Texte vide");
    return { action, messages };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Assistant non configuré");
    const msgs = data.messages.map((m, i) =>
      i === data.messages.length - 1 && ACTIONS[data.action]
        ? { ...m, content: `${ACTIONS[data.action]}\n\n${m.content}` }
        : m,
    );
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: SYSTEM,
        input: msgs,
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) throw new Error("Trop de demandes, réessayez dans un instant.");
      if (res.status === 402) throw new Error("Crédits IA épuisés.");
      throw new Error(`Assistant indisponible (${res.status})`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const p = line.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") text += ev.delta;
        } catch {
          /* ignore */
        }
      }
    }
    const clean = text.replace(/\*\*?|__|^#+\s*/gm, "").trim();
    return { reply: clean || "Désolé, je n'ai pas pu répondre." };
  });
