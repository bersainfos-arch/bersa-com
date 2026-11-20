/**
 * Calibrage du zoom BERSA Writer inspiré de WPS Office :
 * - 100 % affiché = échelle réelle 0.58 (lecture mobile pleine largeur).
 * - En dessous de 80 % (ancienne échelle 0.46) : mode multi-pages en colonnes.
 */
export const ZOOM_BASE_SCALE = 0.58;

export function displayZoomToScale(displayZoomPercent: number): number {
  return (displayZoomPercent / 100) * ZOOM_BASE_SCALE;
}

export function scaleToDisplayZoom(scale: number): number {
  return Math.round((scale / ZOOM_BASE_SCALE) * 100);
}

export function getGridColumns(displayZoomPercent: number): number {
  if (displayZoomPercent >= 80) return 1;
  if (displayZoomPercent >= 60) return 2;
  if (displayZoomPercent >= 40) return 3;
  return 4;
}

export function writerTextFit(
  width: number,
  orientation: "Portrait" | "Paysage",
  margin: "Normales" | "Étroites" | "Larges"
) {
  const pageWidth = orientation === "Paysage" ? 1123 : 794;
  const multiplier = margin === "Étroites" ? 0.5 : margin === "Larges" ? 1.3 : 1;
  const padding = 794 * 0.1189 * multiplier;
  const availableWidth = Math.max(280, width - 16);

  // Sur mobile, ajustement pleine largeur à 100 % affiché (échelle 0.58)
  const fit = availableWidth / pageWidth;
  const scale = availableWidth < 640 ? Math.min(ZOOM_BASE_SCALE, fit) : Math.min(1, fit);

  return {
    scale,
    displayZoom: scaleToDisplayZoom(scale),
    scrollLeft: 0,
    pageWidth,
    padding,
  };
}
