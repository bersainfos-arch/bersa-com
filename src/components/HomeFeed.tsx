import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Menu,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Plus,
  Mic,
  AudioWaveform,
  CheckCircle2,
  Home,
  GraduationCap,
  BookOpen,
  Briefcase,
  FileText,
  Gamepad2,
  Send,
  X,
  Sparkles,
  Crown,
  ShieldCheck,
  User,
  Settings,
} from "lucide-react";
import logo from "@/assets/bersa-logo.png.asset.json";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function HomeFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Extraction propre du prénom de l'utilisateur ou valeur par défaut
  const firstName =
    (user?.user_metadata?.first_name as string) ||
    (user?.email ? user.email.split("@")[0] : "Dieudonné");

  // États d'interactions
  const [searchQuery, setSearchQuery] = useState("");
  const [likedCard1, setLikedCard1] = useState(false);
  const [likeCountCard1, setLikeCountCard1] = useState(124);
  const [savedCard1, setSavedCard1] = useState(false);

  const [likedCard2, setLikedCard2] = useState(false);
  const [likeCountCard2, setLikeCountCard2] = useState(56);
  const [savedCard2, setSavedCard2] = useState(false);

  // Assistant prompt rapide
  const [promptText, setPromptText] = useState("");
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [funModalOpen, setFunModalOpen] = useState(false);

  // Puces d'actions rapides sous la deuxième carte
  const actionBadges = [
    { label: "Reformuler", action: "reformulate" },
    { label: "plan", action: "plan" },
    { label: "développer", action: "expand" },
    { label: "Humaniser", action: "humanize" },
    { label: "Corriger", action: "correct" },
    { label: "Traduire", action: "translate" },
    { label: "continuer", action: "continue" },
    { label: "source", action: "source" },
  ];

  const handleActionBadge = (badge: { label: string; action: string }) => {
    toast.info(`Action « ${badge.label} » sélectionnée`);
    navigate({ to: "/redaction" });
  };

  const handleLaunchAssistant = () => {
    if (!promptText.trim()) {
      setIsPromptOpen(true);
      return;
    }
    // Redirection vers l'atelier de rédaction avec le texte demandé
    toast.success("Demande transmise à l'Assistant BERSA");
    navigate({ to: "/redaction" });
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#f3f5f9] text-slate-800 antialiased pb-32">
        {/* ============================================================ */}
        {/* 1. EN-TÊTE SUPÉRIEUR EXACT DE L'IMAGE                        */}
        {/* ============================================================ */}
        <header className="sticky top-0 z-40 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
            {/* Logo BERSA officiel + Titre */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d4ed8] text-white shadow-sm">
                <span className="font-serif text-xl font-bold leading-none">B</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl font-black tracking-tight text-[#0f172a]">
                  BERSA
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Berceau du Savoir
                </span>
              </div>
            </Link>

            {/* Barre de recherche arrondie (pilule) */}
            <div className="relative flex-1 max-w-[170px] sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Recherche"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-full border-slate-200 bg-slate-100/80 pl-8 pr-3 text-xs placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            {/* Avatar utilisateur + Menu hamburger à trois traits */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link to="/profil" aria-label="Profil" className="block">
                <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-200 shadow-xs">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                    alt="Profil"
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>

              {/* Menu 3 traits pour toutes les autres fonctions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-700 hover:bg-slate-100"
                    aria-label="Menu principal"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5">
                  <DropdownMenuLabel className="text-xs font-semibold text-primary">
                    Navigation BERSA
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/redaction" className="cursor-pointer gap-2 py-1.5 text-xs">
                      <FileText className="h-4 w-4 text-blue-600" /> Rédiger un document A4
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/anti-plagiat" className="cursor-pointer gap-2 py-1.5 text-xs">
                      <Sparkles className="h-4 w-4 text-amber-600" /> Détecteur Anti-plagiat
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/documents" className="cursor-pointer gap-2 py-1.5 text-xs">
                      <FileText className="h-4 w-4 text-emerald-600" /> Mes Documents sauvegardés
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/abonnements" className="cursor-pointer gap-2 py-1.5 text-xs">
                      <Crown className="h-4 w-4 text-amber-500" /> Formules d'Abonnement
                    </Link>
                  </DropdownMenuItem>
                  {user?.email === "dieudonnedjoma@gmail.com" && (
                    <DropdownMenuItem asChild>
                      <Link to="/gestion" className="cursor-pointer gap-2 py-1.5 text-xs">
                        <ShieldCheck className="h-4 w-4 text-purple-600" /> Administration BERSA
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profil" className="cursor-pointer gap-2 py-1.5 text-xs">
                      <User className="h-4 w-4 text-slate-500" /> Mon profil complet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/parametres" className="cursor-pointer gap-2 py-1.5 text-xs">
                      <Settings className="h-4 w-4 text-slate-500" /> Paramètres & Langues
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* 2. RUBAN DE NAVIGATION HORIZONTAL (7 ICÔNES EXACTES)         */}
        {/* ============================================================ */}
        <nav className="bg-white border-b border-slate-100 shadow-2xs px-2 py-2.5">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {/* 1. Accueil */}
            <Link
              to="/"
              className="flex flex-col items-center gap-1 min-w-[50px] text-[#1d4ed8] transition"
            >
              <Home className="h-5 w-5 fill-[#1d4ed8]" />
              <span className="text-[10px] font-semibold">Accueil</span>
            </Link>

            {/* 2. Rédaction */}
            <Link
              to="/redaction"
              className="flex flex-col items-center gap-1 min-w-[50px] text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <div className="relative">
                <FileText className="h-5 w-5 stroke-[1.8]" />
                <Sparkles className="absolute -top-1 -right-1.5 h-2.5 w-2.5 text-amber-500" />
              </div>
              <span className="text-[10px] font-medium text-slate-600">Rédaction</span>
            </Link>

            {/* 3. Formation */}
            <Link
              to="/formations"
              className="flex flex-col items-center gap-1 min-w-[50px] text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <GraduationCap className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Formation</span>
            </Link>

            {/* 4. Bibliothèque */}
            <Link
              to="/bibliotheque"
              className="flex flex-col items-center gap-1 min-w-[50px] text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <BookOpen className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Bibliothèque</span>
            </Link>

            {/* 5. Opportunités */}
            <Link
              to="/opportunites"
              className="flex flex-col items-center gap-1 min-w-[50px] text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <Briefcase className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Opportunités</span>
            </Link>

            {/* 6. Publier */}
            <button
              type="button"
              onClick={() => setPublishModalOpen(true)}
              className="flex flex-col items-center gap-1 min-w-[50px] text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-[1.8px] border-[#1e40af]">
                <Plus className="h-3.5 w-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-medium text-slate-600">Publier</span>
            </button>

            {/* 7. Divertissement */}
            <button
              type="button"
              onClick={() => setFunModalOpen(true)}
              className="flex flex-col items-center gap-1 min-w-[50px] text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <Gamepad2 className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Divertissement</span>
            </button>
          </div>
        </nav>

        {/* ============================================================ */}
        {/* 3. SECTION CENTRALE : « Publications »                       */}
        {/* ============================================================ */}
        <main className="mx-auto max-w-xl px-3 pt-3">
          <h2 className="py-2 text-center font-serif text-lg font-bold text-slate-800">
            Publications
          </h2>

          <div className="space-y-3.5">
            {/* CARTE 1 : Article enrichi Marie Jourdan */}
            <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md">
              {/* En-tête de la carte */}
              <div className="flex items-center justify-between pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
                      alt="Marie Jourdan"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900">
                        Marie Jourdan
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 fill-[#1d4ed8] text-white" />
                    </div>
                    <p className="text-[11px] text-slate-500">Berceau du Savoir</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Image d'illustration de haute qualité */}
              <div className="overflow-hidden rounded-xl bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"
                  alt="Livre, carnet et café sur table d'étude"
                  className="h-48 w-full object-cover transition duration-300 hover:scale-102"
                />
              </div>

              {/* Corps du texte */}
              <div className="pt-3 text-xs leading-relaxed text-slate-700">
                <p className="font-medium text-slate-900">
                  Comment structurer un article de recherche impactant en 5 étapes clés ?
                </p>
                <p className="mt-1 text-slate-600">
                  Mon fil rouge pour passer d'une idée à une publication claire et rigoureuse.
                </p>
                <p className="mt-1 font-semibold text-[#1d4ed8]">
                  #Rédaction #Méthodologie #Savoir
                </p>
              </div>

              {/* Barre d'interactions */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    setLikedCard1(!likedCard1);
                    setLikeCountCard1((c) => (likedCard1 ? c - 1 : c + 1));
                  }}
                  className="flex items-center gap-1.5 hover:text-red-600 transition"
                >
                  <Heart
                    className={`h-4 w-4 ${likedCard1 ? "fill-red-500 text-red-500" : "text-slate-500"}`}
                  />
                  <span>Aimer {likeCountCard1}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info("18 commentaires d'auteurs enregistrés")}
                  className="flex items-center gap-1.5 hover:text-[#1d4ed8] transition"
                >
                  <MessageCircle className="h-4 w-4 text-slate-500" />
                  <span>Commenter 18</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "BERSA", url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Lien copié dans le presse-papier");
                    }
                  }}
                  className="flex items-center gap-1.5 hover:text-[#1d4ed8] transition"
                >
                  <Share2 className="h-4 w-4 text-slate-500" />
                  <span>Partager</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSavedCard1(!savedCard1);
                    toast.success(savedCard1 ? "Retiré de vos favoris" : "Enregistré dans vos favoris");
                  }}
                  className="flex items-center gap-1.5 hover:text-amber-600 transition"
                >
                  <Bookmark
                    className={`h-4 w-4 ${savedCard1 ? "fill-amber-500 text-amber-500" : "text-slate-500"}`}
                  />
                  <span>Enregistrer</span>
                </button>
              </div>
            </article>

            {/* CARTE 2 : Ressource PDF + Puces d'action de l'Assistant */}
            <article className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md">
              {/* En-tête */}
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
                      alt="Marie Jourdan"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900">
                        Marie Jourdan
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 fill-[#1d4ed8] text-white" />
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Texte ressource */}
              <p className="text-xs text-slate-700 leading-relaxed">
                Nouvelle ressource ajoutée :{" "}
                <span className="font-semibold text-slate-900">
                  Guide complet des appels à projets 2026.
                </span>{" "}
                Téléchargez le PDF pour ne manquer aucune opportunité de financement.
              </p>

              {/* Ligne compacte d'interactions */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setLikedCard2(!likedCard2);
                    setLikeCountCard2((c) => (likedCard2 ? c - 1 : c + 1));
                  }}
                  className="hover:text-red-500 font-medium"
                >
                  Aimer {likeCountCard2}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => toast.info("7 commentaires enregistrés")}
                  className="hover:text-blue-600 font-medium"
                >
                  Commenter 7
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "Guide 2026 BERSA", url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Lien copié dans le presse-papier");
                    }
                  }}
                  className="hover:text-blue-600 font-medium"
                >
                  Partager
                </button>
              </div>

              {/* Puces d'actions rapides sous la deuxième carte */}
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
                {actionBadges.map((badge) => (
                  <button
                    key={badge.action}
                    type="button"
                    onClick={() => handleActionBadge(badge)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition"
                  >
                    {badge.label}
                  </button>
                ))}
              </div>
            </article>
          </div>
        </main>

        {/* ============================================================ */}
        {/* 4. CAPSULE FLOTTANTE INFÉRIEURE : ASSISTANT BERSA IA         */}
        {/* ============================================================ */}
        <div className="fixed inset-x-0 bottom-3 z-40 px-3 pointer-events-none">
          <div className="mx-auto max-w-md pointer-events-auto">
            <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-2xl backdrop-blur-lg">
              {/* Salutation personnalisée */}
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-900">
                  Salut {firstName} !
                </span>
                <span className="text-[11px] text-slate-500">
                  Que voulez-vous que je fasse pour vous ?
                </span>
              </div>

              {/* Champ d'action Assistant */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPublishModalOpen(true)}
                  className="h-9 w-9 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Ajouter une publication ou un document"
                >
                  <Plus className="h-5 w-5" />
                </Button>

                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleLaunchAssistant();
                      }
                    }}
                    placeholder="Posez votre question ou consigne…"
                    className="h-9 rounded-xl border-slate-200 bg-slate-50 px-3 text-xs placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toast.info("Enregistrement vocal prêt")}
                  className="h-9 w-9 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Dictée vocale"
                >
                  <Mic className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  onClick={handleLaunchAssistant}
                  className="h-9 w-9 shrink-0 rounded-full bg-[#1d4ed8] p-0 text-white shadow-md hover:bg-blue-700 transition"
                  aria-label="Lancer l'assistant"
                >
                  <AudioWaveform className="h-4 w-4 animate-pulse" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Boîte de dialogue : Publier */}
        <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Plus className="h-4 w-4 text-primary" /> Publier sur BERSA
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-2 text-xs">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => {
                  setPublishModalOpen(false);
                  navigate({ to: "/bibliotheque" });
                }}
              >
                <BookOpen className="h-4 w-4 text-emerald-600" /> Proposer un livre à la bibliothèque
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => {
                  setPublishModalOpen(false);
                  navigate({ to: "/formations" });
                }}
              >
                <GraduationCap className="h-4 w-4 text-blue-600" /> Proposer une formation d'auteur
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => {
                  setPublishModalOpen(false);
                  navigate({ to: "/redaction" });
                }}
              >
                <FileText className="h-4 w-4 text-purple-600" /> Rédiger un nouveau document A4
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Boîte de dialogue : Divertissement */}
        <Dialog open={funModalOpen} onOpenChange={setFunModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Gamepad2 className="h-4 w-4 text-amber-500" /> Espace Détente & Culture
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-slate-600 leading-relaxed pt-2">
              L'espace détente BERSA propose des quiz académiques, des énigmes littéraires et des pauses de lecture pour stimuler votre esprit entre deux séances de rédaction.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGate>
  );
}
