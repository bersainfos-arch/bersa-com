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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
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
        {/* En-tête compact : menu à trois traits, logo, puis actions personnelles */}
        <header className="sticky top-0 z-30 bg-royal text-royal-foreground shadow-sm">
          <div className="mx-auto flex h-11 max-w-7xl items-center gap-1.5 px-2 md:px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-royal-foreground hover:bg-royal-foreground/10" aria-label="Ouvrir le menu des fonctionnalités">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="w-60 p-1.5">
                <DropdownMenuLabel className="font-display text-base text-primary">Fonctionnalités</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer gap-3 py-2"><Bot className="text-primary" /> Assistant</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {visibleTabs.map((tb) => (
                  <DropdownMenuItem key={tb.to} asChild>
                    <Link
                      to={tb.to}
                      className="cursor-pointer gap-3 py-2"
                      activeProps={{ className: "bg-accent font-semibold text-accent-foreground" }}
                    >
                      <tb.icon className="text-primary" /> {tb.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/" className="flex min-w-0 items-center gap-2">
              <img src={logo.url} alt="Logo BERSA" className="h-7 w-7 shrink-0 rounded-md shadow-sm" />
              <div className="flex min-w-0 flex-col leading-none">
                <span className="font-display text-lg font-bold">BERSA</span>
                <span className="truncate font-display text-[10px] text-gold">Berceau du Savoir</span>
              </div>
            </Link>

            {/* Bloc droit : Profil, Réglages, Contact, Langue */}
            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-royal-foreground hover:bg-royal-foreground/10">
                <Link to="/profil" aria-label="Mon profil" title="Mon profil">
                  <User className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-royal-foreground hover:bg-royal-foreground/10">
                <Link to="/parametres" aria-label="Paramètres" title="Paramètres">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>

              <Link
                to="/contact"
                className="hidden items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-gold-foreground transition hover:opacity-90 sm:inline-flex"
              >
                <MessageCircle className="h-3 w-3" /> Contact
              </Link>

              <LanguageSelector compact />
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
