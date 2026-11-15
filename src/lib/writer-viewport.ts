/** Screen fit changes only presentation, never the saved page margins. */
export function writerTextFit(width: number, orientation: "Portrait" | "Paysage", margin: "Normales" | "Étroites" | "Larges") {
  const pageWidth = orientation === "Paysage" ? 1123 : 794;
  const multiplier = margin === "Étroites" ? 0.5 : margin === "Larges" ? 1.3 : 1;
  const padding = 794 * 0.1189 * multiplier;
  const availableWidth = Math.max(280, width - 16);
  // S'ajuste exactement à l'écran sur mobile/tablette sans déborder, plafonné à 50 % sur grand écran
  // Téléphone : 55 % par défaut, réduit seulement si l'écran est trop étroit pour ne jamais déborder.
  const fit = availableWidth / pageWidth;
  const scale = availableWidth < 640 ? Math.min(0.55, fit) : Math.min(1, fit);
  return { scale, scrollLeft: 0, pageWidth, padding };
}
