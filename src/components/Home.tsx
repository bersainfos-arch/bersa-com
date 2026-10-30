import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
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

interface TemplateItem {
  id: string;
  label: string;
  icon: typeof FileBadge;
  badge?: "Nouveau" | "Premium";
  badgeColor?: string;
  prompt: string;
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
    label: "CV & Motivation",
    icon: Briefcase,
    prompt: "Conçois un CV percutant et une lettre de motivation ciblée.",
  },
  {
    id: "juridique",
    label: "Requête Juridique",
    icon: Scale,
    badge: "Nouveau",
    badgeColor: "bg-[#FF5A5A]",
    prompt: "Rédige une requête juridique formelle conforme au droit applicable.",
  },
  {
    id: "business",
    label: "Business Plan",
    icon: BarChart3,
    badge: "Premium",
    badgeColor: "bg-[#FFD700] text-[#854d0e]",
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

const STARTER_FILES: RecentDoc[] = [
  {
    id: "1",
    title: "Mémoire_UNIKIN.pdf",
    date: "Aujourd'hui 14:32",
    size: "2.4 Mo",
    type: "pdf",
  },
  {
    id: "2",
    title: "CV_ANAPI.docx",
    date: "Hier, 09:15",
    size: "1.1 Mo",
    type: "docx",
  },
  {
    id: "3",
    title: "Statuts_ASBL_RDC.pdf",
    date: "22 sept. • 3.6 Mo",
    size: "3.6 Mo",
    type: "pdf",
  },
];

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"recents" | "appareil">("recents");
  const [filesList, setFilesList] = useState<RecentDoc[]>(STARTER_FILES);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.email === "dieudonnedjoma@gmail.com";

  // Chargement des documents réels de l'utilisateur s'ils existent
  useEffect(() => {
    async function loadUserDocs() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("user_docs")
          .select("id, title, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          const mapped: RecentDoc[] = data.map((doc) => ({
            id: doc.id,
            title: doc.title || "Document sans titre",
            date: new Date(doc.updated_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            }),
            size: "1.2 Mo",
            type: doc.title?.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
          }));
          setFilesList(mapped);
        }
      } catch {
        // En cas d'erreur ou hors-ligne, les fichiers BERSA par défaut restent visibles
      }
    }
    void loadUserDocs();
  }, [user]);

  // Gestion de l'import depuis l'appareil
  const handleDeviceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const newDoc: RecentDoc = {
      id: `dev-${Date.now()}`,
      title: file.name,
      date: "À l'instant",
      size: `${(file.size / (1024 * 1024)).toFixed(1)} Mo`,
      type: isPdf ? "pdf" : "docx",
    };
    setFilesList((prev) => [newDoc, ...prev]);
    setActiveTab("recents");
  };

  const filteredFiles = filesList.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-[#0A2342] font-sans pb-32 max-w-md mx-auto relative select-none">
      {/* 1. EN-TÊTE COMPOSANT <Header /> */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between gap-2.5">
        {/* Logo BERSA */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-12 h-12 bg-[#0A84FF] rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
            B
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[#0A2342] font-extrabold text-[21px] tracking-tight">
              BERSA
            </span>
            <span className="text-gray-500 text-[11px] font-medium -mt-0.5">
              Berceau du savoir
            </span>
          </div>
        </Link>

        {/* Barre de recherche pilule */}
        <div className="flex-1 max-w-[170px] sm:max-w-none relative">
          <div className="flex items-center bg-[#F2F4F7] rounded-full px-3 py-2 text-xs text-gray-500 gap-1.5 border border-transparent focus-within:border-[#0A84FF] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche"
              className="bg-transparent border-none outline-none w-full text-xs text-[#0A2342] placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Avatar + Menu Hamburger */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/profil"
            className="w-10 h-10 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors"
            title="Mon profil"
          >
            <User className="w-5 h-5 text-gray-600" />
          </Link>

          {/* Menu à 3 traits complet pour préserver tous les accès */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 text-[#0A2342] hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu principal"
              >
                <Menu className="w-6 h-6 stroke-[2.2]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5 font-sans z-50">
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase px-2 py-1">
                Navigation BERSA
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/redaction" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <PenLine className="h-4 w-4 text-[#0A84FF]" />
                  <span>Atelier de rédaction</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/formations" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  <span>Formations</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/bibliotheque" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  <span>Bibliothèque</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/opportunites" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Opportunités</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/documents" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <Files className="h-4 w-4 text-blue-500" />
                  <span>Mes documents</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/anti-plagiat" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  <span>Anti-plagiat</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/abonnements" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <CreditCard className="h-4 w-4 text-violet-500" />
                  <span>Abonnements</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/parametres" className="flex items-center gap-2.5 py-2 cursor-pointer font-medium">
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Paramètres</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/gestion"
                      className="flex items-center gap-2.5 py-2 cursor-pointer font-bold text-amber-700 bg-amber-50/80 rounded"
                    >
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
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
                className="flex items-center gap-2.5 py-2 cursor-pointer text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 2. SECTION MODÈLES DE DOCUMENTS <DocumentTemplates /> */}
      <section className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#0A2342] font-bold text-[19px] tracking-tight">
            Modèles de documents
          </h2>
          <Link
            to="/redaction"
            className="text-[#0A84FF] font-semibold text-[15px] flex items-center gap-0.5 hover:underline"
          >
            Voir tout <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Grille 4 colonnes proportionnelles 1:1 exacte */}
        <div className="grid grid-cols-4 gap-2.5">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => navigate({ to: "/redaction" })}
                className="relative bg-white rounded-2xl p-2.5 pt-3.5 flex flex-col items-center justify-between border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-md transition-all active:scale-[0.97] min-h-[128px]"
              >
                {/* Découpe vague d'angle bleu ciel */}
                <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden rounded-tr-2xl pointer-events-none">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#A8D0F0]/60" />
                </div>

                {/* Badge système */}
                {tmpl.badge === "Nouveau" && (
                  <span className="absolute -top-2 right-2 bg-[#FF5A5A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Nouveau
                  </span>
                )}
                {tmpl.badge === "Premium" && (
                  <span className="absolute -top-2 right-1.5 bg-[#FFD700] text-[#854d0e] text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-[#eab308]/40">
                    <Star className="w-2.5 h-2.5 fill-[#854d0e]" />
                    Premium
                  </span>
                )}

                {/* Icône centrale */}
                <div className="flex-1 flex items-center justify-center my-1">
                  <Icon className="w-11 h-11 text-[#0A2342] stroke-[1.8]" />
                </div>

                {/* Label centré */}
                <span className="text-[11px] font-bold text-[#0A2342] text-center leading-tight">
                  {tmpl.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. ONGLETS + LISTE DE FICHIERS <RecentFiles /> */}
      <section className="px-4 mt-6">
        {/* Pilules d'onglets */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("recents")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === "recents"
                ? "bg-[#0A84FF] text-white shadow-sm"
                : "bg-[#E5E7EB] text-gray-700 hover:bg-gray-300"
            }`}
          >
            Récents
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("appareil");
              fileInputRef.current?.click();
            }}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "appareil"
                ? "bg-[#0A84FF] text-white shadow-sm"
                : "bg-[#E5E7EB] text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Appareil
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf,.txt"
            onChange={handleDeviceImport}
            className="hidden"
          />
        </div>

        {/* Liste des cartes fichiers avec coin plié */}
        <div className="space-y-2.5">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => navigate({ to: "/redaction" })}
              className="bg-white rounded-2xl p-3.5 flex items-center gap-3.5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md cursor-pointer transition-all active:scale-[0.99]"
            >
              {/* Icône avec coin plié en haut à droite */}
              <div
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shrink-0 shadow-sm ${
                  file.type === "pdf" ? "bg-[#FF5A5A]" : "bg-[#0A84FF]"
                }`}
              >
                {/* Coin plié top-right */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-white/35 rounded-bl-sm" />
                <span>{file.type === "pdf" ? "P" : "W"}</span>
              </div>

              {/* Titre et métadonnées */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#0A2342] text-[15px] truncate">
                  {file.title}
                </h3>
                <p className="text-gray-400 text-xs font-medium mt-0.5">
                  {file.date} {file.size ? `• ${file.size}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BOUTON D'ACTION 3D FLOTTANT <PrimaryAction /> */}
      <div className="fixed bottom-[86px] left-0 right-0 max-w-md mx-auto px-6 z-40 pointer-events-none">
        <button
          type="button"
          onClick={() => navigate({ to: "/redaction" })}
          className="pointer-events-auto w-full h-[62px] rounded-full bg-gradient-to-b from-[#2B9BFF] via-[#0A84FF] to-[#0060C0] text-white font-extrabold text-[23px] flex items-center justify-center gap-2 shadow-[0_14px_30px_rgba(10,132,255,0.48)] active:scale-[0.98] transition-transform border-t border-white/40 ring-1 ring-white/20"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
          <span>Rédiger</span>
        </button>
      </div>

      {/* 5. BARRE DE NAVIGATION INFÉRIEURE <BottomNav /> */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 h-[68px] px-2 flex items-center justify-around z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        {/* 1. Accueil */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center gap-1 text-[#0A84FF] w-12"
        >
          <HomeIcon className="w-6 h-6 fill-[#0A84FF]" />
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>

        {/* 2. Fichier */}
        <Link
          to="/documents"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#0A84FF] transition-colors w-12"
        >
          <FileText className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Fichier</span>
        </Link>

        {/* 3. Bibliothèque */}
        <Link
          to="/bibliotheque"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#0A84FF] transition-colors w-14"
        >
          <GraduationCap className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Bibliothèque</span>
        </Link>

        {/* 4. Formation */}
        <Link
          to="/formations"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#0A84FF] transition-colors w-14"
        >
          <Briefcase className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Formation</span>
        </Link>

        {/* 5. Opportunités */}
        <Link
          to="/opportunites"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#0A84FF] transition-colors w-16"
        >
          <Briefcase className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium truncate">Opportunités</span>
        </Link>

        {/* 6. Découvrir */}
        <Link
          to="/accueil"
          className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#0A84FF] transition-colors w-12"
        >
          <Compass className="w-6 h-6 stroke-[1.8]" />
          <span className="text-[10px] font-medium">Découvrir</span>
        </Link>
      </nav>
    </div>
  );
}
