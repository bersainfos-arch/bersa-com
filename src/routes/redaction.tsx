import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HomeEditor } from "@/components/HomeEditor";
import { RedactionHub } from "@/components/redaction-center/RedactionHub";
import type { GenerationFormData } from "@/lib/redaction-center/redaction-types";

export const Route = createFileRoute("/redaction")({
  head: () => ({
    meta: [
      { title: "Centre Intelligent de Rédaction — BERSA" },
      {
        name: "description",
        content: "Créez vos documents académiques, administratifs, juridiques, CV et affiches avec BERSA.",
      },
      { property: "og:title", content: "Centre Intelligent de Rédaction — BERSA" },
      {
        property: "og:description",
        content: "Espace complet de création documentaire et graphique assisté par BERSA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RedactionRouteComponent,
});

function RedactionRouteComponent() {
  const [view, setView] = useState<"hub" | "editor">("hub");
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  // Ouverture directe de la page blanche
  const handleOpenBlank = () => {
    setInitialPrompt(null);
    setView("editor");
  };

  // Lancement de la génération depuis un modèle
  const handleStartGeneration = (data: GenerationFormData) => {
    const promptConsigne = `RÉDIGE LE DOCUMENT SUIVANT SELON LE MODÈLE : ${data.title}
SUJET : ${data.subject}
LANGUE : ${data.language}
LONGUEUR SOUHAITÉE : ${data.length}
${data.academicLevel ? `NIVEAU ACADÉMIQUE : ${data.academicLevel}` : ""}
${data.jurisdiction ? `JURIDICTION / PAYS : ${data.jurisdiction}` : ""}
${data.instructions ? `CONSIGNES PARTICULIÈRES : ${data.instructions}` : ""}
${data.selectedSections.length > 0 ? `SECTIONS SÉLECTIONNÉES : ${data.selectedSections.join(", ")}` : ""}`;

    setInitialPrompt(promptConsigne);
    setView("editor");
  };

  if (view === "editor") {
    return (
      <div className="relative">
        {/* Bouton retour vers le Centre de Rédaction */}
        <div className="fixed top-3 left-3 z-50">
          <button
            onClick={() => setView("hub")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md shadow-md border border-white/20 transition-all"
          >
            <span>❮ Centre de création</span>
          </button>
        </div>
        <HomeEditor />
      </div>
    );
  }

  return <RedactionHub onOpenBlank={handleOpenBlank} onStartGeneration={handleStartGeneration} />;
}
