import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { OrderDialog } from "@/components/OrderDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { serviceGroups, type Service } from "@/lib/catalog";

export const Route = createFileRoute("/redaction")({
  head: () => ({
    meta: [
      { title: "Rédaction & Services — BERSA" },
      { name: "description", content: "Mémoires, thèses, articles, actes juridiques, statuts OHADA, business plans : commandez votre document." },
      { property: "og:title", content: "Rédaction & Services — BERSA" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Catalogue de rédaction universitaire, administrative, juridique et entrepreneuriale." },
    ],
  }),
  component: Page,
});

function Card({ s }: { s: Service }) {
  const { t, lang } = useI18n();
  const [shown, setShown] = useState(false);
  const name = lang === "fr" ? s.name : s.nameEn;
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5 shadow-soft">
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.desc}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        {shown ? (
          <span className="font-display text-2xl font-bold text-primary">{s.price}</span>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShown(true)}>
            <Eye className="mr-1 h-4 w-4" /> {t("seePrice")}
          </Button>
        )}
        <OrderDialog
          kind="redaction"
          item={s.name}
          price={s.priceNum}
          trigger={<Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">{t("order")}</Button>}
        />
      </div>
    </div>
  );
}

function Page() {
  const { t, lang } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("writing")} subtitle={lang === "fr" ? "Des documents rigoureux, rédigés par des experts." : "Rigorous documents written by experts."} />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        {serviceGroups.map((g) => (
          <section key={g.title}>
            <h2 className="text-2xl font-bold">{lang === "fr" ? g.title : g.titleEn}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s) => <Card key={s.name} s={s} />)}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
