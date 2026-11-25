// Direct Google Gemini API (free tier key) — no Lovable AI credits consumed.
export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

// Modèles officiels actifs sur Google Gemini v1beta
const MODELS = [
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
];
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

function apiKey() {
  const connection = process.env["UDC_GEMINI_BERSA_API_KEY"];
  const gateway = process.env["LOVABLE_API_KEY"];
  if (connection && gateway) {
    return { base: "https://connector-gateway.lovable.dev/udc_gemini_bersa/v1beta/openai", gateway: true, headers: { Authorization: `Bearer ${gateway}`, "X-Connection-Api-Key": connection } };
  }
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new GeminiError("Assistant non configuré.", 503);
  return { base: BASE, gateway: false, headers: { "x-goog-api-key": key } };
}

async function failure(res: Response) {
  let message = `Assistant indisponible (${res.status}).`;
  // Provider errors can contain credentials; never forward their raw bodies.
  if (res.status === 429) message = "L’assistant est très sollicité, réessayez dans une minute.";
  return new GeminiError(message, res.status);
}

function body(contents: GeminiContent[], system?: string) {
  // Google Search grounding is not sent: on free keys it has a tiny separate quota and returned 429 for every request.
  return JSON.stringify({
    contents,
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: { temperature: 0.7, maxOutputTokens: 65536 },
  });
}

const RETRYABLE = new Set([400, 404, 429, 500, 502, 503, 504]);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function* geminiStream(contents: GeminiContent[], system?: string, signal?: AbortSignal) {
  const connection = apiKey();
  let res: Response | null = null;
  let lastError: GeminiError | null = null;
  // Two passes: per-minute free limits usually clear after a short pause.
  outer: for (let pass = 0; pass < 2; pass++) {
    if (pass > 0) { if (lastError?.status !== 429) break; await wait(2500); }
    for (const model of MODELS) {
      try {
        res = await fetch(connection.gateway ? `${connection.base}/chat/completions` : `${connection.base}/${model}:streamGenerateContent?alt=sse`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...connection.headers },
          body: connection.gateway ? JSON.stringify({ model, stream: true, temperature: 0.7, max_tokens: 65536,
            messages: [ ...(system ? [{ role: "system", content: system }] : []), ...contents.map(c => ({ role: c.role === "model" ? "assistant" : "user", content: c.parts.map(p => "text" in p ? { type: "text", text: p.text } : { type: "image_url", image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } }) })) ],
          }) : body(contents, system),
          ...(signal ? { signal } : {}),
        });
      } catch (e) {
        if (signal?.aborted) throw e;
        lastError = new GeminiError("Assistant momentanément injoignable.", 503);
        res = null;
        continue;
      }
      if (res.ok && res.body) break outer;
      lastError = await failure(res);
      await res.body?.cancel().catch(() => {});
      res = null;
      if (!RETRYABLE.has(lastError.status)) throw lastError;
    }
  }
  if (!res || !res.body) throw lastError ?? new GeminiError("Assistant indisponible.", 503);
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
        const text = connection.gateway ? ev?.choices?.[0]?.delta?.content ?? "" : (ev?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
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
