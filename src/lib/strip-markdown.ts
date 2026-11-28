/** Remove Markdown markers (asterisks, hashes, backticks) from assistant text while keeping words and line breaks. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, "")
    .replace(/^[ \t]*[*•][ \t]+/gm, "- ")
    .replace(/\*+/g, "")
    .replace(/#+/g, "")
    .replace(/`+/g, "")
    .replace(/^[ \t]*[-_]{3,}[ \t]*$/gm, "");
}
