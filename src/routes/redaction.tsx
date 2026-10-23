import { createFileRoute } from "@tanstack/react-router";
import { BersaWordA4 } from "@/components/BersaWordA4";

export const Route = createFileRoute("/redaction")({
  head: () => ({
    meta: [
      { title: "Mon Atelier Word A4 — BERSA Berceau du Savoir" },
      { name: "description", content: "Véritable éditeur Word A4 avec ruban professionnel, Times New Roman 13pt et régénération IA." },
      { property: "og:title", content: "Mon Atelier Word A4 — BERSA" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BersaWordA4 />,
});
