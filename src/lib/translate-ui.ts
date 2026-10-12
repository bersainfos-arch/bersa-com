import { type Lang } from "./languages";

let currentLanguage: Lang = "fr";
let messages: Record<string, string> = {};
export function activateUiLanguage(lang: Lang, translations: Record<string, string>) {
  currentLanguage = lang;
  messages = translations;
}
export function translateUi<T>(value: T): T | string {
  if (typeof value !== "string" || currentLanguage === "fr") return value;
  const trimmed = value.trim();
  const translation = messages[trimmed];
  if (!translation) return value;
  return value.replace(trimmed, translation);
}