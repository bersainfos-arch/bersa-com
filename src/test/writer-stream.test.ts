import { afterEach, expect, it, vi } from "vitest";
const rpc = vi.fn();
const getUser = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser }, rpc }) }));
vi.mock("@/lib/knowledge.server", () => ({ knowledgeContext: async () => "" }));
vi.mock("@/lib/writer.functions", () => ({ ACTIONS: { correct: "Corrige" } }));
import { handleWriterStream } from "@/lib/writer-stream.server";
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const request = () => new Request("https://bersa.test/api/writer", { method: "POST", headers: { Authorization: "Bearer test" }, body: JSON.stringify({ action: "correct", text: "Bonjour" }) });
it("refuses unsigned requests instead of allowing a local quota bypass", async () => {
  expect((await handleWriterStream(new Request("https://bersa.test/api/writer", { method: "POST" }))).status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
});
it("refuses invalid sessions", async () => {
  vi.stubEnv("SUPABASE_URL", "https://service.test"); vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  getUser.mockResolvedValue({ data: { user: null }, error: new Error("invalid") });
  expect((await handleWriterStream(request())).status).toBe(401);
});
it("enforces the permanent 20 per day server quota", async () => {
  vi.stubEnv("SUPABASE_URL", "https://service.test"); vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  getUser.mockResolvedValue({ data: { user: { id: "test" } }, error: null });
  rpc.mockResolvedValue({ data: { ok: false, used: 20, limit: 20 }, error: null });
  const result = await handleWriterStream(request());
  expect(result.status).toBe(429);
  expect(await result.text()).toContain("(20/20). Renouvellement à 00:00 UTC.");
});
it("never grants access when the quota service fails", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "test" } }, error: null });
  rpc.mockResolvedValue({ data: null, error: new Error("unavailable") });
  expect((await handleWriterStream(request())).status).toBe(503);
});