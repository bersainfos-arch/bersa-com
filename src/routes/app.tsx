import { createFileRoute } from "@tanstack/react-router";
import { HomeEditor } from "@/components/HomeEditor";
export const Route = createFileRoute("/app")({
  head: () => ({ meta: [
    { title: "Assistant IA et éditeur Word — BERSA" },
    { name: "description", content: "Rédigez et mettez en forme vos textes avec l’assistant IA BERSA." },
    { property: "og:title", content: "Assistant IA et éditeur Word — BERSA" },
    { property: "og:description", content: "Votre espace de rédaction assistée BERSA." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: HomeEditor,
});
