import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search, Menu, Heart, MessageCircle, Share2, Bookmark, Plus,
  CheckCircle2, Home, GraduationCap, BookOpen, Briefcase, FileText,
  Send, Sparkles, Crown, ShieldCheck, User, Settings, Loader2,
  Copy, ShieldAlert, Bell, ImagePlus, Video, FileUp, X, Filter,
  TrendingUp, Users, ExternalLink, ThumbsUp
} from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getCommunityFeed } from "@/lib/community-feed.functions";
import { uploadCommunity } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HomeFeedPostCard, type FeedPost } from "@/components/HomeFeedPostCard";
import { toast } from "sonner";

export const FEED_CATEGORIES = [
  { id: "all", label: "Toutes les publications" },
  { id: "recherche", label: "Recherches scientifiques" },
  { id: "article", label: "Articles & Écrits" },
  { id: "formation", label: "Formations & Cours" },
  { id: "academique", label: "Publications académiques" },
  { id: "ressource", label: "Documents & PDF" },
  { id: "discussion", label: "Discussions" },
] as const;

export function HomeFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal de publication
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [postCategory, setPostCategory] = useState<string>("discussion");
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "pdf" | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Suggestions latérales
  const [suggestedCourses, setSuggestedCourses] = useState<Array<{ id: string; title: string; domain: string }>>([]);

  const userMeta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const userFirstName = userMeta["first_name"] || user?.email?.split("@")[0] || "Auteur";
  const userFullName =
    `${userMeta["first_name"] || ""} ${userMeta["last_name"] || ""}`.trim() ||
    user?.email?.split("@")[0] ||
    "Membre BERSA";
  const avatarUrl = userMeta["avatar_url"] || userMeta["picture"];

  // Chargement des publications et des contenus BERSA
  const loadFeed = async () => {
    try {
      setLoadingPosts(true);
      const [feedRes, likesRes, coursesRes, booksRes] = await Promise.all([
        user ? getCommunityFeed().catch(() => ({ posts: [], comments: [] })) : Promise.resolve({ posts: [], comments: [] }),
        user ? (supabase.from("community_post_likes" as any) as any).select("post_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
        supabase.from("courses").select("id, title, domain").eq("status", "published").limit(4),
        supabase.from("books").select("id, title, author, domain, cover_path, summary").eq("status", "approved").limit(4),
      ]);

      setSuggestedCourses((coursesRes.data as any) || []);

      const userLikesSet = new Set((likesRes?.data || []).map((l: any) => l.post_id));
      const commentsByPost: Record<string, Array<{ id: string; authorName: string; text: string; time: string }>> = {};
      
      ((feedRes.comments as any[]) || []).forEach((c: any) => {
        if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
        commentsByPost[c.post_id]?.push({
          id: c.id,
          authorName: c.user_name || "Membre BERSA",
          text: c.content,
          time: new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        });
      });

      const list: FeedPost[] = [];

      // Publications des membres
      ((feedRes.posts as any[]) || []).forEach((p: any) => {
        list.push({
          id: p.id,
          userId: p.author_id,
          authorName: p.author_name || "Auteur BERSA",
          authorSubtitle: p.author_role || "Membre chercheur",
          authorAvatar: p.author_avatar || undefined,
          isVerified: Boolean(p.author_role?.includes("Officiel") || p.author_name?.includes("BERSA")),
          content: p.content,
          mediaUrl: p.media_type === "image" ? p.media_url : undefined,
          videoUrl: p.media_type === "video" ? p.media_url : undefined,
          likes: p.views_count || 0,
          isLiked: userLikesSet.has(p.id),
          comments: commentsByPost[p.id] || [],
          date: new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        });
      });

      // Livres recommandés de la bibliothèque
      ((booksRes.data as any[]) || []).forEach((b: any) => {
        list.push({
          id: `book-${b.id}`,
          authorName: b.author || "Auteur BERSA",
          authorSubtitle: `Bibliothèque • ${b.domain || "Ouvrage scientifique"}`,
          isVerified: true,
          content: `${b.title}\n\n${b.summary || "Ouvrage disponible dans la Bibliothèque BERSA."}`,
          mediaUrl: b.cover_path || undefined,
          likes: 5,
          comments: [],
          date: "Recommandé",
        });
      });

      setPosts(list);
    } catch (e) {
      console.error("Erreur de chargement du fil :", e);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    void loadFeed();
  }, [user]);

  // Gestion du fichier sélectionné (Photo / Vidéo / PDF)
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>, forceType?: "image" | "video" | "pdf") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier dépasse la taille maximale autorisée (20 Mo).");
      return;
    }

    setSelectedFile(file);
    const determinedType = forceType || (file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "pdf");
    setFileType(determinedType);

    if (determinedType === "image") {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(file.name);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Publication d'un post avec téléversement Supabase Storage
  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedFile) {
      toast.error("Veuillez saisir un texte ou joindre un fichier.");
      return;
    }
    if (!user) {
      toast.error("Veuillez vous connecter pour publier.");
      return;
    }

    setIsSubmittingPost(true);
    const toastId = toast.loading("Publication en cours...");
    try {
      let uploadedUrl: string | null = null;
      if (selectedFile) {
        const path = await uploadCommunity(user.id, selectedFile);
        const { data: publicData } = supabase.storage.from("community").getPublicUrl(path);
        uploadedUrl = publicData?.publicUrl || null;
      }

      const { data, error } = await (supabase.from("community_posts" as any) as any)
        .insert({
          id: crypto.randomUUID(),
          author_id: user.id,
          author_name: userFullName,
          author_role: "Membre BERSA",
          author_avatar: avatarUrl || null,
          category: postCategory,
          content: newPostText.trim(),
          media_url: uploadedUrl,
          media_type: fileType || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.dismiss(toastId);
      toast.success("Votre publication est en ligne !");
      setPublishModalOpen(false);
      setNewPostText("");
      handleClearFile();
      void loadFeed();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Erreur de publication : " + (err.message || "Réessayez"));
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Interactions sociales
  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error("Connectez-vous pour aimer cette publication");
      return;
    }
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return { ...p, isLiked, likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1) };
        }
        return p;
      })
    );
    if (!postId.startsWith("book-") && !postId.startsWith("course-")) {
      const p = posts.find((x) => x.id === postId);
      if (p?.isLiked) {
        await (supabase.from("community_post_likes" as any) as any).delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await (supabase.from("community_post_likes" as any) as any).insert({ post_id: postId, user_id: user.id });
      }
    }
  };

  const handleSave = (postId: string) => {
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

  const handleDelete = async (postId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette publication ?")) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await (supabase.from("community_posts" as any) as any).delete().eq("id", postId);
      toast.success("Publication supprimée.");
    } catch {
      toast.error("Impossible de supprimer la publication.");
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) {
      toast.error("Connectez-vous pour commenter.");
      return;
    }
    const newComment = { id: `c-${Date.now()}`, authorName: userFullName, text, time: "À l'instant" };
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [newComment, ...p.comments] } : p)));
    if (!postId.startsWith("book-") && !postId.startsWith("course-")) {
      await (supabase.from("community_post_comments" as any) as any).insert({
        post_id: postId,
        user_id: user.id,
        user_name: userFullName,
        content: text,
      });
    }
    toast.success("Commentaire publié !");
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [posts, searchQuery]);
  return (
    <AuthGate>
      <div className="min-h-screen bg-[#f3f4f6]">
        {/* En-tête BERSA Découvrir */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 h-14 gap-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.png" alt="Logo BERSA" className="h-9 w-9 rounded-xl object-contain shadow-xs bg-white p-0.5" />
              <div className="hidden sm:block">
                <span className="font-display font-bold text-base text-[#0a192f]">BERSA</span>
                <span className="text-[10px] block text-primary font-medium tracking-wide">DÉCOUVRIR</span>
              </div>
            </Link>

            {/* Barre de recherche centrale */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des membres, publications, recherches..."
                className="h-9 pl-9 text-xs bg-slate-100/80 border-slate-200 rounded-full focus:bg-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Actions rapides utilisateur */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/redaction" className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                <FileText className="h-3.5 w-3.5" /> Atelier Rédaction
              </Link>
              <Link to="/profil" className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-blue-50 text-blue-900 font-bold text-xs overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} alt={userFullName} className="h-full w-full object-cover" /> : (userFirstName ?? "A").charAt(0).toUpperCase()}
              </Link>
            </div>
          </div>
        </header>

        {/* Structure 3 Colonnes Responsive */}
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-5 items-start">
            
            {/* COLONNE GAUCHE : Profil & Raccourcis professionnels */}
            <aside className="hidden lg:block space-y-3 sticky top-20">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs text-center">
                <div className="mx-auto mb-2.5 h-16 w-16 rounded-full bg-blue-100 text-blue-900 font-bold text-lg flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {avatarUrl ? <img src={avatarUrl} alt={userFullName} className="h-full w-full object-cover" /> : (userFirstName ?? "A").charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-sm text-slate-900 truncate">{userFullName}</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{userMeta["research_domain"] || "Chercheur BERSA"}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-around text-xs">
                  <div className="text-center">
                    <span className="block font-bold text-slate-900">{posts.filter((p) => p.userId === user?.id).length}</span>
                    <span className="text-[10px] text-slate-500">Publications</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-slate-900">{posts.filter((p) => p.isSaved).length}</span>
                    <span className="text-[10px] text-slate-500">Favoris</span>
                  </div>
                </div>
                <Link to="/profil" className="mt-3 block w-full rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                  Voir mon profil
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-1 text-xs">
                <div className="font-semibold text-slate-500 text-[11px] px-2 py-1 uppercase tracking-wider">Raccourcis BERSA</div>
                <Link to="/redaction" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                  <FileText className="h-4 w-4 text-blue-600" /> Atelier de Rédaction A4
                </Link>
                <Link to="/bibliotheque" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                  <BookOpen className="h-4 w-4 text-teal-600" /> Bibliothèque d'ouvrages
                </Link>
                <Link to="/formations" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                  <GraduationCap className="h-4 w-4 text-emerald-600" /> Formations certifiantes
                </Link>
                <Link to="/anti-plagiat" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Détecteur Anti-plagiat
                </Link>
              </div>
            </aside>

            {/* COLONNE CENTRALE : Fil d'actualité & Publications */}
            <main className="min-w-0 space-y-3.5">
              {/* Boîte de publication unique Facebook/LinkedIn */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarUrl ? <img src={avatarUrl} alt={userFullName} className="h-full w-full object-cover" /> : (userFirstName ?? "A").charAt(0).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(true)}
                    className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-left text-xs text-slate-500 hover:bg-slate-200/80 transition truncate font-medium"
                  >
                    Partager un article, une recherche ou un document, {userFirstName} ?
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-around border-t border-slate-100 pt-2 text-xs text-slate-600">
                  <button onClick={() => { setPostCategory("article"); setPublishModalOpen(true); }} className="flex items-center gap-1.5 hover:text-blue-600 font-medium transition">
                    ✍️ Texte
                  </button>
                  <button onClick={() => { setPostCategory("ressource"); setPublishModalOpen(true); }} className="flex items-center gap-1.5 hover:text-emerald-600 font-medium transition">
                    📷 Photo
                  </button>
                  <button onClick={() => { setPostCategory("recherche"); setPublishModalOpen(true); }} className="flex items-center gap-1.5 hover:text-red-600 font-medium transition">
                    🎥 Vidéo
                  </button>
                  <button onClick={() => { setPostCategory("academique"); setPublishModalOpen(true); }} className="flex items-center gap-1.5 hover:text-amber-600 font-medium transition">
                    📄 Document PDF
                  </button>
                </div>
              </div>

              {/* Barre de filtres par catégories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {FEED_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 rounded-full px-3 py-1 font-medium transition ${
                      activeCategory === cat.id ? "bg-primary text-primary-foreground shadow-xs" : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Flux des publications */}
              {loadingPosts ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  Chargement du fil d'actualité professionnel...
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
                  Aucune publication trouvée dans cette catégorie.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredPosts.map((post) => (
                    <HomeFeedPostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id || ""}
                      onLike={handleLike}
                      onSave={handleSave}
                      onDelete={handleDelete}
                      onEdit={() => toast.info("Modification ouverte")}
                      onAddComment={handleAddComment}
                    />
                  ))}
                </div>
              )}
            </main>

            {/* COLONNE DROITE : Suggestions de membres & Formations */}
            <aside className="hidden lg:block space-y-3.5 sticky top-20">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" /> Membres de BERSA
                  </h4>
                  <Link to="/profil" className="text-[11px] text-primary hover:underline font-medium">Voir mon profil</Link>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-primary font-bold flex items-center justify-center shrink-0">D</div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate text-slate-900">Dr. Dieudonné Djoma</div>
                        <div className="text-[10px] text-slate-500 truncate">Fondateur & Directeur</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" onClick={() => toast.success("Vous suivez ce membre")}>Suivre</Button>
                  </div>
                </div>
              </div>

              {suggestedCourses.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <h4 className="font-bold text-xs text-slate-900 mb-2.5 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-emerald-600" /> Formations à la une
                  </h4>
                  <div className="space-y-2 text-xs">
                    {suggestedCourses.map((c) => (
                      <Link key={c.id} to="/formations" className="block p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">{c.domain}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>

          </div>
        </div>

        {/* Modal de création de publication */}
        <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
          <DialogContent className="sm:max-w-lg p-5">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Créer une publication</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium"
                >
                  <option value="discussion">💬 Discussion</option>
                  <option value="recherche">🔬 Recherche scientifique</option>
                  <option value="article">✍️ Article & Écrit</option>
                  <option value="academique">🎓 Publication académique</option>
                  <option value="ressource">📄 Document & PDF</option>
                </select>
              </div>

              <Textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="De quoi souhaitez-vous parler avec la communauté ?"
                rows={4}
                className="text-xs resize-none"
              />

              {filePreview && (
                <div className="relative rounded-lg border border-slate-200 p-2 bg-slate-50">
                  <button onClick={handleClearFile} className="absolute right-2 top-2 rounded-full bg-slate-800 text-white p-1 hover:bg-black">
                    <X className="h-3 w-3" />
                  </button>
                  {fileType === "image" ? (
                    <img src={filePreview} alt="Aperçu" className="max-h-48 rounded object-contain mx-auto" />
                  ) : (
                    <div className="text-xs font-semibold text-slate-700 p-2">📄 Fichier joint : {filePreview}</div>
                  )}
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf" className="hidden" onChange={(e) => handleSelectFile(e)} />

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus className="h-4 w-4 mr-1 text-emerald-600" /> Photo
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4 mr-1 text-amber-600" /> PDF
                  </Button>
                </div>
                <Button size="sm" disabled={isSubmittingPost || (!newPostText.trim() && !selectedFile)} onClick={handleCreatePost} className="h-8 px-4 text-xs font-bold">
                  {isSubmittingPost ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />} Publier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AuthGate>
  );
      }
            
                                                          
