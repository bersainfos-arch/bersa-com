import { describe, expect, it } from "vitest";
import { stripMarkdown } from "@/lib/strip-markdown";

describe("stripMarkdown", () => {
  it("removes hashes from titles", () => {
    expect(stripMarkdown("## Introduction\nTexte")).toBe("Introduction\nTexte");
  });
  it("removes asterisks used for bold and italic", () => {
    expect(stripMarkdown("Un **mot** et *autre*")).toBe("Un mot et autre");
  });
  it("turns asterisk bullets into dashes", () => {
    expect(stripMarkdown("* point un\n* point deux")).toBe("- point un\n- point deux");
  });
});
