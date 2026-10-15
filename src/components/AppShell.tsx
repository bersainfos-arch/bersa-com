import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  FileText,
  PenLine,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  User,
  Bot,
  Crown,
  Briefcase,
  Settings,
  ShieldAlert,
  MessageCircle,
} from "lucide-react";
import logo from "@/assets/bersa-logo.png.asset.json";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  to: string;
  label: string;
  icon: typeof Bot;
  exact?: boolean;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { to: "/", label: "Assistant", icon: Bot, exact: true },
  { to: "/redaction", label: "Rédaction", icon: PenLine },
  { to: "/anti-plagiat", label: "Anti-plagiat", icon: ShieldAlert },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/formations", label: "Formation", icon: GraduationCap },
  { to: "/bibliotheque", label: "Bibliothèque", icon: BookOpen },
  { to: "/opportunites", label: "Opportunités", icon: Briefcase },
  { to: "/gestion", label: "Gestion", icon: ShieldCheck, adminOnly: true },
  { to: "/abonnements", label: "Abonnement", icon: Crown },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(Boolean(data));
    });
  }, [user]);

  const visibleTabs = menuItems.filter((m) => !m.adminOnly || isAdmin);

  return (
    <AuthGate>
      <div className="min-h-screen pb-20 md:pb-0">
        {/* En-tête compact pour agrandir l'espace utile du papier A4 */}
        <header className="sticky top-0 z-30 bg-royal text-royal-foreground shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-1.5 md:gap-4 md:py-2">
            {/* Logo BERSA en haut à gauche */}
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <img src={logo.url} alt="Logo BERSA" className="h-8 w-8 rounded-lg shadow-sm" />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-xl font-bold tracking-tight">BERSA</span>
                <span className="font-display text-[10px] text-gold">Berceau du Savoir</span>
              </div>
            </Link>

            {/* Menu central ordonné */}
            <nav className="hidden items-center gap-1 overflow-x-auto md:flex scrollbar-none">
              {visibleTabs.map((tb) => (
                <Link
                  key={tb.to}
                  to={tb.to}
                  activeOptions={{ exact: tb.exact ?? false }}
                  className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium opacity-85 transition hover:opacity-100"
                  activeProps={{ className: "bg-gold text-gold-foreground opacity-100 font-semibold" }}
                >
                  {tb.label}
                </Link>
              ))}
            </nav>

            {/* Bloc droit : Profil, Réglages, Contact, Langue */}
            <div className="ml-auto flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-royal-foreground hover:bg-white/10">
                <Link to="/profil" aria-label="Mon profil" title="Mon profil">
                  <User className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-royal-foreground hover:bg-white/10">
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

        {/* Barre mobile inférieure avec ordre conservé */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t bg-card py-1 shadow-lg md:hidden scrollbar-none">
          {visibleTabs.map((tb) => (
            <Link
              key={tb.to}
              to={tb.to}
              activeOptions={{ exact: tb.exact ?? false }}
              className="flex min-w-[62px] flex-1 flex-col items-center gap-0.5 py-1 text-[9px] text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              <tb.icon className="h-4 w-4" />
              <span className="truncate">{tb.label}</span>
            </Link>
          ))}
        </nav>
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
