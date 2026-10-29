import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search, Menu, Heart, MessageCircle, Share2, Bookmark, Plus,
  CheckCircle2, Home, GraduationCap, BookOpen, Briefcase, FileText,
  Gamepad2, Send, Sparkles, Crown, ShieldCheck, User, Settings,
  Loader2, Copy, ShieldAlert, MessageSquare, Bell, ArrowRight,
  PenTool, Award, Check
} from "lucide-react";
import { HomeMessagesModal } from "@/components/HomeMessagesModal";
import { HomeEditor } from "@/components/HomeEditor";
import logo from "@/assets/bersa-logo.png.asset.json";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { askAssistant } from "@/lib/assistant.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface PostComment {
  id: string;
  authorName: string;
  text: string;
  time: string;
}

interface FeedPost {
  id: string;
  type: "book" | "course" | "opportunity" | "user" | "welcome";
  authorName: string;
  authorSubtitle: string;
  isVerified?: boolean | undefined;
  title?: string | undefined;
  domain?: string | undefined;
  price?: string | undefined;
  content: string;
  mediaUrl?: string | undefined;
  videoUrl?: string | undefined;
  likes: number;
  isLiked?: boolean | undefined;
  comments: PostComment[];
  isSaved?: boolean | undefined;
  date: string;
  linkTo?: string | undefined;
}

export function HomeFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgTab, setMsgTab] = useState<"chat" | "notifications">("chat");

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [postType, setPostType] = useState<"discussion" | "fun">("discussion");
  const [newPostText, setNewPostText] = useState("");
  const [newPostMediaUrl, setNewPostMediaUrl] = useState("");
  const [newPostVideoUrl, setNewPostVideoUrl] = useState("");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; time: string }>
  >([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis l’Assistant BERSA. Comment puis-je vous accompagner aujourd'hui dans vos recherches, votre rédaction académique ou la mise en forme de votre document ?",
      time: "Maintenant",
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const [funModalOpen, setFunModalOpen] = useState(false);
  const [funScore, setFunScore] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);

  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const userMeta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const userFirstName = userMeta["first_name"] || user?.email?.split("@")[0] || "Auteur";
  const userFullName =
    `${userMeta["first_name"] || ""} ${userMeta["last_name"] || ""}`.trim() ||
    user?.email?.split("@")[0] ||
    "Auteur BERSA";
  const avatarUrl = userMeta["avatar_url"] || userMeta["picture"];

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoadingPosts(true);
        const [booksRes, coursesRes, oppsRes, postsRes, likesRes, commentsRes] =
          await Promise.all([
            supabase.from("books").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(6),
            supabase.from("courses").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(6),
            supabase.from("opportunities").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(6),
            (supabase.from("community_posts" as any) as any).select("*").order("created_at", { ascending: false }).limit(20),
            user ? (supabase.from("community_post_likes" as any) as any).select("post_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
            (supabase.from("community_post_comments" as any) as any).select("*").order("created_at", { ascending: true }),
          ]);

        const userLikesSet = new Set((likesRes?.data || []).map((l: any) => l.post_id));
        const commentsByPost: Record<string, PostComment[]> = {};
        (commentsRes?.data || []).forEach((c: any) => {
          if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
          commentsByPost[c.post_id]?.push({
            id: c.id,
            authorName: c.user_name || "Membre BERSA",
            text: c.content,
            time: "Récemment",
          });
        });

        const list: FeedPost[] = [];
        list.push({
          id: "post-welcome",
          type: "welcome",
          authorName: "Direction Générale BERSA",
          authorSubtitle: "Berceau du Savoir • Officiel",
          isVerified: true,
          title: "Bienvenue dans le Studio de Rédaction BERSA",
          content:
            "Transformez vos idées en résultats académiques et scientifiques d'excellence. Utilisez notre atelier de rédaction et rédigez des documents parfaits avec notre Assistant.",
          likes: 42,
          isLiked: userLikesSet.has("post-welcome"),
          comments: commentsByPost["post-welcome"] || [],
          date: "Annonce officielle",
          linkTo: "/redaction",
        });

        (postsRes?.data || []).forEach((p: any) => {
          list.push({
            id: p.id,
            type: "user",
            authorName: p.author_name || "Auteur BERSA",
            authorSubtitle: p.author_subtitle || "Membre chercheur",
            isVerified: p.author_subtitle?.includes("Officiel"),
            content: p.content,
            mediaUrl: p.media_url || undefined,
            videoUrl: p.video_url || undefined,
            likes: p.likes_count || 0,
            isLiked: userLikesSet.has(p.id),
            comments: commentsByPost[p.id] || [],
            date: "Récemment",
          });
        });

        (booksRes.data || []).forEach((b: any) => {
          list.push({
            id: `book-${b.id}`,
            type: "book",
            authorName: b.author || "Auteur BERSA",
            authorSubtitle: "Bibliothèque Scientifique",
            isVerified: true,
            title: b.title,
            domain: b.domain,
            price: `${b.price} ${b.currency}`,
            content: b.summary || "Ouvrage disponible dans la Bibliothèque BERSA.",
            mediaUrl: b.cover_path || undefined,
            likes: 12,
            isLiked: userLikesSet.has(`book-${b.id}`),
            comments: commentsByPost[`book-${b.id}`] || [],
            date: "Publication d'ouvrage",
            linkTo: "/bibliotheque",
          });
        });

        (coursesRes.data || []).forEach((c: any) => {
          list.push({
            id: `course-${c.id}`,
            type: "course",
            authorName: "Formations BERSA",
            authorSubtitle: c.domain || "Programme certifiant",
            isVerified: true,
            title: c.title,
            domain: c.domain,
            price: c.price === 0 ? "Gratuit" : `${c.price} ${c.currency}`,
            content: c.description || "Formation certifiante disponible sur BERSA.",
            mediaUrl: c.cover_path || undefined,
            likes: 19,
            isLiked: userLikesSet.has(`course-${c.id}`),
            comments: commentsByPost[`course-${c.id}`] || [],
            date: "Nouvelle formation",
            linkTo: "/formations",
          });
        });

        (oppsRes.data || []).forEach((o: any) => {
          list.push({
            id: `opp-${o.id}`,
            type: "opportunity",
            authorName: o.organization || "Pôle Opportunités",
            authorSubtitle: o.country || "Financement & Bourse",
            isVerified: true,
            title: o.title,
            content: o.description || "Nouvelle opportunité sélectionnée par BERSA.",
            likes: 8,
            isLiked: userLikesSet.has(`opp-${o.id}`),
            comments: commentsByPost[`opp-${o.id}`] || [],
            date: "Opportunité académique",
            linkTo: "/opportunites",
          });
        });

        setPosts(list);
      } catch (e) {
        console.error("Erreur de chargement du fil :", e);
      } finally {
        setLoadingPosts(false);
      }
    }
    void loadFeed();
  }, [user]);                                         
  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour aimer cette publication");
      return;
    }
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
    if (!postId.startsWith("book-") && !postId.startsWith("course-") && !postId.startsWith("opp-") && !postId.startsWith("post-welcome")) {
      try {
        const post = posts.find((p) => p.id === postId);
        const willLike = !post?.isLiked;
        if (willLike) {
          await (supabase.from("community_post_likes" as any) as any).insert({ post_id: postId, user_id: user.id });
        } else {
          await (supabase.from("community_post_likes" as any) as any).delete().eq("post_id", postId).eq("user_id", user.id);
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
          toast.success(isSaved ? "Enregistré dans vos favoris" : "Retiré de vos favoris");
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
      prev.map((p) => (p.id === postId ? { ...p, comments: [newComment, ...p.comments] } : p))
    );
    setCommentInput("");
    if (!postId.startsWith("book-") && !postId.startsWith("course-") && !postId.startsWith("opp-") && !postId.startsWith("post-welcome")) {
      try {
        await (supabase.from("community_post_comments" as any) as any).insert({
          post_id: postId,
          user_id: user.id,
          user_name: userFullName,
          content: commentText,
        });
        toast.success("Commentaire publié");
      } catch (e: any) {
        toast.error("Erreur lors de l'envoi : " + (e.message || "erreur"));
      }
    } else {
      toast.success("Commentaire publié");
    }
  };

  const handleCreateNewPost = async () => {
    if (!newPostText.trim()) {
      toast.error("Veuillez saisir votre texte");
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
      toast.success("Votre publication est en ligne pour toute la communauté !");
    } catch (err: any) {
      toast.error("Erreur de publication : " + (err.message || ""));
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleSendChatMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;
    const userMsg = { role: "user" as const, content: query, time: "Maintenant" };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setChatOpen(true);
    setIsAiThinking(true);
    try {
      const response = await askAssistant({
        data: { messages: newHistory.map((m) => ({ role: m.role, content: m.content })) },
      });
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply, time: "À l'instant" },
      ]);
    } catch (err: any) {
      toast.error("L'Assistant BERSA est momentanément indisponible.");
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une difficulté réseau est survenue. Vous pouvez continuer à rédiger directement dans l'Atelier Word A4.",
          time: "Erreur",
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const quickActions = [
    { label: "📑 Plan de mémoire", prompt: "Propose-moi un plan de recherche scientifique et académique rigoureux en 3 parties sur ce thème :" },
    { label: "✍️ Reformuler", prompt: "Reformule ce texte dans un style universitaire élégant, fluide et rigoureux :" },
    { label: "⚖️ Analyse juridique", prompt: "Analyse juridiquement la situation suivante avec visa des textes applicables :" },
    { label: "🔍 Sources & Bibliographie", prompt: "Donne-moi les références bibliographiques et sources scientifiques majeures pour :" },
    { label: "✏️ Correction & Syntaxe", prompt: "Corrige rigoureusement l'orthographe, la syntaxe et la ponctuation de cet extrait :" },
    { label: "📖 Normes APA 7", prompt: "Mets en forme ces références selon les normes bibliographiques académiques APA 7e édition :" },
  ];

  const sendToA4Editor = (text: string) => {
    localStorage.setItem("bersa-editor-import", text);
    toast.success("Texte envoyé dans l'Atelier Word A4");
    navigate({ to: "/redaction" });
  };

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
      <div className="home-writing-layout min-h-screen bg-background text-foreground antialiased">
        {/* ============================================================ */}
        {/* 1. EN-TÊTE : LOGO, RECHERCHE RAPIDE, PROFIL & MENU 3 TRAITS  */}
        {/* ============================================================ */}
        <header className="sticky top-0 z-40 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md border-b border-slate-200">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
            <Link to="/accueil" className="flex items-center gap-2 shrink-0">
              <img
                src={logo.url}
                alt="Logo BERSA"
                className="h-9 w-9 rounded-xl object-contain shadow-xs bg-white p-0.5 border border-slate-100"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-black tracking-tight text-[#0a192f]">
                  BERSA
                </span>
                <span className="text-[10px] font-semibold text-amber-600">
                  Berceau du Savoir
                </span>
              </div>
            </Link>

            {/* Barre de recherche instantanée */}
            <div className="relative flex-1 max-w-[170px] sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
                className="h-8 rounded-full border-slate-200 bg-slate-100/90 pl-8 pr-3 text-xs focus-visible:bg-white"
              />
              {searchFocus && (
                <div className="absolute left-0 top-10 z-50 w-[min(92vw,22rem)] max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {searchResults.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-slate-500">
                      {searchQuery.trim() ? "Aucun résultat." : "Tapez pour chercher un document, un cours ou un livre..."}
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

            {/* Profil & Menu complet 3 traits */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to="/profil"
                aria-label="Mon profil"
                className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-blue-50 text-blue-900 font-bold text-xs overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userFullName} className="h-full w-full object-cover" />
                ) : (
                  (userFirstName ?? "A").charAt(0).toUpperCase()
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 hover:bg-slate-100">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-xl">
                  <DropdownMenuLabel className="text-xs font-bold text-[#0a192f] px-2 py-1">
                    Tableau de bord BERSA
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPublishModalOpen(true)}><Plus className="h-4 w-4" /> Publier</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setMsgTab("chat"); setMsgOpen(true); }}><MessageSquare className="h-4 w-4" /> Messages</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setMsgTab("notifications"); setMsgOpen(true); }}><Bell className="h-4 w-4" /> Notifications</DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/redaction" className="cursor-pointer gap-2.5 py-2 text-xs font-semibold text-[#1d4ed8]">
                      <FileText className="h-4 w-4 text-[#1d4ed8] shrink-0" /> Atelier de Rédaction Word A4
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
                      <BookOpen className="h-4 w-4 text-teal-600 shrink-0" /> Bibliothèque d'ouvrages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/opportunites" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <Briefcase className="h-4 w-4 text-rose-600 shrink-0" /> Opportunités & Financements
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFunModalOpen(true)} className="cursor-pointer gap-2.5 py-2 text-xs">
                    <Gamepad2 className="h-4 w-4 text-purple-600 shrink-0" /> Divertissement & Pause
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/documents" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <FileText className="h-4 w-4 text-cyan-600 shrink-0" /> Mes Documents sauvegardés
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/abonnements" className="cursor-pointer gap-2.5 py-2 text-xs">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" /> Abonnements & Forfaits
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
                      <User className="h-4 w-4 text-slate-500 shrink-0" /> Mon Profil
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

        <section className="home-writing-stage" aria-label="Mon atelier de rédaction">
          <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2">
            <h1 className="font-display text-lg font-bold text-primary">Mon atelier de rédaction</h1>
            <Button variant="outline" size="sm" onClick={() => setChatOpen(true)}><MessageCircle className="h-4 w-4" /> Discuter</Button>
          </div>
          <HomeEditor embedded />
        </section>
        <nav className="home-bottom-navigation" aria-label="Navigation principale">
          {([
            { to: "/accueil", label: "Accueil", icon: Home },
            { to: "/redaction", label: "Rédaction", icon: FileText },
            { to: "/formations", label: "Formation", icon: GraduationCap },
            { to: "/bibliotheque", label: "Bibliothèque", icon: BookOpen },
            { to: "/opportunites", label: "Opportunités", icon: Briefcase },
          ] as const).map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant="ghost" className="home-bottom-link">
              <Link to={to} aria-label={label} activeOptions={{ exact: true }} activeProps={{ className: "home-bottom-active" }}>
                <Icon className="h-5 w-5" /><span>{label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        {/* ============================================================ */}
        {/* 5. FLUX DE PUBLICATIONS, LIVRES & FORMATIONS                  */}
        {/* ============================================================ */}
        <main className="mx-auto max-w-xl px-3 pt-3">
          {/* Boîte de publication style Facebook */}
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-900 font-bold text-xs shrink-0 overflow-hidden">
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
                Partager une recherche ou un article, {userFirstName ?? ""} ?
              </button>
            </div>
          </div>

          {/* Liste des publications */}
          {loadingPosts ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              Chargement des publications et ouvrages...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Aucune publication pour le moment.
            </div>
          ) : (
            <div className="space-y-3.5">
              {posts.map((post) => {
                const isCommentsOpen = openCommentsPostId === post.id;
                return (
                  <article key={post.id} className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
                    {/* Profil de l'auteur */}
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-900 text-xs border border-blue-200 shrink-0">
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

                    {/* Image 16:9 proportionnée sans débordement */}
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
                          onClick={() => setExpanded((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                          className="mt-1 text-[11px] font-semibold text-[#1d4ed8] hover:underline block"
                        >
                          {expanded[post.id] ? "Voir moins" : "Voir plus..."}
                        </button>
                      )}
                    </div>

                    {/* Lien direct pour livre/formation */}
                    {post.linkTo && (
                      <div className="mt-3">
                        <Link
                          to={post.linkTo as any}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                        >
                          Consulter ce contenu <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}

                    {/* Interactions : Like, Commentaire, Partage */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition font-medium ${
                          post.isLiked ? "text-red-600" : "hover:text-red-600"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.isLiked ? "fill-red-600 text-red-600" : ""}`} />
                        <span>{post.likes}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)}
                        className="flex items-center gap-1.5 hover:text-blue-600 transition font-medium"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments.length}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSave(post.id)}
                        className={`hover:text-amber-600 transition ${post.isSaved ? "text-amber-600" : ""}`}
                      >
                        <Bookmark className={`h-4 w-4 ${post.isSaved ? "fill-amber-600" : ""}`} />
                      </button>
                      <button type="button" onClick={() => handleSharePost(post)} className="hover:text-slate-900 transition">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Zone de commentaires */}
                    {isCommentsOpen && (
                      <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Écrire un commentaire..."
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                            className="h-8 text-xs"
                          />
                          <Button size="sm" onClick={() => handleAddComment(post.id)} className="h-8 text-xs bg-[#0a192f] text-white">
                            Envoyer
                          </Button>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {post.comments.map((comm) => (
                            <div key={comm.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                              <span className="font-semibold text-slate-900 block">{comm.authorName}</span>
                              <p className="text-slate-700">{comm.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* Modales : Messages, Chat Assistant, Publication */}
        <HomeMessagesModal key={msgTab + String(msgOpen)} open={msgOpen} onOpenChange={setMsgOpen} initialTab={msgTab} />

        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-4">
            <DialogHeader className="border-b border-slate-100 pb-2">
              <DialogTitle className="flex items-center justify-between text-base font-bold text-slate-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span>Assistant BERSA</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate({ to: "/redaction" })} className="text-xs gap-1 border-blue-300 text-blue-900">
                  <FileText className="h-3.5 w-3.5" /> Ouvrir Word A4
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 max-h-[55vh]">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] text-xs leading-relaxed ${
                    msg.role === "user" ? "bg-[#0a192f] text-white" : "bg-slate-100 text-slate-900 border border-slate-200"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && msg.content.length > 80 && (
                      <div className="mt-2.5 flex items-center gap-2 border-t border-slate-200/80 pt-1.5">
                        <button type="button" onClick={() => sendToA4Editor(msg.content)} className="text-[11px] font-bold text-[#1d4ed8] hover:underline flex items-center gap-1">
                          <PenTool className="h-3 w-3" /> Transférer dans l'Atelier Word A4
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 w-fit">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  L'Assistant réfléchit et rédige...
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Input
                placeholder="Votre message à l'assistant..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                className="text-xs"
              />
              <Button onClick={() => handleSendChatMessage()} className="bg-[#0a192f] text-white h-9 px-3">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modale de publication directe */}
        <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
          <DialogContent className="sm:max-w-md p-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Créer une publication académique
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Textarea
                placeholder="Partagez une réflexion, une découverte scientifique ou une annonce..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                rows={4}
                className="text-xs"
              />
              <Input
                placeholder="Lien de l'image (optionnel)"
                value={newPostMediaUrl}
                onChange={(e) => setNewPostMediaUrl(e.target.value)}
                className="text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setPublishModalOpen(false)}>Annuler</Button>
                <Button size="sm" onClick={handleCreateNewPost} disabled={isSubmittingPost} className="bg-[#0a192f] text-white">
                  {isSubmittingPost ? "Publication..." : "Publier"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGate>
  );
                }                      
