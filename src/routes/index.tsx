import { createFileRoute } from "@tanstack/react-router";
import { HomeEditor } from "@/components/HomeEditor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BERSA — Atelier de rédaction" },
      { name: "description", content: "Ouvrez directement votre atelier de rédaction BERSA : le berceau du savoir, au service de votre plume." },
      { property: "og:title", content: "BERSA — Atelier de rédaction" },
      { property: "og:description", content: "Transformez vos idées en résultats avec l'atelier de rédaction BERSA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HomeEditor />,
});
