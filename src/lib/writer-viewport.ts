/** Screen fit changes only presentation, never the saved page margins. */
export function writerTextFit(width: number, orientation: "Portrait" | "Paysage", margin: "Normales" | "Étroites" | "Larges") {
  const pageWidth = orientation === "Paysage" ? 1123 : 794;
  const multiplier = margin === "Étroites" ? 0.5 : margin === "Larges" ? 1.3 : 1;
  const padding = 794 * 0.119 * multiplier;
  const availableWidth = Math.max(280, width - 16);
  // S'ajuste exactement à l'écran sur mobile/tablette sans déborder, plafonné à 50 % sur grand écran
  const scale = availableWidth < pageWidth ? availableWidth / pageWidth : 1;
  return { scale, scrollLeft: 0, pageWidth, padding };
}
