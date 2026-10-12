import { describe, expect, it } from "vitest";
import { languages, languageStorageKey, preferredLanguage } from "@/lib/languages";

describe("language preferences", () => {
  it("supports the five requested languages and twenty additional languages", () => {
    expect(languages).toHaveLength(25);
    expect(new Set(languages.map(l => l.code)).size).toBe(25);
    expect(languages.slice(0, 5).map(l => l.code)).toEqual(["fr", "en", "ln", "es", "pt"]);
  });
  it("isolates the language remembered for each user", () => {
    expect(languageStorageKey("alice")).toBe("bersa-lang:alice");
    expect(languageStorageKey("bob")).toBe("bersa-lang:bob");
    expect(languageStorageKey()).toBe("bersa-lang");
  });
  it("restores the account preference before the local preference", () => {
    expect(preferredLanguage("ln", "en")).toBe("ln");
    expect(preferredLanguage(undefined, "es")).toBe("es");
    expect(preferredLanguage("unsupported", "unsupported")).toBe("fr");
  });
});