import { useState, useEffect } from "react";
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
  Sparkles,
  Crown,
  ShieldCheck,
  User,
  Settings,
  Image as ImageIcon,
  Video,
  Loader2,
  Copy,
  RotateCcw,
  Coffee,
  Quote,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Bell,
} from "lucide-react";
import { HomeMessagesModal } from "@/components/HomeMessagesModal";
import logo from "@/assets/bersa-logo.png.asset.json";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { askAssistant } from "@/lib/assistant.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Types des publications réelles
interface PostComment {
  id: string;
  authorName: string;
  text: string;
  time: string;
}

interface FeedPost {
  id: string;
  type: "user" | "course" | "book" | "opportunity";
  authorName: string;
  authorSubtitle: string;
  authorAvatar?: string;
  isVerified?: boolean;
  content: string;
  title?: string;
  mediaUrl?: string;
  videoUrl?: string;
  domain?: string;
  tags?: string[];
  linkTo?: string;
  linkLabel?: string;
  likes: number;
  comments: PostComment[];
  isLiked?: boolean;
  isSaved?: boolean;
  date: string;
}

export function HomeFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profil réel connecté
  const userFirstName =
    (user?.user_metadata?.first_name as string) ||
    (user?.email ? user.email.split("@")[0] : "Auteur");
  const userFullName =
    `${user?.user_metadata?.first_name || ""} ${user?.user_metadata?.last_name || ""}`.trim() ||
    user?.email?.split("@")[0] ||
    "Auteur BERSA";

  // États du fil et de la recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");

  // Modale de publication (style Facebook)
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [postType, setPostType] = useState<"text" | "photo" | "video">("text");
  const [newPostText, setNewPostText] = useState("");
  const [newPostMediaUrl, setNewPostMediaUrl] = useState("");
  const [newPostVideoUrl, setNewPostVideoUrl] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Chat IA Assistant (style ChatGPT)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; time: string }>
  >([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis l’Assistant BERSA. Comment puis-je vous accompagner aujourd'hui dans vos recherches, votre rédaction académique ou vos cours ?",
      time: "Maintenant",
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgTab, setMsgTab] = useState<"network" | "chat" | "notifications">("chat");
  const [searchFocus, setSearchFocus] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Modale Divertissement
  const [funModalOpen, setFunModalOpen] = useState(false);
  const [funTab, setFunTab] = useState<"quote" | "quiz" | "breath">("quote");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  const academicQuotes = [
    {
      quote: "L'éducation est l'arme la plus puissante qu'on puisse utiliser pour changer le monde.",
      author: "Nelson Mandela",
    },
    {
      quote: "Le savoir est la seule matière qui s'accroît quand on la partage.",
      author: "Socrate",
    },
    {
      quote: "Écrire, c'est mettre de l'ordre dans ses pensées et donner une voix à son travail.",
      author: "Jean Guitton",
    },
    {
      quote: "La rigueur scientifique ne bride pas l'imagination, elle lui donne des ailes solides.",
      author: "Claude Bernard",
    },
  ];

  const quizQuestions = [
    {
      question: "Quelle norme bibliographique est principalement utilisée en sciences sociales ?",
      options: ["ISO 690", "APA 7e édition", "IEEE", "Vancouver"],
      correct: 1,
      explanation: "La norme APA (American Psychological Association) est la référence en psychologie, éducation et sciences sociales.",
    },
    {
      question: "En méthodologie de recherche, que désigne une 'revue systématique' ?",
      options: [
        "Un résumé rapide d'un article",
        "Une synthèse méthodique de toute la littérature sur une question précise",
        "Une interview de plusieurs chercheurs",
        "Une simple bibliographie de fin de page",
      ],
      correct: 1,
      explanation: "Elle suit un protocole rigoureux et reproductible pour recenser et évaluer toutes les études disponibles.",
    },
  ];

  // Chargement des données réelles depuis Supabase
  useEffect(() => {
    async function loadRealData() {
      setLoadingPosts(true);
      try {
        const initialPosts: FeedPost[] = [];

        // 1. Livres récents
        const { data: books } = await supabase
          .from("books")
          .select("id, title, subtitle, author, summary, domain, price_usd, currency, created_at")
          .order("created_at", { ascending: false })
          .limit(3);

        if (books && books.length > 0) {
          books.forEach((b) => {
            initialPosts.push({
              id: `book-${b.id}`,
              type: "book",
              authorName: b.author || "Auteur BERSA",
              authorSubtitle: `Bibliothèque • ${b.domain || "Ouvrage"}`,
              isVerified: true,
              title: b.title,
              content: b.summary || b.subtitle || "Consultez cet ouvrage dans la bibliothèque BERSA.",
              domain: b.domain,
              tags: ["#Bibliothèque", "#Recherche", `#${b.domain?.replace(/\s+/g, "") || "Livre"}`],
              linkTo: "/bibliotheque",
              linkLabel: "Consulter l'ouvrage",
              likes: 12,
              comments: [],
              date: "Bibliothèque",
            });
          });
        }

        // 2. Formations récentes
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title, description, domain, price, currency, created_at")
          .order("created_at", { ascending: false })
          .limit(3);

        if (courses && courses.length > 0) {
          courses.forEach((c) => {
            initialPosts.push({
              id: `course-${c.id}`,
              type: "course",
              authorName: "Direction Pédagogique BERSA",
              authorSubtitle: `Formation certifiante • ${c.domain || "Académie"}`,
              isVerified: true,
              title: c.title,
              content: c.description || "Formation ouverte aux inscriptions avec délivrance d'attestation.",
              domain: c.domain,
              tags: ["#Formation", "#Certificat", `#${c.domain?.replace(/\s+/g, "") || "Apprentissage"}`],
              linkTo: "/formations",
              linkLabel: "Rejoindre la formation",
              likes: 24,
              comments: [],
              date: "Formation",
            });
          });
        }

        // 3. Opportunités récentes
        const { data: opps } = await supabase
          .from("opportunities")
          .select("id, title, organisation, description, domain, kind, deadline, created_at")
          .order("created_at", { ascending: false })
          .limit(3);

        if (opps && opps.length > 0) {
          opps.forEach((o) => {
            initialPosts.push({
              id: `opp-${o.id}`,
              type: "opportunity",
              authorName: o.organisation || "BERSA Opportunités",
              authorSubtitle: `Appel à candidatures • ${o.kind || "Bourse"}`,
              isVerified: true,
              title: o.title,
              content: o.description || "Nouvelle opportunité de recherche et de financement disponible.",
              domain: o.domain,
              tags: ["#Opportunité", "#Financement", "#Candidature"],
              linkTo: "/opportunites",
              linkLabel: "Postuler",
              likes: 19,
              comments: [],
              date: o.deadline ? `Clôture : ${o.deadline}` : "Ouvert",
            });
          });
        }

        // Publication d'accueil par défaut si la base est encore vierge
        if (initialPosts.length === 0) {
          initialPosts.push({
            id: "post-welcome",
            type: "user",
            authorName: userFullName,
            authorSubtitle: "Berceau du Savoir • Membre actif",
            isVerified: true,
            title: "Bienvenue dans l'espace communautaire BERSA",
            content:
              "Partagez vos réflexions académiques, vos publications, vos formations et vos opportunités de recherche avec toute la communauté.",
            tags: ["#Rédaction", "#Savoir", "#Excellence"],
            linkTo: "/redaction",
            linkLabel: "Ouvrir l'Atelier A4",
            likes: 45,
            comments: [
              {
                id: "c-1",
                authorName: "Dieudonné Djoma",
                text: "Bienvenue à tous les chercheurs et étudiants sur le Berceau du Savoir !",
                time: "Aujourd'hui",
              },
            ],
            date: "Aujourd'hui",
          });
        }

        // Récupérer les publications sauvegardées localement
        const savedCustomPosts = localStorage.getItem("bersa_community_posts");
        if (savedCustomPosts) {
          try {
            const parsed = JSON.parse(savedCustomPosts);
            setPosts([...parsed, ...initialPosts]);
          } catch {
            setPosts(initialPosts);
          }
        } else {
          setPosts(initialPosts);
        }
      } catch (err) {
        console.error("Erreur de chargement des publications :", err);
      } finally {
        setLoadingPosts(false);
      }
    }

    loadRealData();
  }, [userFullName]);

  // Actions sur les publications
  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );
  };

  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isSaved = !p.isSaved;
          toast.success(
            isSaved ? "Publication enregistrée dans vos favoris" : "Retirée de vos favoris"
          );
          return { ...p, isSaved };
        }
        return p;
      })
    );
  };

  const handleSharePost = (post: FeedPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title || post.authorName,
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${post.title ? post.title + " : " : ""}${window.location.href}`);
      toast.success("Lien copié dans le presse-papier");
    }
  };

  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;
    const newComment: PostComment = {
      id: `comm-${Date.now()}`,
      authorName: userFullName,
      text: commentInput.trim(),
      time: "À l'instant",
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, comments: [newComment, ...p.comments] };
        }
        return p;
      })
    );
    setCommentInput("");
    toast.success("Commentaire publié");
  };

  // Création d'une nouvelle publication style Facebook
  const handleCreateNewPost = () => {
    if (!newPostText.trim()) {
      toast.error("Veuillez saisir un texte pour votre publication");
      return;
    }

    setIsSubmittingPost(true);
    const created: FeedPost = {
      id: `post-${Date.now()}`,
      type: "user",
      authorName: userFullName,
      authorSubtitle: "Berceau du Savoir • Publication directe",
      isVerified: user?.email === "dieudonnedjoma@gmail.com",
      content: newPostText.trim(),
      mediaUrl: newPostMediaUrl.trim() || undefined,
      videoUrl: newPostVideoUrl.trim() || undefined,
      tags: ["#Communauté", "#BERSA"],
      likes: 1,
      isLiked: true,
      comments: [],
      date: "À l'instant",
    };

    const updated = [created, ...posts];
    setPosts(updated);

    // Persistance locale
    const localOnly = updated.filter((p) => p.id.startsWith("post-"));
    localStorage.setItem("bersa_community_posts", JSON.stringify(localOnly));

    setIsSubmittingPost(false);
    setPublishModalOpen(false);
    setNewPostText("");
    setNewPostMediaUrl("");
    setNewPostVideoUrl("");
    toast.success("Votre publication est en ligne !");
  };

  // Envoi d'un message dans le Chat IA façon ChatGPT
  const handleSendChatMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    const userMsg = {
      role: "user" as const,
      content: query,
      time: "Maintenant",
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setChatOpen(true);
    setIsAiThinking(true);

    try {
      const response = await askAssistant({
        data: {
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          time: "À l'instant",
        },
      ]);
    } catch (err: any) {
      toast.error("Impossible de joindre l'Assistant BERSA pour le moment.");
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, je rencontre une difficulté de connexion. Veuillez réessayer ou utiliser l'atelier de Rédaction.",
          time: "Erreur",
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Puces d'actions rapides façon ChatGPT
  const quickActions = [
    { label: "Reformuler", prompt: "Reformule de façon élégante et fluide ce texte :" },
    { label: "Plan", prompt: "Établis un plan détaillé et structuré en 5 parties sur ce sujet :" },
    { label: "Développer", prompt: "Développe avec des arguments rigoureux et scientifiques ce point :" },
    { label: "Humaniser", prompt: "Humanise et rends très naturel le style du texte suivant :" },
    { label: "Corriger", prompt: "Corrige l'orthographe, la syntaxe et la ponctuation de cet extrait :" },
    { label: "Traduire", prompt: "Traduis fidèlement ce texte dans une langue académique impeccable :" },
    { label: "Continuer", prompt: "Poursuis la rédaction logique de ce texte sans répéter le début :" },
    { label: "Sources", prompt: "Donne-moi des pistes de sources vérifiables et références pour approfondir ce sujet :" },
  ];

  // Copier le texte généré par l'IA
  const copyAiText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texte copié dans le presse-papier");
  };

  // Transférer directement la réponse dans l'Éditeur A4
  const sendToA4Editor = (text: string) => {
    localStorage.setItem("bersa-editor-import", text);
    toast.success("Texte transféré dans l'Éditeur A4");
    navigate({ to: "/redaction" });
  };

  // Filtrage des publications
  const filteredPosts = posts;
  const searchResults = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.authorName.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.domain && p.domain.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#f3f5f9] text-slate-800 antialiased pb-32">
        {/* ============================================================ */}
        {/* 1. EN-TÊTE SUPÉRIEUR EXACT AVEC LE VRAI LOGO BERSA            */}
        {/* ============================================================ */}
        <header className="sticky top-0 z-40 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md border-b border-slate-100">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
            {/* Logo BERSA officiel fidèle */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src={logo.url}
                alt="Logo BERSA"
                className="h-9 w-9 rounded-xl object-contain shadow-xs bg-white p-0.5 border border-slate-100"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg sm:text-xl font-black tracking-tight text-[#0f172a]">
                  BERSA
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Berceau du Savoir
                </span>
              </div>
            </Link>

            {/* Barre de recherche arrondie */}
            <div className="relative flex-1 max-w-[170px] sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Recherche formations, livres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
                className="h-8 rounded-full border-slate-200 bg-slate-100/80 pl-8 pr-3 text-xs placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchFocus && (
                <div className="absolute left-0 top-10 z-50 w-[min(92vw,22rem)] max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {searchResults.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-slate-500">{searchQuery.trim() ? "Aucun résultat." : "Tapez pour rechercher formations, livres, opportunités…"}</p>
                  ) : (
                    searchResults.map((r) => (
                      <button key={r.id} type="button" onMouseDown={() => { setSearchQuery(""); if (r.linkTo) navigate({ to: r.linkTo as any }); }} className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-100">
                        <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-slate-900">{r.title || r.authorName}</span>
                          <span className="block truncate text-[11px] text-slate-500">{r.authorSubtitle}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profil utilisateur & Menu à trois traits (Ancien tableau de bord complet) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to="/profil"
                aria-label="Mon profil"
                className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-blue-50 text-blue-800 font-bold text-xs"
              >
                {userFirstName.charAt(0).toUpperCase()}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-700 hover:bg-slate-100"
                    aria-label="Tableau de bord et navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-xl">
                  <DropdownMenuLabel className="text-xs font-bold text-primary px-2 py-1">
                    Tableau de bord BERSA
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <Home className="h-4 w-4 text-blue-600 shrink-0" /> Accueil & Fil d'actualité
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/redaction" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <FileText className="h-4 w-4 text-indigo-600 shrink-0" /> Atelier de Rédaction A4
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/anti-plagiat" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" /> Détecteur Anti-plagiat
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/formations" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0" /> Formations & Cours
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/bibliotheque" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <BookOpen className="h-4 w-4 text-teal-600 shrink-0" /> Bibliothèque intelligente
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/opportunites" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <Briefcase className="h-4 w-4 text-rose-600 shrink-0" /> Opportunités & Financements
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setFunModalOpen(true)}
                    className="cursor-pointer gap-2.5 py-2 text-xs"
                  >
                    <Gamepad2 className="h-4 w-4 text-purple-600 shrink-0" /> Divertissement & Pause
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/documents" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <FileText className="h-4 w-4 text-cyan-600 shrink-0" /> Mes Documents enregistrés
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/abonnements" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" /> Formules d'Abonnement
                    </Link>
                  </DropdownMenuItem>

                  {user?.email === "dieudonnedjoma@gmail.com" && (
                    <DropdownMenuItem asChild>
                      <Link to="/gestion" className="cursor-pointer gap-2.5 py-2 text-xs font-semibold text-purple-700">
                        <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" /> Administration BERSA
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profil" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <User className="h-4 w-4 text-slate-500 shrink-0" /> Mon Profil complet
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/parametres" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <Settings className="h-4 w-4 text-slate-500 shrink-0" /> Paramètres & 25 Langues
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* 2. RUBAN HORIZONTAL : ACCUEIL, RÉDACTION, FORMATION, ETC.     */}
        {/* ============================================================ */}
        <nav className="bg-white border-b border-slate-100 shadow-2xs px-2 py-2.5">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            <Link
              to="/"
              className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1d4ed8] transition"
            >
              <Home className="h-5 w-5 fill-[#1d4ed8]" />
              <span className="text-[10px] font-semibold">Accueil</span>
            </Link>

            <Link
              to="/redaction"
              className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <div className="relative">
                <FileText className="h-5 w-5 stroke-[1.8]" />
                <Sparkles className="absolute -top-1 -right-1.5 h-2.5 w-2.5 text-amber-500" />
              </div>
              <span className="text-[10px] font-medium text-slate-600">Rédaction</span>
            </Link>

            <Link
              to="/formations"
              className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <GraduationCap className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Formation</span>
            </Link>

            <Link
              to="/bibliotheque"
              className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <BookOpen className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Bibliothèque</span>
            </Link>

            <Link
              to="/opportunites"
              className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <Briefcase className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Opportunités</span>
            </Link>

            <button
              type="button"
              onClick={() => setPublishModalOpen(true)}
              className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1e40af] hover:text-[#1d4ed8] transition"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-[1.8px] border-[#1e40af]">
                <Plus className="h-3.5 w-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-medium text-slate-600">Publier</span>
            </button>

            <button type="button" onClick={() => { setMsgTab("chat"); setMsgOpen(true); }} className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1e40af] hover:text-[#1d4ed8] transition">
              <MessageSquare className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Messages</span>
            </button>
            <button type="button" onClick={() => { setMsgTab("notifications"); setMsgOpen(true); }} className="flex flex-col items-center gap-1 min-w-[56px] shrink-0 px-0.5 text-[#1e40af] hover:text-[#1d4ed8] transition">
              <Bell className="h-5 w-5 stroke-[1.8]" />
              <span className="text-[10px] font-medium text-slate-600">Notifications</span>
            </button>

          </div>
        </nav>

        {/* ============================================================ */}
        {/* 3. SECTION CENTRALE : CRÉATION DE POST + FLUX RÉEL           */}
        {/* ============================================================ */}
        <main className="mx-auto max-w-xl px-3 pt-3">
          {/* Boîte de création de statut style Facebook */}
          <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs shrink-0">
                {userFirstName.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="flex-1 rounded-full bg-slate-100 px-3.5 py-2 text-left text-xs text-slate-500 hover:bg-slate-200/70 transition"
              >
                Que souhaitez-vous partager, {userFirstName} ?
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-around border-t border-slate-100 pt-2 text-[11px] text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setPostType("photo");
                  setPublishModalOpen(true);
                }}
                className="flex items-center gap-1 hover:text-blue-600 font-medium"
              >
                <ImageIcon className="h-4 w-4 text-emerald-600" /> Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  setPostType("video");
                  setPublishModalOpen(true);
                }}
                className="flex items-center gap-1 hover:text-blue-600 font-medium"
              >
                <Video className="h-4 w-4 text-rose-600" /> Vidéo
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/formations" })}
                className="flex items-center gap-1 hover:text-blue-600 font-medium"
              >
                <GraduationCap className="h-4 w-4 text-blue-600" /> Formation
              </button>
            </div>
          </div>


          {/* Liste des cartes du flux */}
          {loadingPosts ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Chargement des publications en direct…
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Aucune publication trouvée pour votre recherche.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredPosts.map((post) => {
                const isCommentsOpen = openCommentsPostId === post.id;
                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:shadow-md"
                  >
                    {/* En-tête profil réel */}
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-sm border border-slate-200 shrink-0">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900">
                              {post.authorName}
                            </span>
                            {post.isVerified && (
                              <CheckCircle2 className="h-3.5 w-3.5 fill-[#1d4ed8] text-white" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{post.authorSubtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{post.date}</span>
                    </div>

                    {/* Média image ou vidéo */}
                    {post.mediaUrl && (
                      <div className="mb-2.5 overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={post.mediaUrl}
                          alt="Illustration"
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </div>
                    )}
                    {post.videoUrl && (
                      <div className="mb-2.5 overflow-hidden rounded-xl bg-black p-2 text-center">
                        <a
                          href={post.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 underline"
                        >
                          Regarder la vidéo : {post.videoUrl}
                        </a>
                      </div>
                    )}

                    {/* Corps du texte */}
                    <div className="text-xs leading-relaxed text-slate-700">
                      {post.title && (
                        <p className="font-semibold text-slate-900 pb-1">{post.title}</p>
                      )}
                      <p className={`whitespace-pre-line ${expanded[post.id] ? "" : "line-clamp-2"}`}>{post.content}</p>
                      {post.content.length > 120 && (
                        <button type="button" onClick={() => setExpanded((x) => ({ ...x, [post.id]: !x[post.id] }))} className="mt-0.5 text-[11px] font-semibold text-slate-500 hover:underline">
                          {expanded[post.id] ? "Voir moins" : "Voir plus"}
                        </button>
                      )}
                      {post.tags && (
                        <p className="mt-1.5 font-semibold text-[#1d4ed8]">
                          {post.tags.join(" ")}
                        </p>
                      )}
                    </div>

                    {/* Bouton d'action directe vers le service */}
                    {post.linkTo && (
                      <div className="mt-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: post.linkTo as any })}
                          className="h-7 text-[11px] gap-1 text-primary border-primary/30 hover:bg-primary/5"
                        >
                          {post.linkLabel || "Voir les détails"} <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Barre d'interactions Facebook */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition font-medium ${
                          post.isLiked ? "text-red-600" : "hover:text-red-600"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            post.isLiked ? "fill-red-500 text-red-500" : "text-slate-500"
                          }`}
                        />
                        <span>Aimer {post.likes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentsPostId(isCommentsOpen ? null : post.id)
                        }
                        className="flex items-center gap-1.5 hover:text-[#1d4ed8] transition font-medium"
                      >
                        <MessageCircle className="h-4 w-4 text-slate-500" />
                        <span>Commenter {post.comments.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSharePost(post)}
                        className="flex items-center gap-1.5 hover:text-[#1d4ed8] transition font-medium"
                      >
                        <Share2 className="h-4 w-4 text-slate-500" />
                        <span>Partager</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        className={`flex items-center gap-1.5 transition font-medium ${
                          post.isSaved ? "text-amber-600" : "hover:text-amber-600"
                        }`}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${
                            post.isSaved ? "fill-amber-500 text-amber-500" : "text-slate-500"
                          }`}
                        />
                        <span>Enregistrer</span>
                      </button>
                    </div>

                    {/* Section des commentaires dépliée */}
                    {isCommentsOpen && (
                      <div className="mt-3 border-t border-slate-100 pt-2.5 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Écrivez un commentaire…"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(post.id);
                            }}
                            className="h-8 text-xs bg-slate-50 rounded-full"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            className="h-8 rounded-full px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>

                        {post.comments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {post.comments.map((comm) => (
                              <div
                                key={comm.id}
                                className="rounded-xl bg-slate-50 p-2 text-xs text-slate-700"
                              >
                                <span className="font-semibold text-slate-900 block">
                                  {comm.authorName}
                                </span>
                                <p>{comm.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* ============================================================ */}
        {/* 4. CAPSULE FLOTTANTE ASSISTANT IA (FAÇON CHATGPT)             */}
        {/* ============================================================ */}
        <div className="fixed inset-x-0 bottom-3 z-40 px-3 pointer-events-none">
          <div className="mx-auto max-w-md pointer-events-auto">
            <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-2xl backdrop-blur-lg">
              {/* Barre de saisie rapide de prompt */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPublishModalOpen(true)}
                  className="h-9 w-9 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Publier"
                >
                  <Plus className="h-5 w-5" />
                </Button>

                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendChatMessage();
                    }}
                    placeholder="Posez votre question à l’Assistant…"
                    className="h-9 rounded-xl border-slate-200 bg-slate-50 px-3 text-xs placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toast.info("Micro prêt : dictez votre question")}
                  className="h-9 w-9 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Dictée vocale"
                >
                  <Mic className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSendChatMessage()}
                  className="h-9 w-9 shrink-0 rounded-full bg-[#1d4ed8] p-0 text-white shadow-md hover:bg-blue-700 transition flex items-center justify-center"
                  aria-label="Envoyer"
                >
                  <AudioWaveform className="h-4 w-4 animate-pulse" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. MODALE CHATGPT INTERACTIF (NOUVEAU CHAT BERSA IA)          */}
        {/* ============================================================ */}
        <HomeMessagesModal key={msgTab + String(msgOpen)} open={msgOpen} onOpenChange={setMsgOpen} initialTab={msgTab} />

        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-4">
            <DialogHeader className="border-b border-slate-100 pb-2">
              <DialogTitle className="flex items-center justify-between text-base font-bold text-slate-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span>Assistant</span>
                </div>
                <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  En ligne
                </span>
              </DialogTitle>
            </DialogHeader>

            {/* Puces d'action rapides façon ChatGPT */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {quickActions.map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => handleSendChatMessage(act.prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  {act.label}
                </button>
              ))}
            </div>

            {/* Corps de conversation */}
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-[220px]">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>

                  {/* Actions sous la réponse de l'IA */}
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 pl-1">
                      <button
                        type="button"
                        onClick={() => copyAiText(msg.content)}
                        className="hover:text-blue-600 flex items-center gap-0.5"
                      >
                        <Copy className="h-3 w-3" /> Copier
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => sendToA4Editor(msg.content)}
                        className="hover:text-emerald-600 flex items-center gap-0.5 font-medium"
                      >
                        <FileText className="h-3 w-3" /> Insérer dans l'Éditeur A4
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 w-fit">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  L’Assistant réfléchit et rédige…
                </div>
              )}
            </div>

            {/* Saisie dans le chat */}
            <div className="border-t border-slate-100 pt-2 flex gap-2">
              <Input
                type="text"
                placeholder="Posez votre question ou consigne académique…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChatMessage();
                }}
                className="h-9 text-xs rounded-xl"
              />
              <Button
                type="button"
                onClick={() => handleSendChatMessage()}
                disabled={isAiThinking}
                className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============================================================ */}
        {/* 6. MODALE DE PUBLICATION (STYLE FACEBOOK)                     */}
        {/* ============================================================ */}
        <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Plus className="h-4 w-4 text-primary" /> Créer une publication
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <Textarea
                rows={4}
                placeholder={`Partagez vos idées de recherche, une question ou une actualité, ${userFirstName}…`}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="text-xs"
              />

              {/* Champ photo ou lien vidéo */}
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="Lien d'une image (optionnel)"
                  value={newPostMediaUrl}
                  onChange={(e) => setNewPostMediaUrl(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  type="url"
                  placeholder="Lien d'une vidéo YouTube ou MP4 (optionnel)"
                  value={newPostVideoUrl}
                  onChange={(e) => setNewPostVideoUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Raccourcis vers publication de cours ou livres */}
              <div className="border-t border-slate-100 pt-2">
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                  Publier dans les services officiels :
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] justify-start gap-1.5"
                    onClick={() => {
                      setPublishModalOpen(false);
                      navigate({ to: "/bibliotheque" });
                    }}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-emerald-600" /> Livre
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] justify-start gap-1.5"
                    onClick={() => {
                      setPublishModalOpen(false);
                      navigate({ to: "/formations" });
                    }}
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-blue-600" /> Formation
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={handleCreateNewPost}
                disabled={isSubmittingPost}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-semibold"
              >
                {isSubmittingPost ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Publier maintenant"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============================================================ */}
        {/* 7. MODALE DIVERTISSEMENT & DÉTENTE INTELLECTUELLE             */}
        {/* ============================================================ */}
        <Dialog open={funModalOpen} onOpenChange={setFunModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Gamepad2 className="h-5 w-5 text-amber-500" /> Espace Détente & Culture
              </DialogTitle>
            </DialogHeader>

            {/* Onglets de pause */}
            <div className="flex border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setFunTab("quote")}
                className={`flex-1 py-2 font-medium border-b-2 ${
                  funTab === "quote"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Citation
              </button>
              <button
                type="button"
                onClick={() => setFunTab("quiz")}
                className={`flex-1 py-2 font-medium border-b-2 ${
                  funTab === "quiz"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Quiz Savoir
              </button>
              <button
                type="button"
                onClick={() => setFunTab("breath")}
                className={`flex-1 py-2 font-medium border-b-2 ${
                  funTab === "breath"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Pause Respiration
              </button>
            </div>

            {/* Contenu onglet Citation */}
            {funTab === "quote" && (
              <div className="pt-3 text-center space-y-3">
                <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-4">
                  <Quote className="h-6 w-6 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="font-serif italic text-sm text-slate-800 leading-relaxed">
                    « {academicQuotes[quoteIndex].quote} »
                  </p>
                  <p className="mt-2 text-xs font-bold text-amber-900">
                    — {academicQuotes[quoteIndex].author}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setQuoteIndex((prev) => (prev + 1) % academicQuotes.length)
                  }
                  className="h-8 text-xs gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Nouvelle citation
                </Button>
              </div>
            )}

            {/* Contenu onglet Quiz */}
            {funTab === "quiz" && (
              <div className="pt-3 space-y-3">
                <p className="text-xs font-semibold text-slate-900">
                  {quizQuestions[0].question}
                </p>
                <div className="space-y-1.5">
                  {quizQuestions[0].options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuizAnswered(idx)}
                      className={`w-full rounded-lg border p-2.5 text-left text-xs transition ${
                        quizAnswered === null
                          ? "border-slate-200 bg-white hover:bg-slate-50"
                          : idx === quizQuestions[0].correct
                          ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-900"
                          : quizAnswered === idx
                          ? "border-rose-400 bg-rose-50 text-rose-800"
                          : "border-slate-200 opacity-60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {quizAnswered !== null && (
                  <p className="text-[11px] text-slate-600 bg-slate-100 p-2 rounded-lg">
                    {quizQuestions[0].explanation}
                  </p>
                )}
              </div>
            )}

            {/* Contenu onglet Pause Respiration */}
            {funTab === "breath" && (
              <div className="pt-4 text-center space-y-3 pb-2">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 border-4 border-blue-200 animate-pulse">
                  <Coffee className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Inspirez 4 secondes… Bloquez 4 secondes… Expirez 4 secondes.
                </p>
                <p className="text-[11px] text-slate-500">
                  Une pause de 60 secondes permet d'éclaircir la pensée et de fluidifier l'écriture.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGate>
  );
}
