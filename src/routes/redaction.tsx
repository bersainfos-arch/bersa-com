import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HomeEditor } from "@/components/HomeEditor";
import { RedactionHub } from "@/components/redaction-center/RedactionHub";
import { VisualGraphicEditor } from "@/components/redaction-center/VisualGraphicEditor";
import type { ModelItem, GenerationFormData } from "@/lib/redaction-center/redaction-types";

export const Route = createFileRoute("/redaction")({
  head: () => ({
    meta: [
      { title: "Centre Intelligent de Rédaction — BERSA" },
      { name: "description", content: "Création documentaire et visuelle assistée par BERSA." },
      { property: "og:title", content: "Centre Intelligent de Rédaction — BERSA" },
      { property: "og:description", content: "Espace complet de rédaction et communication BERSA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RedactionRouteComponent,
});

function RedactionRouteComponent() {
  const [view, setView] = useState<"hub" | "editor" | "graphic">("hub");
  const [selectedGraphicModel, setSelectedGraphicModel] = useState<ModelItem | null>(null);

  // 1. Ouverture de la page blanche dans l'éditeur Word A4
  const handleOpenBlank = () => {
    setView("editor");
  };

  // 2. Génération assistée : ouvre l'atelier Word A4 avec le prompt structuré
  const handleStartGeneration = (data: GenerationFormData) => {
    setView("editor");
  };

  // 3. Modèles graphiques : ouvre le Studio Visuel
  const handleOpenGraphicEditor = (model: ModelItem) => {
    setSelectedGraphicModel(model);
    setView("graphic");
  };

  if (view === "graphic" && selectedGraphicModel) {
    return (
      <VisualGraphicEditor
        model={selectedGraphicModel}
        onBack={() => setView("hub")}
      />
    );
  }

  if (view === "editor") {
    return (
      <div className="relative">
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

  return (
    <RedactionHub
      onOpenBlank={handleOpenBlank}
      onStartGeneration={handleStartGeneration}
      onOpenGraphicEditor={handleOpenGraphicEditor}
    />
  );
}
