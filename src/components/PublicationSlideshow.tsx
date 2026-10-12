import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SLIDE_INTERVAL, SLIDE_LIMIT } from "@/lib/community";
export type Slide = { id: string; title: string; subtitle?: string | undefined; image?: string | undefined; created_at: string };
export function PublicationSlideshow({ items, label }: { items: Slide[]; label: string }) {
 const slides = [...items].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, SLIDE_LIMIT);
 const [index,setIndex] = useState(0); const [paused,setPaused] = useState(false);
 useEffect(() => { if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const timer = setInterval(() => setIndex(i => (i+1)%slides.length),SLIDE_INTERVAL); return () => clearInterval(timer); }, [paused,slides.length]);
 const item = slides[index % Math.max(1,slides.length)]; if (!item) return null;
 return <section aria-label={label} className="relative mx-auto flex min-h-44 max-w-6xl items-center gap-6 overflow-hidden border-b bg-royal px-5 py-6 text-royal-foreground sm:min-h-56 sm:px-8">
  {item.image && <img src={item.image} alt={item.title} className="h-36 w-28 shrink-0 object-contain sm:h-44 sm:w-44" />}
  <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase text-gold">{label}</p><h2 className="mt-2 break-words text-3xl sm:text-4xl">{item.title}</h2><p className="mt-2 text-sm opacity-80">{item.subtitle}</p><div className="mt-4 flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Publication précédente" onClick={() => setIndex((index-1+slides.length)%slides.length)}><ChevronLeft /></Button><span className="text-xs">{index%slides.length+1} / {slides.length}</span><Button variant="ghost" size="icon" aria-label="Publication suivante" onClick={() => setIndex((index+1)%slides.length)}><ChevronRight /></Button><Button variant="ghost" size="icon" aria-label={paused ? "Reprendre le diaporama" : "Mettre en pause"} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button></div></div>
 </section>;
}