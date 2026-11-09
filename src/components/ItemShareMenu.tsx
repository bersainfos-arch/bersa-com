import { useEffect, useState } from "react";
import { MoreVertical, Share2, Heart, Repeat2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Menu ⋮ commun : partage natif (WhatsApp, Bluetooth…), favoris locaux, republication et lien. */
export function ItemShareMenu({ id, title, path }: { id: string; title: string; path: string }) {
  const key = "bersa-favorites";
  const [fav, setFav] = useState(false);
  useEffect(() => { try { setFav((JSON.parse(localStorage.getItem(key) || "[]") as string[]).includes(id)); } catch { /* ignore */ } }, [id]);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const share = async (text = title) => {
    if (navigator.share) { try { await navigator.share({ title, text, url }); } catch { /* annulé */ } }
    else { await navigator.clipboard.writeText(url); toast.success("Lien copié"); }
  };
  const toggleFav = () => {
    const list: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
    localStorage.setItem(key, JSON.stringify(next)); setFav(!fav);
    toast.success(fav ? "Retiré des favoris" : "Ajouté aux favoris");
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Options pour ${title}`}><MoreVertical className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" />Partager</DropdownMenuItem>
        <DropdownMenuItem onClick={toggleFav}><Heart className={`mr-2 h-4 w-4 ${fav ? "fill-current text-destructive" : ""}`} />{fav ? "Retirer des favoris" : "Mettre en favoris"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void share(`À découvrir sur BERSA : ${title}`)}><Repeat2 className="mr-2 h-4 w-4" />Republier</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(url); toast.success("Lien copié"); }}><Link2 className="mr-2 h-4 w-4" />Copier le lien</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
