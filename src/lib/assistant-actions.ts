export const assistantActions = [
  ["generate", "Générer"], ["rephrase", "Reformuler"], ["outline", "Plan"],
  ["expand", "Développer"], ["summarize", "Résumer"], ["correct", "Corriger"],
  ["humanize", "Humaniser"], ["improve", "Améliorer"], ["references", "Sources"],
  ["translate", "Traduire"], ["suggest", "Suggestions"], ["continue", "Continuer"],
  ["academic", "Aide académique"], ["cv", "CV"],
] as const;
export function writingTarget(text: string, selection: { from: number; to: number; text: string }) {
  return selection.from !== selection.to && selection.text.trim() ? selection.text : text;
}
export function safeLink(value: string) {
  try { const url = new URL(value); return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}