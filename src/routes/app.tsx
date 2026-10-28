import { createFileRoute } from "@tanstack/react-router";
import BersaWordA4 from "@/components/BersaWordA4";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Atelier Word A4 — BERSA Berceau du Savoir" },
      { name: "description", content: "Atelier de rédaction Word A4 avec assistant et régénération de texte." },
      { property: "og:title", content: "Atelier Word A4 — BERSA" },
      { property: "og:description", content: "Rédigez, corrigez et exportez vos documents dans l’atelier BERSA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BersaWordA4 />,
});
