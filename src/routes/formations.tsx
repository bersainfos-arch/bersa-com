import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { OrderDialog } from "@/components/OrderDialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { courses } from "@/lib/catalog";

export const Route = createFileRoute("/formations")({
  head: () => ({
    meta: [
      { title: "BERSA Academy — Formations à 20 $" },
      { name: "description", content: "Formations pratiques à 20 $, en ligne ou en présentiel. Inscription immédiate." },
      { property: "og:title", content: "BERSA Academy — Formations" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Méthodologie, rédaction, IA, entrepreneuriat : formations à 20 $." },
    ],
  }),
  component: Page,
});

function Course({ c }: { c: (typeof courses)[number] }) {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<"online" | "onsite">("online");
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5 shadow-soft">
      <GraduationCap className="h-8 w-8 text-gold" />
      <h3 className="mt-2 text-xl font-bold">{lang === "fr" ? c.name : c.nameEn}</h3>
      <div className="mt-1 font-display text-2xl font-bold text-primary">20 $</div>
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
        {(["online", "onsite"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md py-1.5 ${mode === m ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}
          >
            {t(m)}
          </button>
        ))}
      </div>
      <OrderDialog
        kind="formation"
        item={c.name}
        price={20}
        modality={mode === "online" ? "En ligne" : "En présentiel"}
        trigger={<Button className="mt-4 w-full">{t("enroll")}</Button>}
      />
    </div>
  );
}

function Page() {
  const { t, lang } = useI18n();
  return (
    <AppShell>
      <PageHeader title={`BERSA Academy`} subtitle={lang === "fr" ? "Toutes nos formations à 20 $ — en ligne ou en présentiel." : "All courses at $20 — online or on-site."} />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => <Course key={c.name} c={c} />)}
      </div>
      <span className="sr-only">{t("academy")}</span>
    </AppShell>
  );
}
