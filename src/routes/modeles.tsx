import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/Home";
export const Route = createFileRoute("/modeles")({
  head: () => ({ meta: [
    { title: "Modèles de documents et affiches | BERSA" },
    { name: "description", content: "Parcourez les modèles BERSA : CV, lettres administratives, business, actes juridiques, affiches et couvertures." },
    { property: "og:title", content: "Catalogue de modèles BERSA" },
    { property: "og:description", content: "Retrouvez les modèles de documents et affiches publiés, classés par domaine." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <Home catalog />,
});