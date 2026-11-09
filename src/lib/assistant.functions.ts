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
           "Tu es BERSA, l'assistant d'élite de recherche et de rédaction du Berceau du Savoir (slogan : « Le berceau du savoir, au service de votre plume »). Tu réponds avec rigueur académique, clarté et exhaustivité aux étudiants, enseignants et chercheurs. Développe chaque réponse de manière riche et détaillée, sans limite restrictive de mots. Si l'utilisateur demande un plan, un développement ou un document long, fournis une analyse approfondie et structurée.",
    );
    return { reply: text.trim() || "Désolé, je n'ai pas pu répondre." };
  });
