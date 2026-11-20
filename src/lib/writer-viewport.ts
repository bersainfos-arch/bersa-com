/** Screen fit changes only presentation, never the saved page margins. */
export const MOBILE_BASE_SCALE = 0.58;

/** Convertit une échelle réelle en valeur de zoom affiché (ex: 0.58 -> 100 %). */
export function scaleToDisplayZoom(scale: number): number {
  return Math.round((scale / MOBILE_BASE_SCALE) * 100);
}

/** Convertit un pourcentage affiché en multiplicateur CSS. */
export function displayZoomToScale(displayPercent: number): number {
  return Math.max(0.2, (displayPercent / 100) * MOBILE_BASE_SCALE);
}

/**
 * Calcul d'adaptation de la feuille à l'écran.
 * Conserve la compatibilité exacte avec les tests et l'architecture A4.
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

  // Échelle adaptée à l'écran : 55 % à 58 % sur téléphone, plafonnée à 100 % sur grand écran
  const fit = availableWidth / pageWidth;
  const scale = availableWidth < 640 ? Math.min(0.55, fit) : Math.min(1, fit);

  return { scale, scrollLeft: 0, pageWidth, padding };
}
