import { languages, isLang } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { translateUi } from "@/lib/translate-ui";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  return <select
    aria-label={translateUi("Langue de l’application") as string}
    value={lang}
    onChange={event => { if (isLang(event.target.value)) setLang(event.target.value); }}
    className={compact ? "h-7 w-20 min-w-0 rounded border border-royal-foreground/30 bg-royal px-1 py-1 text-xs text-royal-foreground sm:w-32" : "mt-3 w-full rounded border bg-background p-3"}
  >{languages.map(language => <option key={language.code} value={language.code} lang={language.code}>{language.name}</option>)}</select>;
}