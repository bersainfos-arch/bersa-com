import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CvPreview } from "@/components/CvPreview";
import { DOC_TEMPLATES } from "@/lib/doc-templates";
import { letterSheet } from "@/lib/letter-templates";

const TITLES = { business: "Modèles de Business Plan", juridique: "Modèles de documents juridiques" } as const;
export const Route = createFileRoute("/modeles-pro")({
  validateSearch: (s: Record<string, unknown>) => ({ cat: s["cat"] === "juridique" ? "juridique" as const : "business" as const }),
  head: () => ({ meta: [
    { title: "Business Plan et documents juridiques | BERSA" },
    { name: "description", content: "Modèles complets de business plan et d’actes juridiques à ouvrir et modifier dans l’Atelier BERSA." },
    { property: "og:title", content: "Modèles professionnels BERSA" },
    { property: "og:description", content: "Business plans et contrats prêts à personnaliser." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ModelesPro,
});

function ModelesPro() {
  const { cat } = Route.useSearch();
  const navigate = useNavigate();
  const list = DOC_TEMPLATES.filter(t => t.cat === cat);
  const open = (html: string, label: string) => { sessionStorage.setItem("bersa-document-html", html); sessionStorage.setItem("bersa-document-title", label); navigate({ to: "/redaction" }); };
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-4">
        <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />Accueil</Link>
        <h1 className="mt-2 font-serif text-2xl font-bold text-foreground">{TITLES[cat]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Touchez un modèle pour l’ouvrir et le modifier dans l’Atelier.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map(t => (
            <button key={t.id} onClick={() => open(t.html, t.label)} className="overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="pointer-events-none border-b bg-white"><CvPreview html={letterSheet(t.html)} /></div>
              <p className="p-2 text-xs font-semibold text-foreground">{t.label}</p>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
