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
  isVerified?: boolean;
  title?: string;
  domain?: string;
  price?: string;
  content: string;
  mediaUrl?: string;
  videoUrl?: string;
  likes: number;
  isLiked?: boolean;
  comments: PostComment[];
  isSaved?: boolean;
  date: string;
  linkTo?: string;
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

  const userMeta = user?.user_metadata || {};
  const userFirstName = userMeta.first_name || user?.email?.split("@")[0] || "Auteur";
  const userFullName =
    `${userMeta.first_name || ""} ${userMeta.last_name || ""}`.trim() ||
    user?.email?.split("@")[0] ||
    "Auteur BERSA";
  const avatarUrl = userMeta.avatar_url || userMeta.picture;

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
          commentsByPost[c.post_id].push({
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
            "Transformez vos idées en résultats académiques et scientifiques d'excellence. Utilisez l'Atelier Word A4 avec Times New Roman 13pt et générez des documents parfaits avec notre Assistant IA.",
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
      <div className="min-h-screen bg-[#f1f5f9] text-slate-800 antialiased pb-28">
        {/* ============================================================ */}
        {/* 1. EN-TÊTE : LOGO, RECHERCHE RAPIDE, PROFIL & MENU 3 TRAITS  */}
        {/* ============================================================ */}
        <header className="sticky top-0 z-40 bg-white/95 px-3 py-2 shadow-xs backdrop-blur-md border-b border-slate-200">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 shrink-0">
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

        {/* ============================================================ */}
        {/* 2. BANNIÈRE ROYALE : OBJECTIF PRINCIPAL DE RÉDACTION          */}
        {/* ============================================================ */}
        <section className="bg-gradient-to-br from-[#0a192f] via-[#102a43] to-[#1e3a8a] text-white px-3.5 py-5 border-b border-amber-500/30 shadow-md">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                <Sparkles className="h-3 w-3" /> Plateforme Universitaire & Juridique
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-black leading-tight tracking-tight text-white">
              Studio de Rédaction & d'Intelligence Artificielle
            </h1>
            <p className="mt-1 text-xs text-slate-200 leading-relaxed font-sans">
              Le berceau du savoir, au service de votre plume. Rédigez vos thèses, mémoires, articles scientifiques et plaidoiries avec notre éditeur Word A4 aux normes académiques.
            </p>

            {/* Boutons d'Action Clés */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <Link
                to="/redaction"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:bg-amber-400 active:scale-98 transition"
              >
                <PenTool className="h-4 w-4" /> Ouvrir l'Atelier Word A4
              </Link>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-white border border-white/20 hover:bg-white/20 active:scale-98 transition backdrop-blur-xs"
              >
                <Sparkles className="h-4 w-4 text-amber-300" /> Discuter avec l'Assistant IA
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. ASSISTANT CHATGPT EN PREMIÈRE LIGNE (DIRECTEMENT VISIBLE)  */}
        {/* ============================================================ */}
        <section className="bg-white border-b border-slate-200 px-3.5 py-4 shadow-2xs">
          <div className="mx-auto max-w-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-900">
                  <Sparkles className="h-4 w-4 text-[#1d4ed8]" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Assistant BERSA en direct
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ● En ligne
              </span>
            </div>

            {/* Raccourcis de requêtes académiques */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-2">
              {quickActions.map((act) => (
                <button
                  key={act.label}
                  type="button"
                  onClick={() => handleSendChatMessage(act.prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  {act.label}
                </button>
              ))}
            </div>

            {/* Champ de saisie direct ChatGPT */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Posez votre question, demandez un plan, une reformulation..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                className="h-11 text-xs rounded-xl border-slate-300 bg-slate-50/70 focus-visible:bg-white focus-visible:ring-[#1d4ed8]"
              />
              <Button
                type="button"
                onClick={() => handleSendChatMessage()}
                className="h-11 w-11 shrink-0 rounded-xl bg-[#0a192f] hover:bg-[#1d4ed8] text-white shadow-sm flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
                      
