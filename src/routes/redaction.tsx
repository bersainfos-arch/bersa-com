import { createFileRoute } from "@tanstack/react-router";
import { HomeEditor } from "@/components/HomeEditor";

export const Route = createFileRoute("/redaction")({
  head: () => ({
    meta: [
      { title: "Atelier de rédaction — BERSA" },
      { name: "description", content: "Votre atelier de rédaction avec Assistant, saisie continue et pièces jointes." },
      { property: "og:title", content: "Atelier de rédaction — BERSA" },
      { property: "og:description", content: "Transformez vos idées en résultats dans votre atelier BERSA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HomeEditor />,
});
