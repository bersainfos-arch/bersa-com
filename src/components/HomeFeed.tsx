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
  
