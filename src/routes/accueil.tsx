import { createFileRoute } from "@tanstack/react-router";
import { HomeFeed } from "@/components/HomeFeed";

export const Route = createFileRoute("/accueil")({
  head: () => ({
    meta: [
      { title: "Accueil et publications — BERSA" },
      { name: "description", content: "Votre atelier de rédaction pour les études, les livres et les documents professionnels. Le berceau du savoir, au service de votre plume." },
      { property: "og:title", content: "Accueil et publications — BERSA" },
      { property: "og:description", content: "Rédaction, formations et bibliothèque au service de votre avenir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeFeed,
});
