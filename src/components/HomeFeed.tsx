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

        // 2. Livres récents avec vraie couverture
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
          .select("id, title, description, instructor_name, domain, cover_path, created_at")
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
              authorName: c.instructor_name || "Formateur BERSA",
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
    
