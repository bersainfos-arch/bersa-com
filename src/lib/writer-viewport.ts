/** Screen fit changes only presentation, never the saved page margins. */
export const MOBILE_BASE_SCALE = 0.435;

/** The fitted text width is the 100% reference for this screen. */
export function scaleToDisplayZoom(scale: number, baseScale = MOBILE_BASE_SCALE): number {
  return Math.round((scale / baseScale) * 100);
}

/** Convertit le pourcentage affiché en multiplicateur réel. */
export function displayZoomToScale(displayPercent: number, baseScale = MOBILE_BASE_SCALE): number {
  return Math.max(0.2, (displayPercent / 100) * baseScale);
}

/**
 * Calcul d'adaptation de la feuille à l'écran.
 * Conserve la compatibilité avec l'architecture A4 et les tests.
 */
export function writerTextFit(
  width: number,
  orientation: "Portrait" | "Paysage",
  margin: "Normales" | "Étroites" | "Larges"
) {
  const pageWidth = orientation === "Paysage" ? 1123 : 794;
  const multiplier = margin === "Étroites" ? 0.5 : margin === "Larges" ? 1.3 : 1;
  const padding = 794 * 0.1189 * multiplier;
  const availableWidth = Math.max(280, width - 16);

  const scale = Math.min(1, availableWidth / (pageWidth - padding * 2));

  return { scale, scrollLeft: Math.max(0, padding * scale - 8), pageWidth, padding };
}

/** Displayed line spacing is calibrated to the requested reading reference. */
export const writerLineSpacing = (display: number) => display * 1.5;
