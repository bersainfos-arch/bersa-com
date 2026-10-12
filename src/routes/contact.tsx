import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WHATSAPP, waLink } from "@/lib/catalog";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BERSA" },
      { name: "description", content: "Écrivez à BERSA : votre message arrive directement sur notre WhatsApp." },
      { property: "og:title", content: "Contact — BERSA" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Contactez BERSA par message privé." },
    ],
  }),
  component: Page,
});

function Page() {
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = `Bonjour BERSA,\n\nNom : ${f.get("name")}\nTéléphone : ${f.get("phone")}\nSujet : ${f.get("subject")}\n\n${f.get("message")}`;
    window.open(waLink(WHATSAPP, text.slice(0, 3000)), "_blank", "noopener");
  }
  return (
    <AppShell>
      <PageHeader title="Contact" subtitle="Votre message arrive directement sur notre WhatsApp." />
      <form onSubmit={submit} className="mx-auto max-w-xl space-y-3 px-4 py-10">
        <Input name="name" placeholder="Nom complet" required maxLength={120} />
        <Input name="phone" type="tel" placeholder="Téléphone" required maxLength={40} />
        <Input name="subject" placeholder="Sujet" required maxLength={150} />
        <Textarea name="message" placeholder="Votre message" rows={6} required maxLength={2500} />
        <Button type="submit" className="w-full bg-success text-primary-foreground hover:bg-success/90">
          <MessageCircle className="mr-2 h-4 w-4" /> Envoyer sur WhatsApp
        </Button>
      </form>
    </AppShell>
  );
}
