import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Search,
  Menu,
  User,
  FileBadge,
  Briefcase,
  Scale,
  BarChart3,
  Home as HomeIcon,
  FileText,
  GraduationCap,
  Compass,
  Star,
  Plus,
  PenLine,
  BookOpen,
  Award,
  Files,
  ShieldAlert,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Upload,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CV_MODEL_PHOTOS } from "@/lib/cv-templates";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { queueDocumentFile } from "@/lib/document-import";
import { HomeDocActions } from "@/components/HomeDocActions";
import { signedCommunity } from "@/lib/community";
import { homeCards, TEMPLATE_DOMAINS, templateDomain } from "@/lib/home-catalog";
import logo from "@/assets/bersa-logo.png.asset.json";

interface TemplateItem {
  id: string;
  label: string;
  icon: typeof FileBadge;
  badge?: "Nouveau" | "Premium" | undefined;
  badgeColor?: string;
  prompt: string;
  content?: string | null;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "lettre",
    label: "Lettre Administrative",
    icon: FileBadge,
    prompt: "Rédige une lettre administrative officielle respectant les normes professionnelles.",
  },
    {
    id: "cv",
    label: "Modèles de CV Pro",
    icon: Briefcase,
    prompt: "Conçois un CV moderne et percutant dans le Studio CV BERSA.",
  },
  {
    id: "juridique",
    label: "Documents juridiques",
    icon: Scale,
    badge: "Nouveau",
    badgeColor: "bg-muted",
    prompt: "Rédige un document juridique formel conforme au droit applicable.",
  },
  {
    id: "business",
    label: "Business Plan",
    icon: BarChart3,
    badge: "Premium",
    badgeColor: "bg-muted text-foreground",
    prompt: "Élabore un plan d'affaires structuré : résumé opérationnel, analyse marché et prévisions.",
  },
];

interface RecentDoc {
  id: string;
  title: string;
  date: string;
  size: string;
  type: "pdf" | "docx";
}

export function Home({ catalog = false }: { catalog?: boolean }) {
  const navigate = useNavigate();
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [domain, setDomain] = useState("Tous");
  const [avatar, setAvatar] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setAvatar("");
    if (user) void supabase.from("profiles").select("avatar_url").eq("id", user.id).single().then(async ({ data }) => {
      if (!data?.avatar_url) return;
      try { const url = /^https:\/\//.test(data.avatar_url) ? data.avatar_url : await signedCommunity(data.avatar_url); if (active) setAvatar(url); } catch {}
    });
    return () => { active = false; };
  }, [user]);
  const [activeTab, setActiveTab] = useState<"recents" | "appareil">("recents");
  const [filesList, setFilesList] = useState<RecentDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>(TEMPLATES);

    // Diaporama automatique de l'effigie des Modèles CV
  const [cvSlideIndex, setCvSlideIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCvSlideIndex((prev) => (prev + 1) % CV_MODEL_PHOTOS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void supabase.from("document_templates").select("id, title, badge, prompt, content_html").eq("published", true).order("created_at").then(({ data }) => {
      if (!data?.length) return;
      setTemplates(data.map((t): TemplateItem => ({
        id: t.id, label: t.title, icon: FileBadge, prompt: t.prompt, content: t.content_html,
        badge: t.badge === "Nouveau" || t.badge === "Premium" ? (t.badge as "Nouveau" | "Premium") : undefined,
        badgeColor: t.badge === "Premium" ? "bg-muted text-foreground" : "bg-muted",
      })));
    });
  }, []);

  const isAdmin = user?.email?.toLowerCase() === "dieudonnedjoma@gmail.com";

  // Chargement des documents réels de l'utilisateur
  useEffect(() => {
    async function loadUserDocs() {
      if (!user) { setFilesList([]); return; }
      const key = `bersa_recent_${user.id}`;
      try { setFilesList(JSON.parse(sessionStorage.getItem(key) || "[]")); } catch {}
      try {
        const { data } = await supabase
          .from("user_docs")
          .select("id, title, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(8);

        if (data) {
          const mapped: RecentDoc[] = data.map((doc) => ({
            id: doc.id,
            title: doc.title || "Document sans titre",
            date: new Date(doc.updated_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            }),
            size: "",
            type: doc.title?.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
          }));
          setFilesList(mapped);
          sessionStorage.setItem(key, JSON.stringify(mapped));
        }
      } catch {
        // En cas de déconnexion, les modèles par défaut restent visibles
      }
    }
    void loadUserDocs();
  }, [user, refresh]);

  // Ouverture d'un modèle : transmet l'instruction à l'Atelier
  const handleOpenTemplate = (tmpl: TemplateItem) => {
    if (tmpl.id === "cv") { navigate({ to: "/cv-studio" }); return; }
    if (tmpl.content) {
      sessionStorage.setItem("bersa-document-html", tmpl.content);
      sessionStorage.setItem("bersa-document-title", tmpl.label);
    } else { sessionStorage.setItem("bersa-assistant-prompt", tmpl.prompt); }
    navigate({ to: "/redaction" });
  };

  // Ouverture d'un document existant dans l'Atelier
  const handleOpenDoc = (file: RecentDoc) => {
    sessionStorage.setItem("bersa-document-id", file.id);
    navigate({ to: "/redaction" });
  };

  // Import de fichier depuis l'appareil
  const handleDeviceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    queueDocumentFile(file);
    e.target.value = "";
    navigate({ to: "/redaction" });
  };

  const orderedTemplates = [...templates].sort((a,b) => TEMPLATE_DOMAINS.indexOf(templateDomain(a.label)) - TEMPLATE_DOMAINS.indexOf(templateDomain(b.label)));
  const matchingTemplates = orderedTemplates.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()) && (domain === "Tous" || templateDomain(t.label) === domain));
  const displayedTemplates = catalog ? matchingTemplates : homeCards(matchingTemplates);
  const filteredFiles = filesList.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full min-w-0 bg-card text-foreground font-sans pb-32 max-w-md md:max-w-4xl mx-auto relative select-none">
      {/* 1. EN-TÊTE AVEC LOGO OFFICIEL BERSA */}
      <header className="px-3 pt-3 pb-2 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={logo.url}
            alt="Logo officiel BERSA"
            className="w-9 h-9 object-contain rounded-lg shadow-xs"
          />
          <div className="flex w-[64px] flex-col leading-tight">
            <span className="text-foreground font-extrabold text-[18px] tracking-normal">
              BERSA
            </span>
            <span className="text-muted-foreground text-[7px] font-medium -mt-0.5 whitespace-nowrap">
              Berceau du savoir
            </span>
          </div>
        </Link>

        {/* Barre de recherche pilule */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center bg-muted rounded-full px-3 py-2 text-xs text-muted-foreground gap-1.5 border border-transparent focus-within:border-[#0A84FF] focus-within:bg-card transition-all">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="search"
              aria-label="Rechercher documents et modèles"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher…"
              className="bg-transparent border-none outline-none w-full text-xs text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Effacer la recherche" onClick={() => setSearchQuery("")}><X className="h-4 w-4" /></Button>}
          </div>
        </div>

        {/* Avatar + Menu Hamburger */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/profil"
            className="w-9 h-9 shrink-0 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            title="Mon profil"
          >
            {avatar ? <img src={avatar} alt="Votre photo de profil" className="h-full w-full rounded-full object-cover" onError={() => setAvatar("")} /> : <User className="w-5 h-5 text-muted-foreground" />}
          </Link>

          {/* Menu principal à 3 traits */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 bg-transparent p-1.5 text-foreground hover:bg-muted rounded-lg transition-colors"
                aria-label="Menu principal"
              >
                <Menu className="w-6 h-6 stroke-[2.2]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5 font-sans z-50">
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase px-2 py-1">
                Navigation BERSA
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/redaction" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <PenLine className="h-4 w-4 text-foreground" />
                  <span>Atelier de rédaction</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/formations" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>Formations</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/bibliotheque" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>Bibliothèque</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/opportunites" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Opportunités</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/documents" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <Files className="h-4 w-4 text-muted-foreground" />
                  <span>Mes documents</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/anti-plagiat" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <span>Anti-plagiat</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/abonnements" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Abonnements</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/parametres" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Paramètres</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/gestion"
                      className="flex items-center gap-2.5 py-2 cursor-pointer font-bold text-muted-foreground bg-muted rounded"
                    >
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span>Espace de gestion</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-2.5 py-2 cursor-pointer text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="px-4 mt-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="min-w-0 text-foreground font-bold text-lg leading-tight">Modèles de documents et affiches</h2>
          <Link to={catalog ? "/" : "/modeles"} className="shrink-0 text-primary font-semibold text-sm flex items-center">{catalog ? "Accueil" : "Voir tout"}<ChevronRight className="w-4 h-4" /></Link>
        </div>
        {catalog && <div className="mb-4 flex gap-2 overflow-x-auto pb-2">{["Tous", ...TEMPLATE_DOMAINS].map(d => <Button key={d} size="sm" variant={domain === d ? "default" : "outline"} className="shrink-0" onClick={() => setDomain(d)}>{d}</Button>)}</div>}
          <div className={catalog ? "grid grid-cols-2 gap-3 sm:grid-cols-4" : "grid grid-cols-4 gap-2"}>
          {displayedTemplates.map(tmpl => {
            const Icon = tmpl.icon;
            return (
              <Button
                key={tmpl.id}
                variant="ghost"
                onClick={() => handleOpenTemplate(tmpl)}
                className={
                  tmpl.id === "cv"
                    ? "group relative h-28 min-w-0 overflow-hidden rounded-2xl p-0 whitespace-normal bg-white shadow-[0_6px_20px_rgba(10,35,66,0.25)] hover:shadow-xl hover:-translate-y-0.5 transition-all border border-gold/40 ring-1 ring-gold/30 flex flex-col text-left"
                    : "relative h-28 min-w-0 overflow-hidden flex flex-col justify-between items-start gap-1 rounded-2xl p-2.5 whitespace-normal bg-gradient-to-br from-[#0A2342] via-[#0F325E] to-[#0A1D36] text-white shadow-[0_6px_20px_rgba(10,35,66,0.22)] hover:shadow-xl hover:-translate-y-0.5 transition-all border border-white/10 ring-1 ring-gold/20"
                }
              >
                {tmpl.id === "cv" ? (
                  <div className="relative size-full flex flex-col bg-white overflow-hidden text-slate-800 pointer-events-none select-none">
                    {/* 1. En-tête professionnel étalé d'un coin à l'autre */}
                    <div className="relative h-10 bg-gradient-to-r from-[#0A2342] via-[#12396B] to-[#1E3A8A] px-2 flex items-center gap-2 shrink-0 border-b border-gold/30">
                      {/* Photo d'identité en diaporama continu */}
                      <div className="relative size-7 rounded-[2px] overflow-hidden bg-slate-900 ring-1 ring-white/90 shrink-0 shadow-xs">
                        {CV_MODEL_PHOTOS.map((src, idx) => (
                          <img
                            key={src}
                            src={src}
                            alt="Photo CV"
                            className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ease-in-out ${
                              cvSlideIndex === idx ? "opacity-100 scale-100" : "opacity-0 scale-95"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Lignes d'identité : Nom et Titre */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <div className="h-2 w-14 bg-gradient-to-r from-gold via-amber-200 to-gold rounded-[1px] shadow-2xs" />
                        <div className="h-1.5 w-20 bg-white/85 rounded-[1px]" />
                      </div>

                      {/* Badge A4 Pro dans l'angle supérieur droit */}
                      <span className="shrink-0 bg-gold/95 text-[#0A2342] text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] shadow-xs">
                        A4
                      </span>
                    </div>

                    {/* 2. Corps du CV rempli sur 2 colonnes jusqu'aux bords */}
                    <div className="flex-1 grid grid-cols-[30px_1fr] bg-white p-1 gap-1.5 overflow-hidden">
                      {/* Colonne latérale (Compétences & Coordonnées) */}
                      <div className="bg-slate-100/90 rounded-[2px] p-1 flex flex-col gap-1 border-r border-slate-200/70">
                        <div className="h-1.5 w-full bg-[#0A2342] rounded-[0.5px]" />
                        <div className="h-1 w-full bg-slate-400 rounded-[0.5px]" />
                        <div className="h-1 w-3/4 bg-slate-400 rounded-[0.5px]" />
                        <div className="h-1.5 w-full bg-gold rounded-[0.5px] mt-0.5" />
                        <div className="h-1 w-full bg-slate-400 rounded-[0.5px]" />
                        <div className="h-1 w-2/3 bg-slate-400 rounded-[0.5px]" />
                      </div>

                      {/* Colonne principale (Expériences & Formations) */}
                      <div className="flex flex-col gap-1 pr-1">
                        <div className="h-1.5 w-16 bg-[#0A2342] rounded-[0.5px]" />
                        <div className="h-1 w-full bg-slate-300 rounded-[0.5px]" />
                        <div className="h-1 w-4/5 bg-slate-300 rounded-[0.5px]" />
                        <div className="h-1.5 w-14 bg-[#0A2342] rounded-[0.5px] mt-0.5" />
                        <div className="h-1 w-full bg-slate-300 rounded-[0.5px]" />
                      </div>
                    </div>

                    {/* 3. Bandeau BERSA ancré sur les deux coins inférieurs */}
                    <div className="relative bg-gradient-to-r from-[#0A2342] via-[#0F325E] to-[#0A1D36] text-white px-2 py-1 flex items-center justify-between border-t border-gold/40 shrink-0">
                      <span className="text-[10px] font-bold text-white tracking-tight leading-none drop-shadow-xs">
                        Modèles de CV Pro
                      </span>
                      <span className="text-[8px] font-semibold text-gold uppercase tracking-wider">
                        120 Modèles
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="absolute -right-3 -top-3 size-12 rounded-full bg-gradient-to-br from-gold/30 to-transparent pointer-events-none" />
                    <span className="grid size-9 place-items-center rounded-xl bg-white/10 ring-1 ring-gold/40 shadow-xs">
                      <Icon className="size-5 text-gold" />
                    </span>
                    <span className="w-full text-left text-[11px] font-bold leading-tight line-clamp-2 text-white">
                      {tmpl.label}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider font-semibold text-gold/90">
                      {templateDomain(tmpl.label)}
                    </span>
                  </>
                )}
              </Button>
          })}
        </div>
        {!displayedTemplates.length && <p className="py-4 text-sm text-muted-foreground">Aucun modèle publié dans cette catégorie.</p>}
        {catalog && <Link to="/cv-studio" className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-semibold"><Briefcase className="size-4" />Tous les modèles CV</Link>}
      </section>

      {/* 3. ONGLETS RÉCENTS / APPAREIL */}
      <section className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            type="button"
            onClick={() => setActiveTab("recents")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === "recents"
                ? "bg-[#0A84FF] text-white shadow-sm"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Récents
          </Button>
          <Button
            type="button"
            onClick={() => {
              setActiveTab("appareil");
              fileInputRef.current?.click();
            }}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "appareil"
                ? "bg-[#0A84FF] text-white shadow-sm"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
                     >
            <Upload className="w-3.5 h-3.5" />
            Appareil
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf,.txt"
            onChange={handleDeviceImport}
            className="hidden"
          />
        </div>

        {/* Liste des cartes fichiers */}
        <div className="space-y-2.5">
          {filteredFiles.length === 0 && <p className="py-4 text-sm text-muted-foreground">Aucun document récent.</p>}
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-card rounded-lg p-3.5 flex items-center gap-3.5 border border-border shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.99]"
            >
              {/* Icône avec coin plié */}
              <Button variant="ghost" size="icon" aria-label={`Ouvrir ${file.title}`} onClick={() => handleOpenDoc(file)}
                className={`relative w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl text-primary-foreground shrink-0 shadow-sm ${
                  file.type === "pdf" ? "bg-doc-pdf text-white" : "bg-doc-word text-white"
                }`}
              >
                <div className="absolute top-0 right-0 w-3 h-3 bg-card/35 rounded-bl-sm" />
                <span>{file.type === "pdf" ? "P" : "W"}</span>
              </Button>

              {/* Titre et détails */}
              <Button variant="ghost" onClick={() => handleOpenDoc(file)} className="h-auto flex-1 min-w-0 flex-col items-start p-0 text-left">
                <h3 className="font-bold text-foreground text-[15px] truncate w-full">
                  {file.title}
                </h3>
                <p className="text-muted-foreground text-xs font-medium mt-0.5">
                  {file.date} {file.size ? `• ${file.size}` : ""}
                </p>
              </Button>
              <HomeDocActions doc={file} onOpen={() => handleOpenDoc(file)} onChanged={() => setRefresh(n => n+1)} />
            </div>
          ))}
        </div>
      </section>

      {/* 4. GROS BOUTON 3D FLOTTANT : + RÉDIGER */}
      <div className="fixed bottom-[86px] left-0 right-0 max-w-md md:max-w-4xl mx-auto px-6 z-40 pointer-events-none">
        <Button asChild
          className="pointer-events-auto w-full h-[62px] rounded-full bg-gradient-to-b from-[#2B9BFF] via-[#0A84FF] to-[#0060C0] text-white font-extrabold text-[23px] flex items-center justify-center gap-2 shadow-[0_14px_30px_rgba(10,132,255,0.48)] active:scale-[0.98] transition-transform border-t border-white/40 ring-1 ring-white/20"
        >
          <Link to="/redaction" preload="intent" onPointerEnter={() => void router.preloadRoute({ to: "/redaction" })}>
            <Plus className="w-7 h-7 stroke-[3]" />
            <span>Rédiger</span>
          </Link>
        </Button>
      </div>    

      {/* 5. NAVIGATION INFÉRIEURE FIXE */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md md:max-w-4xl mx-auto bg-card border-t border-border h-[68px] px-2 flex items-center justify-around z-30 shadow-sm">
        <Link to="/" className="flex flex-col items-center justify-center gap-1 text-foreground w-12">
          <HomeIcon className="w-6 h-6 fill-primary" />
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>
        <Link to="/documents" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-12">
          <FileText className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Fichier</span>
        </Link>
        <Link to="/bibliotheque" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-14">
          <BookOpen className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Bibliothèque</span>
        </Link>
        <Link to="/formations" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-14">
          <GraduationCap className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Formation</span>
        </Link>
        <Link to="/opportunites" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-16">
          <Award className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium truncate">Opportunités</span>
        </Link>
        <Link to="/accueil" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors w-12">
          <Compass className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Découvrir</span>
        </Link>
      </nav>
    </div>
  );
}
