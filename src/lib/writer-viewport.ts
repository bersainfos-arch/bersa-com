/** Screen fit changes only presentation, never the saved page margins. */
export function writerTextFit(width: number, orientation: "Portrait" | "Paysage", margin: "Normales" | "Étroites" | "Larges") {
  const pageWidth = orientation === "Paysage" ? 1123 : 794;
  const multiplier = margin === "Étroites" ? 0.5 : margin === "Larges" ? 1.3 : 1;
  const padding = 794 * 0.119 * multiplier;
  const scale = Math.max(1, width - 16) / (pageWidth - 2 * padding);
  return { scale, scrollLeft: padding * scale, pageWidth, padding };
}