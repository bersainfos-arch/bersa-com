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
  Save, 
  Download, 
  FilePlus, 
  FolderOpen, 
  Pencil, 
  Share2, 
  Copy, 
  Trash2, 
  Printer,
  FileDown, 
  FileCode, 
  Globe
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
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
  { to: "/cv-studio", label: "Modèles CV", icon: User },
  { to: "/anti-plagiat", label: "Anti-plagiat", icon: ShieldAlert },
  { to: "/abonnements", label: "Abonnements", icon: Crown },
  { to: "/parametres", label: "Paramètres", icon: Settings },
  { to: "/gestion", label: "Gestion", icon: ShieldCheck, adminOnly: true },
];

export interface DocumentMenuActions {
  onSave?: () => void;
  onSaveAsWord?: () => void;
  onSaveAsPdf?: () => void;
  onSaveAsTxt?: () => void;
  onSaveAsHtml?: () => void;
  onNewDoc?: () => void;
  onOpenFile?: () => void;
  onRename?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function AppShell({
  children,
  minimal = false,
  title,
  onTitleChange,
  documentActions,
}: {
  children: ReactNode;
  minimal?: boolean;
  title?: string;
  onTitleChange?: (val: string) => void;
  documentActions?: DocumentMenuActions;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        {/* En-tête épuré plein écran : Sur Rédaction, Retour + Titre du document | Normal ailleurs */}
        <header className={`sticky top-0 z-30 bg-[#0a192f] text-white shadow-sm ${minimal ? "h-10" : ""}`}>
          <div className={`mx-auto flex max-w-7xl items-center justify-between px-2 sm:px-4 ${minimal ? "h-10" : "h-12"}`}>
            
            {/* GAUCHE : Bouton retour ← + Titre ou Logo */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 rounded-full shrink-0"
                title="Retour"
                aria-label="Retour"
                onClick={() => {
                  const index = Number(window.history.state?.__TSR_index ?? 0);
                  if (index > 0) window.history.back();
                  else void navigate({ to: "/", replace: true });
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {minimal ? (
                /* Espace discret affichant le titre du document */
                <div className="flex items-center gap-1.5 flex-1 max-w-xs sm:max-w-sm min-w-0 px-2 py-0.5 rounded bg-white/10 text-white text-xs">
                  <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <input
                    type="text"
                    value={title ?? "Mon_Document_BERSA"}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    placeholder="Titre du document..."
                    className="bg-transparent border-none outline-none text-white text-xs font-medium w-full truncate placeholder:text-white/40"
                    title="Titre du document (cliquez pour modifier)"
                  />
                </div>
              ) : (
                <Link to="/" className="flex items-center gap-2 min-w-0">
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
              )}
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
                  {/* Actions du document actif (comme dans les 3 points des documents récents) */}
                  {documentActions && (
                    <>
                      <DropdownMenuLabel className="font-serif text-xs font-bold text-[#0a192f] uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                        <span>Options Document</span>
                        <span className="text-[10px] text-amber-600 font-sans font-semibold">Atelier</span>
                      </DropdownMenuLabel>

                      {documentActions.onSave && (
                        <DropdownMenuItem onClick={documentActions.onSave} className="flex items-center gap-2.5 py-2 font-semibold text-blue-950 cursor-pointer hover:bg-blue-50 rounded-lg">
                          <Save className="h-4 w-4 text-blue-800" />
                          <span>Enregistrer</span>
                        </DropdownMenuItem>
                      )}

                      {(documentActions.onSaveAsWord || documentActions.onSaveAsPdf) && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center gap-2.5 py-2 font-medium cursor-pointer hover:bg-slate-100 rounded-lg">
                            <Download className="h-4 w-4 text-slate-700" />
                            <span>Enregistrer sous…</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-1">
                            {documentActions.onSaveAsWord && (
                              <DropdownMenuItem onClick={documentActions.onSaveAsWord} className="cursor-pointer py-1.5 text-xs font-medium">
                                <FileText className="h-3.5 w-3.5 mr-2 text-blue-700" />
                                <span>Word (.doc)</span>
                              </DropdownMenuItem>
                            )}
                            {documentActions.onSaveAsPdf && (
                              <DropdownMenuItem onClick={documentActions.onSaveAsPdf} className="cursor-pointer py-1.5 text-xs font-medium">
                                <FileDown className="h-3.5 w-3.5 mr-2 text-rose-700" />
                                <span>PDF (.pdf)</span>
                              </DropdownMenuItem>
                            )}
                            {documentActions.onSaveAsTxt && (
                              <DropdownMenuItem onClick={documentActions.onSaveAsTxt} className="cursor-pointer py-1.5 text-xs font-medium">
                                <FileCode className="h-3.5 w-3.5 mr-2 text-slate-600" />
                                <span>Texte brut (.txt)</span>
                              </DropdownMenuItem>
                            )}
                            {documentActions.onSaveAsHtml && (
                              <DropdownMenuItem onClick={documentActions.onSaveAsHtml} className="cursor-pointer py-1.5 text-xs font-medium">
                                <Globe className="h-3.5 w-3.5 mr-2 text-emerald-700" />
                                <span>Page web (.html)</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}

                      {documentActions.onNewDoc && (
                        <DropdownMenuItem onClick={documentActions.onNewDoc} className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-slate-100 rounded-lg">
                          <FilePlus className="h-4 w-4 text-slate-700" />
                          <span>Nouveau document</span>
                        </DropdownMenuItem>
                      )}

                      {documentActions.onOpenFile && (
                        <DropdownMenuItem onClick={documentActions.onOpenFile} className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-slate-100 rounded-lg">
                          <FolderOpen className="h-4 w-4 text-slate-700" />
                          <span>Ouvrir un fichier…</span>
                        </DropdownMenuItem>
                      )}

                      {documentActions.onRename && (
                        <DropdownMenuItem onClick={documentActions.onRename} className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-slate-100 rounded-lg">
                          <Pencil className="h-4 w-4 text-slate-700" />
                          <span>Renommer</span>
                        </DropdownMenuItem>
                      )}

                      {documentActions.onShare && (
                        <DropdownMenuItem onClick={documentActions.onShare} className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-slate-100 rounded-lg">
                          <Share2 className="h-4 w-4 text-slate-700" />
                          <span>Partager…</span>
                        </DropdownMenuItem>
                      )}

                      {documentActions.onDuplicate && (
                        <DropdownMenuItem onClick={documentActions.onDuplicate} className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-slate-100 rounded-lg">
                          <Copy className="h-4 w-4 text-slate-700" />
                          <span>Dupliquer</span>
                        </DropdownMenuItem>
                      )}

                      {documentActions.onDelete && (
                        <DropdownMenuItem onClick={documentActions.onDelete} className="flex items-center gap-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                          <Trash2 className="h-4 w-4 text-rose-600" />
                          <span>Effacer le contenu</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                    </>
                  )}

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
