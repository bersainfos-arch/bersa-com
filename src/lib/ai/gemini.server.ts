// Direct Google Gemini API (free tier key) — no Lovable AI credits consumed.
export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

const MODELS = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"];
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

function apiKey() {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new GeminiError("Assistant non configuré.", 503);
  return key;
}

async function failure(res: Response) {
  let message = `Assistant indisponible (${res.status}).`;
  try { const b = await res.json(); message = b?.error?.message ?? message; } catch { /* keep */ }
  if (res.status === 429) message = "Limite gratuite de l’IA atteinte, réessayez dans un instant.";
  return new GeminiError(message, res.status);
}

function body(contents: GeminiContent[], system?: string) {
  return JSON.stringify({
    contents,
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
  });
}

export async function* geminiStream(contents: GeminiContent[], system?: string, signal?: AbortSignal) {
  const res = await fetch(`${BASE}/${MODEL}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
    body: body(contents, system),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok || !res.body) throw await failure(res);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      try {
        const ev = JSON.parse(line.slice(5).trim());
        const text = (ev?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
        if (text) yield text;
      } catch { /* ignore partial */ }
    }
  }
}

export async function geminiText(contents: GeminiContent[], system?: string, signal?: AbortSignal) {
  let out = "";
  for await (const t of geminiStream(contents, system, signal)) out += t;
  return out;
}
