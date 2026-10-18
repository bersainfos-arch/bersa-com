import { createFileRoute } from "@tanstack/react-router";
import { HomeFeed } from "@/components/HomeFeed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BERSA — Berceau du Savoir" },
      { name: "description", content: "Rédaction académique et juridique, formations et bibliothèque intelligente. Le berceau du savoir, au service de votre plume." },
      { property: "og:title", content: "BERSA — Berceau du Savoir" },
      { property: "og:description", content: "Rédaction, formations et bibliothèque au service de votre avenir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeFeed,
});
