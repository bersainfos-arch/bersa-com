/** Applies only to BERSA interface copy, never user documents or requests. */
export function interfaceCopy(value: string): string {
  return value
    .replace(/\s*&\s*d['’]intelligence artificielle/gi, "")
    .replace(/intelligence artificielle/gi, "rédaction")
    .replace(/\(IA\)/g, "")
    .replace(/\b(?:IA|AI)\b/g, "")
    .replace(/\bKI(?=[-\s])/g, "")
    .replace(/(?:الذكاء الاصطناعي|ذكاء اصطناعي|mayele ya masini)/gi, "")
    .replace(/\bl['’](?=\s*BERSA)/g, "")
    .replace(/\bl['’](?=\s*(?:en|atteinte))/g, "l’Assistant ")
    .replace(/\bde l['’](?=\s*(?:$|:))/g, "de l’Assistant")
    .replace(/ {2,}/g, " ");
}