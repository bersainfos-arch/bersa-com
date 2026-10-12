import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, TrendingUp, Cpu, Wrench, HeartPulse, FlaskConical } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { domains } from "@/lib/catalog";
import logo from "@/assets/bersa-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BERSA — Berceau du Savoir" },
      { name: "description", content: "Rédaction académique et juridique, formations et bibliothèque intelligente. Le berceau du savoir, au service de votre plume." },
      { property: "og:title", content: "BERSA — Berceau du Savoir" },
      { property: "og:description", content: "Rédaction, formations et bibliothèque au service de votre avenir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const icons = [Scale, TrendingUp, Cpu, Wrench, HeartPulse, FlaskConical];
const metrics = [
  { n: "+500", fr: "Documents rédigés", en: "Documents written" },
  { n: "+1 200", fr: "Apprenants", en: "Learners" },
  { n: "+300", fr: "Ressources", en: "Resources" },
  { n: "+50", fr: "Projets accompagnés", en: "Projects supported" },
];

function Index() {
  const { t, lang } = useI18n();
  return (
    <AppShell>
      <section className="relative overflow-hidden bg-royal text-royal-foreground">
        <div className="absolute inset-0 bg-royal-gradient opacity-70" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <img src={logo.url} alt="Logo BERSA" className="h-20 w-20 rounded-2xl shadow-soft" />
          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-gold">Berceau du Savoir</p>
          <h1 className="mt-2 text-5xl font-bold md:text-7xl">BERSA</h1>
          <p className="mt-3 font-display text-2xl italic text-gold md:text-3xl">« {t("slogan")} »</p>
          <p className="mt-4 max-w-xl opacity-90">{t("heroText")}</p>
          <p className="mt-2 font-semibold text-gold">Transformez vos idées en résultats</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Link to="/redaction">{t("ctaOrder")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-gold bg-transparent text-royal-foreground hover:bg-royal-foreground/10">
              <Link to="/abonnements">Abonnements</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 grid max-w-6xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.n} className="relative rounded-xl bg-card p-4 shadow-soft">
            <div className="font-display text-3xl font-bold text-primary">{m.n}</div>
            <div className="text-xs text-muted-foreground">{lang === "fr" ? m.fr : m.en}</div>
          </div>
        ))}
      </section>


      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-bold md:text-4xl">{t("domains")}</h2>
        <div className="mt-2 h-1 w-12 rounded bg-gold" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {domains.map((d, i) => {
            const I = icons[i] ?? Scale;
            return (
              <Link key={d.fr} to="/bibliotheque" className="group rounded-xl border bg-card p-5 transition hover:border-gold hover:shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-gold group-hover:text-gold-foreground">
                  <I className="h-6 w-6" />
                </div>
                <div className="mt-3 font-semibold">{lang === "fr" ? d.fr : d.en}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="bg-royal px-4 py-8 text-center text-sm text-royal-foreground">
        <p className="font-display text-lg italic">Ensemble pour une société plus instruite, plus compétente et plus innovante.</p>
      </footer>
    </AppShell>
  );
}
