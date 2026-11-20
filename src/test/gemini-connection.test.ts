import { afterEach, expect, it, vi } from "vitest";
import { geminiText } from "../lib/ai/gemini.server";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("streams Gemini through the linked server connection", async () => {
  vi.stubEnv("UDC_GEMINI_BERSA_API_KEY", "test-connection");
  vi.stubEnv("LOVABLE_API_KEY", "test-gateway");
  vi.stubEnv("GEMINI_API_KEY", "");
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
it("tries the next free model when one is over quota, without search grounding", async () => {
  vi.stubEnv("UDC_GEMINI_BERSA_API_KEY", "");
  vi.stubEnv("GEMINI_API_KEY", "test-provider");
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response("{}", { status: 429 }))
    .mockResolvedValueOnce(new Response("{}", { status: 404 }))
    .mockResolvedValue(new Response('data: {"candidates":[{"content":{"parts":[{"text":"Repli"}]}}]}\n\n'));
  vi.stubGlobal("fetch", fetcher);
  expect(await geminiText([{ role: "user", parts: [{ text: "Bonjour" }] }])).toBe("Repli");
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(JSON.parse(fetcher.mock.calls[0]?.[1].body).tools).toBeUndefined();
});
