import { useState } from "react";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Edit2,
  Trash2,
  Copy,
  Download,
  CheckCircle2,
  Send,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export interface FeedPost {
  id: string;
  userId?: string;
  authorName: string;
  authorSubtitle: string;
  authorAvatar?: string;
  isVerified?: boolean;
  content: string;
  mediaUrl?: string;
  videoUrl?: string;
  likes: number;
  comments: Array<{ id: string; authorName: string; text: string; time: string }>;
  isLiked?: boolean;
  isSaved?: boolean;
  date: string;
}

interface HomeFeedPostCardProps {
  post: FeedPost;
  currentUserId?: string;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (post: FeedPost) => void;
  onAddComment: (postId: string, text: string) => void;
}

export function HomeFeedPostCard({
  post,
  currentUserId,
  onLike,
  onSave,
  onDelete,
  onEdit,
  onAddComment,
}: HomeFeedPostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isOwner = Boolean(currentUserId && post.userId && currentUserId === post.userId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
    toast.success("Lien de la publication copié !");
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText("");
  };

  return (
    <article className="bg-card border border-border rounded-xl shadow-xs overflow-hidden transition-all hover:border-primary/20">
      {/* En-tête de la publication avec menu 3 points (⋮) à droite */}
      <div className="p-3.5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-primary overflow-hidden">
            {post.authorAvatar ? (
              <img src={post.authorAvatar} alt={post.authorName} className="h-full w-full object-cover" />
            ) : (
              post.authorName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-foreground truncate">{post.authorName}</h3>
              {post.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{post.authorSubtitle} • {post.date}</p>
          </div>
        </div>

        {/* Menu 3 points contextuel selon l'auteur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-1.5 bg-popover shadow-xl border border-border">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={() => onEdit(post)} className="gap-2 cursor-pointer text-xs py-2">
                  <Edit2 className="h-3.5 w-3.5 text-primary" />
                  <span>Modifier la publication</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer text-xs py-2">
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copier le lien direct</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="gap-2 cursor-pointer text-xs py-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Supprimer la publication</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer text-xs py-2">
                  <Copy className="h-3.5 w-3.5 text-primary" />
                  <span>Copier le lien direct</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSave(post.id)} className="gap-2 cursor-pointer text-xs py-2">
                  <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                  <span>{post.isSaved ? "Retirer des favoris" : "Enregistrer en favori"}</span>
                </DropdownMenuItem>
                {post.videoUrl && (
                  <DropdownMenuItem onClick={() => window.open(post.videoUrl, "_blank")} className="gap-2 cursor-pointer text-xs py-2">
                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Remixer / Télécharger la vidéo</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Texte limité à 2 lignes avec bouton « Voir plus » */}
      <div className="px-3.5 pb-2">
        <p className={`text-xs text-foreground/90 whitespace-pre-line leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
          {post.content}
        </p>
        {post.content.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-semibold text-primary hover:underline mt-1 block"
          >
            {expanded ? "Voir moins" : "Voir plus..."}
          </button>
        )}
      </div>

      {/* Média image ou vidéo redimensionné */}
      {post.mediaUrl && (
        <div className="w-full bg-muted/40 max-h-96 overflow-hidden flex items-center justify-center">
          <img src={post.mediaUrl} alt="Illustration de publication" className="w-full h-auto max-h-96 object-contain" />
        </div>
      )}
      {post.videoUrl && (
        <div className="p-3.5">
          <div className="p-3 rounded-lg bg-muted/60 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Contenu vidéo joint</span>
            </div>
            <a href={post.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-semibold hover:underline">
              Visionner
            </a>
          </div>
        </div>
      )}

      {/* Compteurs d'interactions */}
      <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
        <span>{post.likes} mentions J'aime</span>
        <span>{post.comments.length} commentaires</span>
      </div>

      {/* Barre d'action sociale (J'aime, Commenter, Partager, Favori) */}
      <div className="px-2 py-1 flex items-center justify-between border-t border-border/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id)}
          className={`flex-1 h-8 text-xs gap-1.5 ${post.isLiked ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
          <span>J'aime</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex-1 h-8 text-xs gap-1.5 text-muted-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Commenter</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCopyLink} className="flex-1 h-8 text-xs gap-1.5 text-muted-foreground">
          <Share2 className="h-4 w-4" />
          <span>Partager</span>
        </Button>
      </div>

      {/* Section des commentaires dépliable */}
      {showComments && (
        <div className="p-3 bg-muted/30 border-t border-border space-y-2">
          <form onSubmit={handleSendComment} className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Écrire un commentaire..."
              className="h-8 text-xs bg-background"
            />
            <Button type="submit" size="sm" className="h-8 px-3">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>

          {post.comments.map((c) => (
            <div key={c.id} className="p-2 bg-background rounded-lg text-xs space-y-0.5 border border-border/60">
              <div className="flex items-center justify-between font-semibold text-[11px] text-foreground">
                <span>{c.authorName}</span>
                <span className="text-[10px] text-muted-foreground font-normal">{c.time}</span>
              </div>
              <p className="text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
