import { createClient } from "@supabase/supabase-js";
import { transcribe } from "./ai/transcribe.server";
const MAX_BODY = 24 * 1024 * 1024;
export async function handleTranscription(request: Request) {
 const url = process.env["SUPABASE_URL"]; const key = process.env["SUPABASE_PUBLISHABLE_KEY"]; const aiKey = process.env["LOVABLE_API_KEY"];
 if (!url || !key || !aiKey) return new Response("Transcription non configurée.", { status: 503 });
 const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
 if (!token) return new Response("Connexion requise.", { status: 401 });
 const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch(input, init) { const headers = new Headers(init?.headers); headers.set("apikey", key); if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); return fetch(input, { ...init, headers }); } } });
 const { data, error } = await client.auth.getUser(token);
 if (error || !data.user) return new Response("Connexion requise.", { status: 401 });
 if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY || !request.body) return new Response("Audio trop volumineux.", { status: 413 });
 try {
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const item = await reader.read(); if (item.done) break; size += item.value.byteLength; if (size > MAX_BODY) { await reader.cancel(); return new Response("Audio trop volumineux.", { status: 413 }); } chunks.push(item.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("Content-Type") ?? "" } }).formData(); const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 23 * 1024 * 1024 || !file.type.startsWith("audio/")) return new Response("Fichier audio invalide.", { status: 400 });
  const response = await transcribe({ baseURL: "https://ai.gateway.lovable.dev", apiKey: aiKey, model: "openai/gpt-transcribe", maxFileBytes: 23 * 1024 * 1024, audioOnly: false }, file, { language: "fr", signal: request.signal });
  return new Response(response.body, { status: response.status, headers: { "Content-Type": response.headers.get("Content-Type") ?? "text/event-stream", "Cache-Control": "no-store" } });
 } catch (e) { if (request.signal.aborted) return new Response(null, { status: 499 }); return new Response(e instanceof Error ? e.message : "Transcription impossible.", { status: 400 }); }
}