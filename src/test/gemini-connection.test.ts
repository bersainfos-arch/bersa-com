import { afterEach, expect, it, vi } from "vitest";
import { geminiText } from "../lib/ai/gemini.server";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("streams Gemini through the linked server connection", async () => {
  vi.stubEnv("UDC_GEMINI_BERSA_API_KEY", "test-connection");
  vi.stubEnv("LOVABLE_API_KEY", "test-gateway");
  const fetcher = vi.fn().mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"Bonjour BERSA"}}]}\n\ndata: [DONE]\n\n'));
  vi.stubGlobal("fetch", fetcher);
  expect(await geminiText([{ role: "user", parts: [{ text: "Bonjour" }] }])).toBe("Bonjour BERSA");
  expect(fetcher.mock.calls[0]?.[0]).toBe("https://connector-gateway.lovable.dev/udc_gemini_bersa/v1beta/openai/chat/completions");
});

it("does not expose provider error bodies to callers", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-provider");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":{"message":"private-provider-diagnostic"}}', { status: 401 })));
  await expect(geminiText([{ role: "user", parts: [{ text: "Bonjour" }] }])).rejects.toThrow("Assistant indisponible (401).");
});