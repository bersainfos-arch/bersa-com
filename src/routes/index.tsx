import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BERSA — Le berceau du savoir" },
      { name: "description", content: "Plateforme BERSA : modèles de documents, atelier de rédaction, formations et bibliothèque de recherche." },
      { property: "og:title", content: "BERSA — Le berceau du savoir" },
      { property: "og:description", content: "Transformez vos idées en résultats au service de votre plume." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Home />,
});
