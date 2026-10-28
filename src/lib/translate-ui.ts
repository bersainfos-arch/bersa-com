import { type Lang } from "./languages";
import { useSyncExternalStore } from "react";
import { interfaceCopy } from "./interface-copy";

let currentLanguage: Lang = "fr";
let messages: Record<string, string> = {};
const listeners = new Set<() => void>();
export function useUiLanguage() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => currentLanguage, () => "fr");
}
export function activateUiLanguage(lang: Lang, translations: Record<string, string>) {
  currentLanguage = lang;
  messages = translations;
  listeners.forEach(listener => listener());
}
export function translateUi<T>(value: T): T | string {
  if (typeof value !== "string") return value;
  if (currentLanguage === "fr") return interfaceCopy(value);
  const trimmed = value.trim();
  const translation = messages[trimmed];
  if (!translation) return interfaceCopy(value);
  return interfaceCopy(value.replace(trimmed, translation));
}