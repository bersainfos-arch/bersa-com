import { languages, isLang } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { translateUi } from "@/lib/translate-ui";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  return <select
    aria-label={translateUi("Langue de l’application") as string}
    value={lang}
    onChange={event => { if (isLang(event.target.value)) setLang(event.target.value); }}
    className={compact ? "max-w-36 rounded border border-gold bg-royal px-2 py-1 text-xs text-royal-foreground" : "mt-3 w-full rounded border bg-background p-3"}
  >{languages.map(language => <option key={language.code} value={language.code} lang={language.code}>{language.name}</option>)}</select>;
}