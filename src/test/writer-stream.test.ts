import { afterEach, expect, it, vi } from "vitest";

const rpc = vi.fn();
const getUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser }, rpc }),
}));
vi.mock("@/lib/knowledge.server", () => ({ knowledgeContext: async () => "" }));
vi.mock("@/lib/writer.functions", () => ({ ACTIONS: { correct: "Corrige" } }));
vi.mock("@/lib/ai/gemini.server", () => ({
  geminiStream: async function* () {
    yield "Texte généré";
  },
  GeminiError: class extends Error {
    constructor(message: string, public status: number) {
      super(message);
    }
  },
}));

import { handleWriterStream } from "@/lib/writer-stream.server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const request = () =>
  new Request("https://bersa.test/api/writer", {
    method: "POST",
    headers: { Authorization: "Bearer test" },
    body: JSON.stringify({ action: "correct", text: "Bonjour" }),
  });

it("autorise l'accès fluide sans blocage de session", async () => {
  const result = await handleWriterStream(
    new Request("https://bersa.test/api/writer", {
      method: "POST",
      body: JSON.stringify({ action: "correct", text: "Bonjour" }),
    })
  );
  expect(result.status).toBe(200);
});

it("fonctionne même si la session utilisateur est expirée", async () => {
  vi.stubEnv("SUPABASE_URL", "https://service.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  getUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid") });
  const result = await handleWriterStream(request());
  expect(result.status).toBe(200);
});

it("bloque uniquement lorsque le quota quotidien est atteint", async () => {
  vi.stubEnv("SUPABASE_URL", "https://service.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  getUser.mockResolvedValue({ data: { user: { id: "test" } }, error: null });
  rpc.mockResolvedValue({ data: { ok: false, used: 20, limit: 20 }, error: null });
  const result = await handleWriterStream(request());
  expect(result.status).toBe(429);
  expect(await result.text()).toContain("(20/20). Renouvellement à 00:00 UTC.");
});
   
