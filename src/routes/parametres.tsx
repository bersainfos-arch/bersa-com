import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Share2, Copy, Download, User, Mail, Type } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { APP_URL, shareApp } from "@/lib/settings";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres et affichage — BERSA" },
      {
        name: "description",
        content: "Gérez votre profil, votre langue, la taille du texte et l'installation de BERSA.",
      },
      { property: "og:title", content: "Paramètres — BERSA" },
      { property: "og:description", content: "Vos préférences et votre accès BERSA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [fontSize, setFontSize] = useState<string>("normal");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Charger la préférence de taille du texte
    const savedSize = localStorage.getItem("bersa_font_scale") || "normal";
    setFontSize(savedSize);
    applyFontScale(savedSize);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const applyFontScale = (size: string) => {
    const root = document.documentElement;
    if (size === "large") {
      root.style.fontSize = "112%";
    } else if (size === "xlarge") {
      root.style.fontSize = "125%";
    } else {
      root.style.fontSize = "100%";
    }
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem("bersa_font_scale", size);
    applyFontScale(size);
    toast.success("Taille du texte appliquée avec succès.");
  };

  return (
    <AppShell>
      <PageHeader title="Paramètres & Affichage" />
      <div className="mx-auto max-w-3xl divide-y px-4 py-6">
                {/* Espace Gestion Administrateur (Réservé à dieudonnedjoma@gmail.com) */}
        {isAdmin && (
          <section className="py-5 bg-amber-50/70 -mx-4 px-4 rounded-xl border border-amber-300">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldCheck className="h-5 w-5 text-amber-700" />
              <h2 className="text-xl font-bold">Espace de gestion administrateur</h2>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              Panneau de contrôle réservé à l'administrateur BERSA pour valider les abonnements, gérer les formations, les livres et les fonctionnalités.
            </p>
            <Button asChild className="mt-3 bg-amber-800 hover:bg-amber-900 text-white shadow">
              <Link to="/gestion">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Accéder à la gestion administrative
              </Link>
            </Button>
          </section>
        )}
        {/* Profil */}
        <section className="py-5">
          <h2 className="text-xl font-bold text-slate-900">Profil</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez vos informations personnelles et votre biographie.
          </p>
          <Button asChild variant="outline" className="mt-3">
            <Link to="/profil">
              <User className="h-4 w-4 mr-2" />
              Modifier mes informations
            </Link>
          </Button>
        </section>

        {/* Taille du texte global */}
        <section className="py-5">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Taille du texte de l'application</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ajustez la taille d'affichage de toute l'application pour un meilleur confort visuel.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 max-w-md">
            <Button
              type="button"
              variant={fontSize === "normal" ? "default" : "outline"}
              onClick={() => handleFontSizeChange("normal")}
              className="text-xs"
            >
              Normal (100 %)
            </Button>
            <Button
              type="button"
              variant={fontSize === "large" ? "default" : "outline"}
              onClick={() => handleFontSizeChange("large")}
              className="text-xs font-semibold"
            >
              Grand (112 %)
            </Button>
            <Button
              type="button"
              variant={fontSize === "xlarge" ? "default" : "outline"}
              onClick={() => handleFontSizeChange("xlarge")}
              className="text-xs font-bold"
            >
              Très grand (125 %)
            </Button>
          </div>
        </section>

        {/* Partage */}
        <section className="py-5">
          <h2 className="text-xl font-bold text-slate-900">Partage</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                void shareApp().catch(() => toast.error("Partage annulé ou indisponible."))
              }
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager BERSA
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(APP_URL);
                toast.success("Lien de l'application copié.");
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </Button>
          </div>
        </section>

        {/* Langues */}
        <section className="py-5">
          <h2 className="text-xl font-bold text-slate-900">Langue de l'interface</h2>
          <p className="text-xs text-slate-500 mt-1 mb-3">
            Choisissez parmi nos 25 langues intégrées.
          </p>
          <LanguageSelector />
        </section>

        {/* Téléchargement / PWA */}
        <section className="py-5">
          <h2 className="text-xl font-bold text-slate-900">Application mobile</h2>
          <Button
            className="mt-3"
            variant="outline"
            onClick={async () => {
              if (install) {
                await install.prompt();
                await install.userChoice;
                setInstall(null);
              } else {
                toast.info(
                  "Ouvrez BERSA dans Chrome ou Safari, puis choisissez « Ajouter à l'écran d'accueil » pour l'installer comme une vraie application.",
                );
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Installer BERSA sur mon téléphone
          </Button>
        </section>

        {/* Support */}
        <section className="py-5">
          <h2 className="text-xl font-bold text-slate-900">Contact & Support</h2>
          <Button asChild variant="link" className="px-0">
            <a href="mailto:bersainfos@gmail.com">
              <Mail className="h-4 w-4 mr-2" />
              bersainfos@gmail.com
            </a>
          </Button>
        </section>
      </div>
    </AppShell>
  );
    }
