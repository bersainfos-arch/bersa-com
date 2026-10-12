export const languages = [
  { code: "fr", name: "Français" }, { code: "en", name: "English" },
  { code: "ln", name: "Lingála" }, { code: "es", name: "Español" },
  { code: "pt", name: "Português" }, { code: "ar", name: "العربية", rtl: true },
  { code: "zh", name: "中文" }, { code: "hi", name: "हिन्दी" },
  { code: "bn", name: "বাংলা" }, { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" }, { code: "de", name: "Deutsch" },
  { code: "ko", name: "한국어" }, { code: "it", name: "Italiano" },
  { code: "tr", name: "Türkçe" }, { code: "vi", name: "Tiếng Việt" },
  { code: "ta", name: "தமிழ்" }, { code: "te", name: "తెలుగు" },
  { code: "mr", name: "मराठी" }, { code: "ur", name: "اردو", rtl: true },
  { code: "id", name: "Bahasa Indonesia" }, { code: "sw", name: "Kiswahili" },
  { code: "ha", name: "Hausa" }, { code: "yo", name: "Yorùbá" },
  { code: "nl", name: "Nederlands" },
] as const;
export type Lang = typeof languages[number]["code"];
export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && languages.some(language => language.code === value);
}
export function languageStorageKey(userId?: string) {
  return userId ? `bersa-lang:${userId}` : "bersa-lang";
}
export function preferredLanguage(remote: unknown, local: unknown): Lang {
  return isLang(remote) ? remote : isLang(local) ? local : "fr";
}