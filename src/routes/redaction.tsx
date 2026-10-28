import { createFileRoute } from "@tanstack/react-router";
import { BersaWordA4 } from "@/components/BersaWordA4";

export const Route = createFileRoute("/redaction")({
  head: () => ({
    meta: [
      { title: "Mon Atelier Word A4 — BERSA Berceau du Savoir" },
      { name: "description", content: "Atelier Word A4 avec ruban de commandes et régénération de texte." },
      { property: "og:title", content: "Mon Atelier Word A4 — BERSA" },
      { property: "og:description", content: "Votre atelier de rédaction, de correction et de mise en page BERSA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BersaWordA4 />,
});
