import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant"; content: string };

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: Msg[] }) => {
    const messages = (input?.messages ?? [])
      .slice(-10)
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })) as Msg[];
    if (!messages.length) throw new Error("Message vide");
    return { messages };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Assistant non configuré");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "Tu es l'assistant de la bibliothèque BERSA (slogan : « Le berceau du savoir, au service de votre plume »). Tu aides étudiants et chercheurs en droit, économie, IA, ingénierie, santé et sciences : orientation de lecture, méthodologie, explications claires. Réponds dans la langue de l'utilisateur, en moins de 200 mots. Pour une commande de rédaction, oriente vers l'onglet Rédaction ou WhatsApp +243 818 147 637.",
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
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
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta;
        } catch {
          /* ignore */
        }
      }
    }
    return { reply: text.trim() || "Désolé, je n'ai pas pu répondre." };
  });
