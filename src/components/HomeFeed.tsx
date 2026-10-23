import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Menu,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Plus,
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
  Loader2,
  Copy,
  Coffee,
  ShieldAlert,
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
    authorAvatar?: string | undefined;
  isVerified?: boolean | undefined;
  content: string;
  title?: string | undefined;
  mediaUrl?: string | undefined;
  videoUrl?: string | undefined;
  domain?: string | undefined;
  tags?: string[] | undefined;
  linkTo?: string | undefined;
  linkLabel?: string | undefined;
  likes: number;
  comments: PostComment[];
  isLiked?: boolean | undefined;
  isSaved?: boolean | undefined;
  date: string;
  }

export function HomeFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profil utilisateur et photo réelle
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const userFirstName =
    (user?.user_metadata?.["first_name"] as string) ||
    (user?.email ? user.email.split("@")[0] : "Auteur");
  const userFullName =
    `${user?.user_metadata?.["first_name"] || ""} ${user?.user_metadata?.["last_name"] || ""}`.trim() ||
    user?.email?.split("@")[0] ||
    "Auteur BERSA";

  // États du fil et de la recherche instantanée
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Modale de publication
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [postType, setPostType] = useState<"text" | "photo" | "video">("text");
  const [newPostText, setNewPostText] = useState("");
  const [newPostMediaUrl, setNewPostMediaUrl] = useState("");
  const [newPostVideoUrl, setNewPostVideoUrl] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Chat IA Assistant
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

  // Modale Messages / Notifications
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgTab, setMsgTab] = useState<"network" | "chat" | "notifications">("chat");

  // Modale Divertissement & Pause
  const [funModalOpen, setFunModalOpen] = useState(false);
  const [funTab, setFunTab] = useState<"quote" | "quiz" | "breath">("quote");
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
  ];

  const quizQuestions = [
    {
      question: "Quelle norme bibliographique est principalement utilisée en sciences sociales ?",
      options: ["ISO 690", "APA 7e édition", "IEEE", "Vancouver"],
      correct: 1,
      explanation: "La norme APA est la référence en psychologie, éducation et sciences sociales.",
    },
  ];

  // Chargement des données réelles depuis le Backend
  useEffect(() => {
    async function loadData() {
      setLoadingPosts(true);

      // Charger l'avatar réel de l'utilisateur
      if (user) {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .maybeSingle();
          if (prof?.avatar_url) {
            setAvatarUrl(prof.avatar_url);
          }
        } catch (e) {
          console.error("Erreur avatar:", e);
        }
      }

      try {
        const loadedPosts: FeedPost[] = [];

        // 1. Publications communautaires partagées dans la BDD
        const { data: dbPosts } = await (supabase.from("community_posts" as any) as any)
          .select("id, author_name, author_subtitle, content, media_url, video_url, post_type, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(20);

        if (dbPosts && dbPosts.length > 0) {
          for (const dp of dbPosts) {
            let isLiked = false;
            let likesCount = 0;
            try {
              const { count } = await (supabase.from("community_post_likes" as any) as any)
                .select("*", { count: "exact", head: true })
                .eq("post_id", dp.id);
              likesCount = count || 0;

              if (user) {
                const { data: userLike } = await (supabase.from("community_post_likes" as any) as any)
                  .select("id")
                  .eq("post_id", dp.id)
                  .eq("user_id", user.id)
                  .maybeSingle();
                isLiked = !!userLike;
              }
            } catch {}

            const postComments: PostComment[] = [];
            try {
              const { data: comms } = await (supabase.from("community_post_comments" as any) as any)
                .select("id, user_name, content, created_at")
                .eq("post_id", dp.id)
                .order("created_at", { ascending: true })
                .limit(10);
              if (comms) {
                comms.forEach((c: any) => {
                  postComments.push({
                    id: c.id,
                    authorName: c.user_name || "Membre BERSA",
                    text: c.content,
                    time: new Date(c.created_at).toLocaleDateString("fr-FR"),
                  });
                });
              }
            } catch {}

            loadedPosts.push({
              id: dp.id,
              type: "user",
              authorName: dp.author_name || "Membre BERSA",
              authorSubtitle: dp.author_subtitle || "Communauté BERSA",
              isVerified: dp.author_name?.includes("Djoma"),
              content: dp.content,
              mediaUrl: dp.media_url || undefined,
              videoUrl: dp.video_url || undefined,
              likes: likesCount,
              comments: postComments,
              isLiked,
              date: new Date(dp.created_at).toLocaleDateString("fr-FR"),
            });
          }
        }

        // 2. Livres récents avec vraie couverture bien mesurée convenable à l'écran du téléphone ou ordinateur 
        const { data: books } = await supabase
          .from("books")
          .select("id, title, subtitle, author, summary, domain, cover_path, created_at")
          .order("created_at", { ascending: false })
          .limit(4);

        if (books && books.length > 0) {
          books.forEach((b) => {
            const coverUrl = b.cover_path
              ? supabase.storage.from("covers").getPublicUrl(b.cover_path).data?.publicUrl
              : undefined;

            loadedPosts.push({
              id: `book-${b.id}`,
              type: "book",
              authorName: b.author || "Auteur BERSA",
              authorSubtitle: `Bibliothèque • ${b.domain || "Ouvrage"}`,
              isVerified: true,
              title: b.title,
              content: b.summary || b.subtitle || "Consultez cet ouvrage dans la bibliothèque BERSA.",
              mediaUrl: coverUrl,
              linkTo: "/bibliotheque",
              linkLabel: "Lire l'ouvrage",
              likes: 12,
              comments: [],
              date: "Bibliothèque",
            });
          });
        }

         // 3. Formations avec véritable affiche
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title, description, domain, cover_path, created_at")
          .order("created_at", { ascending: false })
          .limit(4);

        if (courses && courses.length > 0) {
          courses.forEach((c) => {
            const coverUrl = c.cover_path
              ? supabase.storage.from("courses").getPublicUrl(c.cover_path).data?.publicUrl
              : undefined;

            loadedPosts.push({
              id: `course-${c.id}`,
              type: "course",
              authorName: "Formateur BERSA",
              authorSubtitle: `Formation certifiante • ${c.domain || "Académique"}`,
              isVerified: true,
              title: c.title,
              content: c.description || "Formation disponible sur la plateforme Berceau du Savoir.",
              mediaUrl: coverUrl,
              linkTo: "/formations",
              linkLabel: "Suivre la formation",
              likes: 18,
              comments: [],
              date: "Formation",
            });
          });
              }
        

        if (loadedPosts.length === 0) {
          loadedPosts.push({
            id: "post-welcome",
            type: "user",
            authorName: userFullName,
            authorSubtitle: "Berceau du Savoir • Membre actif",
            isVerified: true,
            title: "Bienvenue dans l'espace communautaire BERSA",
            content: "Partagez vos réflexions académiques, vos publications, vos formations et vos opportunités de recherche avec toute la communauté.",
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
          setPosts(loadedPosts);
      } catch (err) {
        console.error("Erreur de chargement des données :", err);
      } finally {
        setLoadingPosts(false);
      }
    }

    loadData();
  }, [user, userFullName]);

  // Gestion des mentions J'aime avec persistance en base de données
  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour aimer cette publication");
      return;
    }

    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;
    const willLike = !currentPost.isLiked;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: willLike, likes: willLike ? p.likes + 1 : Math.max(0, p.likes - 1) }
          : p
      )
    );

    if (!postId.startsWith("book-") && !postId.startsWith("course-") && !postId.startsWith("post-welcome")) {
      try {
        if (willLike) {
          await (supabase.from("community_post_likes" as any) as any).insert({
            post_id: postId,
            user_id: user.id,
          });
        } else {
          await (supabase.from("community_post_likes" as any) as any)
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
        }
      } catch (e) {
        console.error("Erreur like:", e);
      }
    }
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

  // Ajout d'un commentaire avec persistance BDD
  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    if (!user) {
      toast.error("Connectez-vous pour commenter");
      return;
    }

    const commentText = commentInput.trim();
    const newComment: PostComment = {
      id: `comm-${Date.now()}`,
      authorName: userFullName,
      text: commentText,
      time: "À l'instant",
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [newComment, ...p.comments] } : p
      )
    );
    setCommentInput("");

    if (!postId.startsWith("book-") && !postId.startsWith("course-") && !postId.startsWith("post-welcome")) {
      try {
        await (supabase.from("community_post_comments" as any) as any).insert({
          post_id: postId,
          user_id: user.id,
          user_name: userFullName,
          content: commentText,
        });
        toast.success("Commentaire publié");
      } catch (e: any) {
        toast.error("Erreur lors de l'envoi du commentaire : " + (e.message || "erreur"));
      }
    } else {
      toast.success("Commentaire publié");
    }
  };

  // Création d'une nouvelle publication style Facebook dans la BDD
  const handleCreateNewPost = async () => {
    if (!newPostText.trim()) {
      toast.error("Veuillez saisir un texte pour votre publication");
      return;
    }
    if (!user) {
      toast.error("Connectez-vous pour publier");
      return;
    }

    setIsSubmittingPost(true);
    try {
      const { data, error } = await (supabase.from("community_posts" as any) as any)
        .insert({
          user_id: user.id,
          author_name: userFullName,
          author_subtitle: "Berceau du Savoir • Membre actif",
          content: newPostText.trim(),
          media_url: newPostMediaUrl.trim() || null,
          video_url: newPostVideoUrl.trim() || null,
          post_type: postType,
        })
        .select()
        .single();

      if (error) throw error;

      const created: FeedPost = {
        id: (data as any)?.id || `post-${Date.now()}`,
        type: "user",
        authorName: userFullName,
        authorSubtitle: "Berceau du Savoir • Publication directe",
        isVerified: user?.email === "dieudonnedjoma@gmail.com",
        content: newPostText.trim(),
        mediaUrl: newPostMediaUrl.trim() || undefined,
        videoUrl: newPostVideoUrl.trim() || undefined,
        likes: 0,
        comments: [],
        date: "À l'instant",
      };

      setPosts((prev) => [created, ...prev]);
      setPublishModalOpen(false);
      setNewPostText("");
      setNewPostMediaUrl("");
      setNewPostVideoUrl("");
      toast.success("Votre publication est en ligne pour tous les membres !");
    } catch (err: any) {
      toast.error("Erreur lors de la publication : " + (err.message || ""));
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Envoi de message à l'Assistant IA
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
          content: "Désolé, je rencontre une difficulté de connexion. Veuillez réessayer ou utiliser l'Atelier de Rédaction.",
          time: "Erreur",
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const quickActions = [
    { label: "Reformuler", prompt: "Reformule de façon élégante et fluide ce texte :" },
    { label: "Plan", prompt: "Établis un plan détaillé et structuré en 5 parties sur ce sujet :" },
    { label: "Développer", prompt: "Développe avec des arguments rigoureux et scientifiques ce point :" },
    { label: "Humaniser", prompt: "Humanise et rends très naturel le style du texte suivant :" },
    { label: "Corriger", prompt: "Corrige l'orthographe, la syntaxe et la ponctuation de cet extrait :" },
    { label: "Sources", prompt: "Donne-moi des pistes de sources vérifiables pour ce sujet :" },
  ];

  const copyAiText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texte copié dans le presse-papier");
  };

  const sendToA4Editor = (text: string) => {
    localStorage.setItem("bersa-editor-import", text);
    toast.success("Texte transféré dans l'Éditeur A4");
    navigate({ to: "/redaction" });
  };

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
      <div className="min-h-screen bg-[#f3f5f9] text-slate-800 antialiased pb-28">
        {/* ============================================================ */}
        {/* 1. EN-TÊTE SUPÉRIEUR : LOGO, RECHERCHE DÉROULANTE ET MENU   */}
        {/* ============================================================ */}
        <header className="sticky top-0 z-40 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md border-b border-slate-100">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src={logo.url}
                alt="Logo BERSA"
                className="h-9 w-9 rounded-xl object-contain shadow-xs bg-white p-0.5 border border-slate-100"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-black tracking-tight text-[#0f172a]">
                  BERSA
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Berceau du Savoir
                </span>
              </div>
            </Link>

            {/* Barre de recherche déroulante instantanée */}
            <div className="relative flex-1 max-w-[170px] sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
                className="h-8 rounded-full border-slate-200 bg-slate-100/80 pl-8 pr-3 text-xs placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchFocus && (
                <div className="absolute left-0 top-10 z-50 w-[min(92vw,22rem)] max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {searchResults.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-slate-500">
                      {searchQuery.trim() ? "Aucun résultat." : "Tapez pour rechercher..."}
                    </p>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery("");
                          if (r.linkTo) navigate({ to: r.linkTo as any });
                        }}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-100"
                      >
                        <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-slate-900">
                            {r.title || r.authorName}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {r.authorSubtitle}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Vraie photo de profil & Menu 3 traits */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to="/profil"
                aria-label="Mon profil"
                className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-blue-50 text-blue-800 font-bold text-xs overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userFullName} className="h-full w-full object-cover" />
                ) : (
                  (userFirstName ?? "A").charAt(0).toUpperCase()
                )}
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
                      <Settings className="h-4 w-4 text-slate-500 shrink-0" /> Paramètres & Langues
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* 2. LES 8 FONCTIONNALITÉS EN 2 RANGÉES (SANS TEXTE DESSOUS)   */}
        {/* ============================================================ */}
        <section className="bg-white border-b border-slate-200/80 shadow-2xs px-3 py-2.5">
          <div className="mx-auto max-w-xl">
            <div className="grid grid-cols-4 gap-2">
              {/* Rangée 1 : Accueil, Rédaction, Formation, Bibliothèque */}
              <Link
                to="/"
                title="Accueil"
                aria-label="Accueil"
                className="h-11 flex items-center justify-center rounded-xl bg-blue-50/80 border border-blue-200/70 text-[#1d4ed8] active:scale-95 transition"
              >
                <Home className="h-5 w-5 fill-[#1d4ed8]" />
              </Link>

              <Link
                to="/redaction"
                title="Atelier de Rédaction Word A4"
                aria-label="Atelier de Rédaction Word A4"
                className="h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-[#1e40af] hover:bg-blue-50 active:scale-95 transition relative"
              >
                <FileText className="h-5 w-5 stroke-[1.9]" />
                <Sparkles className="absolute top-2 right-2.5 h-2.5 w-2.5 text-amber-500" />
              </Link>

              <Link
                to="/formations"
                title="Formations & Cours"
                aria-label="Formations & Cours"
                className="h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-[#1e40af] hover:bg-blue-50 active:scale-95 transition"
              >
                <GraduationCap className="h-5 w-5 stroke-[1.9]" />
              </Link>

              <Link
                to="/bibliotheque"
                title="Bibliothèque"
                aria-label="Bibliothèque"
                className="h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-[#1e40af] hover:bg-blue-50 active:scale-95 transition"
              >
                <BookOpen className="h-5 w-5 stroke-[1.9]" />
              </Link>

              {/* Rangée 2 : Opportunités, Publier (+), Messages, Notifications */}
              <Link
                to="/opportunites"
                title="Opportunités & Financements"
                aria-label="Opportunités & Financements"
                className="h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-[#1e40af] hover:bg-blue-50 active:scale-95 transition"
              >
                <Briefcase className="h-5 w-5 stroke-[1.9]" />
              </Link>

              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                title="Créer une publication"
                aria-label="Créer une publication"
                className="h-11 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
              >
                <Plus className="h-5 w-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => { setMsgTab("chat"); setMsgOpen(true); }}
                title="Messages et discussions"
                aria-label="Messages et discussions"
                className="h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-[#1e40af] hover:bg-blue-50 active:scale-95 transition"
              >
                <MessageSquare className="h-5 w-5 stroke-[1.9]" />
              </button>

              <button
                type="button"
                onClick={() => { setMsgTab("notifications"); setMsgOpen(true); }}
                title="Notifications"
                aria-label="Notifications"
                className="h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-[#1e40af] hover:bg-blue-50 active:scale-95 transition"
              >
                <Bell className="h-5 w-5 stroke-[1.9]" />
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. ASSISTANT AGRANDI AU CENTRE & ACCÈS DIRECT WORD A4         */}
        {/* ============================================================ */}
        <main className="mx-auto max-w-xl px-3 pt-3">
          {/* Boîte de publication style Facebook */}
          <div className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userFullName} className="h-full w-full object-cover" />
                ) : (
                  (userFirstName ?? "A").charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="flex-1 rounded-full bg-slate-100 px-3.5 py-2 text-left text-xs text-slate-500 hover:bg-slate-200/70 transition truncate"
              >
                Que souhaitez-vous partager, {userFirstName ?? ""} ?
              </button>
            </div>
          </div>

          {/* Liste des publications */}
          {loadingPosts ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Chargement des publications en direct...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Aucune publication trouvée.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredPosts.map((post) => {
                const isCommentsOpen = openCommentsPostId === post.id;
                return (
                  <article
                    key={post.id}
                    className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs"
                  >
                    {/* En-tête profil */}
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-xs border border-slate-200 shrink-0">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {post.authorName}
                            </span>
                            {post.isVerified && (
                              <CheckCircle2 className="h-3.5 w-3.5 fill-[#1d4ed8] text-white shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{post.authorSubtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{post.date}</span>
                    </div>

                    {/* Image couverture 16:9 sans débordement (style Facebook) */}
                    {post.mediaUrl && (
                      <div className="mb-2.5 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                        <img
                          src={post.mediaUrl}
                          alt={post.title || "Illustration"}
                          className="w-full max-h-72 object-cover aspect-video"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Titre et Texte avec 2 lignes max et bouton Voir plus */}
                      <div className="text-xs leading-relaxed text-slate-800">
                      {post.title && (
                        <h3 className="font-bold text-slate-900 mb-1 text-sm">{post.title}</h3>
                      )}
                      <p className={expanded[post.id] ? "" : "line-clamp-2"}>{post.content}</p>
                      {post.content && post.content.length > 120 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                          }
                          className="mt-1 text-[11px] font-semibold text-[#1d4ed8] hover:underline block"
                        >
                          {expanded[post.id] ? "Voir moins" : "Voir plus..."}
                        </button>
                      )}
                    </div>
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

                    {/* Commentaires */}
                    {isCommentsOpen && (
                      <div className="mt-3 border-t border-slate-100 pt-2.5 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Écrivez un commentaire..."
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
                    {/* ASSISTANT BERSA STYLE CHATGPT ÉTENDU EN BAS DU FIL */}
          <section className="mt-6 mb-8 rounded-3xl border-2 border-blue-600/30 bg-gradient-to-b from-blue-50/80 via-white to-slate-50 p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-[#1d4ed8] text-white flex items-center justify-center shadow-md shrink-0">
                  <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                    Assistant de Rédaction Académique
                  </h2>
                  <p className="text-[11px] text-blue-700 font-medium truncate">
                    IA Berceau du Savoir • Style ChatGPT Mobile
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/redaction" })}
                className="h-9 text-xs font-bold bg-[#1d4ed8] hover:bg-blue-800 text-white rounded-xl px-3 gap-1.5 shadow-sm shrink-0"
              >
                <FileText className="h-4 w-4" /> Atelier Word A4
              </Button>
            </div>

            {/* Suggestions rapides */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3">
              {quickActions.map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => handleSendChatMessage(act.prompt)}
                  className="shrink-0 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition shadow-2xs"
                >
                  {act.label}
                </button>
              ))}
            </div>

            {/* Zone de saisie large ChatGPT */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="text"
                placeholder="Posez une question, demandez un plan de mémoire, une analyse..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                className="h-12 text-xs sm:text-sm rounded-2xl border-slate-300 bg-white shadow-inner focus-visible:ring-blue-600"
              />
              <Button
                type="button"
                onClick={() => handleSendChatMessage()}
                className="h-12 w-12 shrink-0 rounded-2xl bg-[#1d4ed8] hover:bg-blue-700 text-white shadow-md flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </main>

        {/* ============================================================ */}
        {/* 4. MODALE MESSAGES / NOTIFICATIONS                            */}
        {/* ============================================================ */}
        <HomeMessagesModal
          key={msgTab + String(msgOpen)}
          open={msgOpen}
          onOpenChange={setMsgOpen}
          initialTab={msgTab}
        />

        {/* ============================================================ */}
        {/* 5. MODALE CHAT ASSISTANT ACADÉMIQUE                           */}
        {/* ============================================================ */}
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-4">
            <DialogHeader className="border-b border-slate-100 pb-2">
              <DialogTitle className="flex items-center justify-between text-base font-bold text-slate-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span>Assistant BERSA</span>
                </div>
                <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  En ligne
                </span>
              </DialogTitle>
            </DialogHeader>

            {/* Conversation */}
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
                        <FileText className="h-3 w-3" /> Insérer dans l'Atelier A4
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 w-fit">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  L'Assistant réfléchit et rédige...
                </div>
              )}
            </div>

            {/* Saisie */}
            <div className="border-t border-slate-100 pt-2 flex gap-2">
              <Input
                type="text"
                placeholder="Posez votre question académique..."
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
        {/* 6. MODALE DE PUBLICATION FACEBOOK-STYLE                       */}
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
                placeholder={`Partagez vos idées de recherche, une question ou une actualité, ${userFirstName}...`}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="text-xs"
              />

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

            {funTab === "quote" && academicQuotes[0] && (
              <div className="pt-4 text-center space-y-3">
                <blockquote className="italic text-sm text-slate-700">
                  "{academicQuotes[0].quote}"
                </blockquote>
                <p className="text-xs font-semibold text-primary">
                  — {academicQuotes[0].author}
                </p>
              </div>
            )}

            {funTab === "quiz" && quizQuestions[0] && (
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
                          : idx === quizQuestions[0]?.correct.
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
