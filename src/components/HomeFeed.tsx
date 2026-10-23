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
