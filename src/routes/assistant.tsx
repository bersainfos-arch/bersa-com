import { createFileRoute } from "@tanstack/react-router";
import { HomeEditor } from "@/components/HomeEditor";
export const Route = createFileRoute("/assistant")({
 head: () => ({ meta: [{ title: "Assistant de rédaction — BERSA" }, { name: "description", content: "Assistant de rédaction sur papier modifiable : générer, corriger et reformuler." }, { property: "og:title", content: "Assistant de rédaction — BERSA" }, { property: "og:description", content: "Votre écriture assistée sur papier avec BERSA, Berceau du Savoir." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: HomeEditor,
});
