import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, PenLine, GraduationCap, BookOpen, ShieldCheck, User } from "lucide-react";
import logo from "@/assets/bersa-logo.png.asset.json";
import { useI18n, type Key } from "@/lib/i18n";

const tabs: { to: string; key: Key; icon: typeof Home }[] = [
  { to: "/", key: "home", icon: Home },
  { to: "/redaction", key: "writing", icon: PenLine },
  { to: "/formations", key: "academy", icon: GraduationCap },
  { to: "/bibliotheque", key: "library", icon: BookOpen },
  { to: "/gestion", key: "admin", icon: ShieldCheck },
  { to: "/profil", key: "profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 bg-royal text-royal-foreground shadow-soft">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo.url} alt="Logo BERSA" className="h-10 w-10 rounded-lg" />
            <span className="font-display text-2xl font-bold tracking-wide">BERSA</span>
          </Link>
          <nav className="ml-6 hidden gap-1 md:flex">
            {tabs.map((tb) => (
              <Link
                key={tb.to}
                to={tb.to}
                activeOptions={{ exact: tb.to === "/" }}
                className="rounded-md px-3 py-2 text-sm opacity-80 hover:opacity-100"
                activeProps={{ className: "bg-gold text-gold-foreground opacity-100 font-semibold" }}
              >
                {t(tb.key)}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="ml-auto rounded-full border border-gold px-3 py-1 text-xs font-semibold text-gold"
            aria-label="Langue / Language"
          >
            {lang === "fr" ? "EN" : "FR"}
          </button>
        </div>
      </header>
      <main>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card md:hidden">
        {tabs.map((tb) => (
          <Link
            key={tb.to}
            to={tb.to}
            activeOptions={{ exact: tb.to === "/" }}
            className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <tb.icon className="h-5 w-5" />
            {t(tb.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-royal-gradient px-4 py-10 text-royal-foreground">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl opacity-80">{subtitle}</p>}
        <div className="mt-4 h-1 w-16 rounded bg-gold" />
      </div>
    </div>
  );
}
