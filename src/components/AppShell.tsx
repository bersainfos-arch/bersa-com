import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  FileText,
  PenLine,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  User,
  Crown,
  Briefcase,
  Settings,
  ShieldAlert,
  Menu,
  ArrowLeft,
} from "lucide-react";
import logo from "@/assets/bersa-logo.png.asset.json";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  to: string;
  label: string;
  icon: typeof PenLine;
  adminOnly?: boolean;
}
const menuItems: MenuItem[] = [
  { to: "/redaction", label: "Rédaction", icon: PenLine },
  { to: "/formations", label: "Formation", icon: GraduationCap },
  { to: "/bibliotheque", label: "Bibliothèque", icon: BookOpen },
  { to: "/opportunites", label: "Opportunités", icon: Briefcase },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/anti-plagiat", label: "Anti-plagiat", icon: ShieldAlert },
  { to: "/abonnements", label: "Abonnements", icon: Crown },
  { to: "/parametres", label: "Paramètres", icon: Settings },
  { to: "/gestion", label: "Gestion", icon: ShieldCheck, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    // L'administrateur propriétaire a un accès direct garanti
    if (user.email?.toLowerCase() === "dieudonnedjoma@gmail.com") {
      setIsAdmin(true);
      return;
    }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(Boolean(data));
    });
  }, [user]);
  const visibleTabs = menuItems.filter((m) => !m.adminOnly || isAdmin);

  return (
    <AuthGate>
      <div className="min-h-screen">
        {/* En-tête épuré plein écran : Retour + Logo à gauche | Menu ☰ à droite */}
        <header className="sticky top-0 z-30 bg-[#0a192f] text-white shadow-sm">
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-2 sm:px-4">
            
            {/* GAUCHE : Bouton retour ← + Logo officiel BERSA */}
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/10 rounded-full shrink-0"
                title="Retour à l'accueil"
                aria-label="Retour à l'accueil"
              >
                <Link to="/accueil">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>

              <Link to="/accueil" className="flex items-center gap-2 min-w-0">
                <img
                  src={logo.url}
                  alt="Logo BERSA"
                  className="h-8 w-8 rounded-lg shadow-xs bg-white p-0.5 object-contain shrink-0"
                />
                <div className="flex flex-col leading-none">
                  <span className="font-serif text-lg font-black tracking-tight text-white">
                    BERSA
                  </span>
                  <span className="text-[10px] font-semibold text-amber-400">
                    Berceau du Savoir
                  </span>
                </div>
              </Link>
            </div>

            {/* DROITE : Bouton unique à 3 lignes ☰ avec les 8 fonctionnalités */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/10 rounded-lg shrink-0"
                    aria-label="Menu principal BERSA"
                    title="Menu principal"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-64 p-2 bg-white text-slate-900 shadow-xl border border-slate-200 rounded-xl">
                  <DropdownMenuLabel className="font-serif text-sm font-bold text-[#0a192f] px-2 py-1">
                    Services BERSA
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {visibleTabs.map((tb) => (
                    <DropdownMenuItem key={tb.to} asChild>
                      <Link
                        to={tb.to}
                        className="flex items-center gap-3 px-2.5 py-2 text-sm rounded-lg hover:bg-slate-100 cursor-pointer font-medium text-slate-700 hover:text-[#0a192f] transition"
                        activeProps={{ className: "bg-blue-50 text-blue-900 font-semibold" }}
                      >
                        <tb.icon className="h-4 w-4 text-blue-900 shrink-0" />
                        <span>{tb.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profil"
                      className="flex items-center gap-3 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Mon profil</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>
        </header>
        <main>{children}</main>
      </div>
    </AuthGate>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-royal-gradient px-4 py-6 text-royal-foreground md:py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {title.includes("BERSA") && <p className="mt-1 font-display text-sm text-gold">Berceau du Savoir</p>}
        {subtitle && <p className="mt-1 max-w-2xl text-xs opacity-85 md:text-sm">{subtitle}</p>}
        <div className="mt-3 h-0.5 w-12 rounded bg-gold" />
      </div>
    </div>
  );
}
