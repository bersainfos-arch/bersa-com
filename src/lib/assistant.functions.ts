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
    const { geminiText } = await import("@/lib/ai/gemini.server");
    const text = await geminiText(
      data.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      "Tu es l'assistant de la bibliothèque BERSA (slogan : « Le berceau du savoir, au service de votre plume »). Tu aides étudiants et chercheurs en droit, économie, IA, ingénierie, santé et sciences : orientation de lecture, méthodologie, explications claires. Réponds dans la langue de l'utilisateur, en moins de 200 mots. Pour une commande de rédaction, oriente vers l'onglet Rédaction.",
    );
    return { reply: text.trim() || "Désolé, je n'ai pas pu répondre." };
  });
