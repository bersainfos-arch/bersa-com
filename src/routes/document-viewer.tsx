import { createFileRoute } from "@tanstack/react-router";
import DocumentViewer from "@/components/DocumentViewer";
import { exampleDocument } from "@/components/document-viewer/example";

export const Route = createFileRoute("/document-viewer")({
  head: () => ({ meta: [
    { title: "BERSA — Exemple de lecture A4" },
    { name: "description", content: "Exemple de document A4 BERSA avec lecture mobile, notes de bas de page et zoom tactile." },
    { property: "og:title", content: "BERSA — Exemple de lecture A4" },
    { property: "og:description", content: "Lecteur de documents A4 du Berceau du Savoir." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
  ] }),
  component: ExampleViewer,
});

function ExampleViewer() {
  const navigate = Route.useNavigate();
  return <DocumentViewer blocks={exampleDocument} title="Exemple — Guide pratique en rédaction" onBack={() => void navigate({ to: "/" })} />;
}