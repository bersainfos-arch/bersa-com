/** Screen fit changes only presentation, never the saved page margins. */
export const MOBILE_BASE_SCALE = 0.435;

/** 57 % d'échelle réelle vaut 100 % affiché à l'écran. */
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

  // 55 % à 57 % par défaut sur mobile, ajusté à la largeur sans déborder
  const fit = availableWidth / pageWidth;
  const scale = availableWidth < 640 ? Math.min(0.55, fit) : Math.min(1, fit);

  return { scale, scrollLeft: 0, pageWidth, padding };
}

/** Displayed line spacing is calibrated to the requested reading reference. */
export const writerLineSpacing = (display: number) => display * 1.5;
