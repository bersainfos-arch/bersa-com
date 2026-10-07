import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import consulting from "@/assets/bersa-consulting.jpg.asset.json";
import intro from "@/assets/bersa-intro.png.asset.json";

const categories = [
  { id: "all", fr: "Tout", en: "All" },
  { id: "training", fr: "Formations", en: "Training" },
  { id: "announcements", fr: "Communiqués", en: "Announcements" },
  { id: "activities", fr: "Activités & actualités", en: "Activities & news" },
  { id: "publications", fr: "Parutions", en: "Publications" },
  { id: "other", fr: "Autres", en: "Other" },
];
const slides = [
  { image: consulting.url, category: "announcements", title: "BERSA Consulting", fr: "Transformez vos idées en résultats", en: "Turn your ideas into results", alt: "Affiche BERSA Consulting — Dieudonné DJOMA, formateur en rédaction" },
  { image: intro.url, category: "other", title: "Berceau du Savoir", fr: "Une plateforme, plusieurs opportunités", en: "One platform, many opportunities", alt: "Image de présentation BERSA — Berceau du Savoir" },
];

export function HomeNews() {
  const { lang } = useI18n();
  const [category, setCategory] = useState("all");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const visible = slides.filter((slide) => category === "all" || slide.category === category);
  const current = visible[index % Math.max(visible.length, 1)];
  useEffect(() => {
    if (!playing || visible.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % visible.length), 6000);
    return () => window.clearInterval(timer);
  }, [playing, visible.length, category]);
  const move = (offset: number) => setIndex((value) => (value + offset + visible.length) % visible.length);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-4" aria-label={lang === "fr" ? "Actualités BERSA" : "BERSA news"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">BERSA</p>
          <h2 className="mt-1 text-3xl font-bold md:text-4xl">{lang === "fr" ? "À la une" : "Latest updates"}</h2>
        </div>
        <span className="text-sm text-muted-foreground">{lang === "fr" ? "Formations · Communiqués · Parutions" : "Training · Announcements · Publications"}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-1 border-b pb-3" role="group" aria-label={lang === "fr" ? "Catégories" : "Categories"}>
        {categories.map((item) => (
          <Button key={item.id} size="sm" variant={category === item.id ? "default" : "ghost"} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setIndex(0); }}>
            {lang === "fr" ? item.fr : item.en}
          </Button>
        ))}
      </div>
      {current ? (
        <div className="mt-5" aria-roledescription={lang === "fr" ? "diaporama" : "carousel"}>
          <div className="flex h-[480px] items-center justify-center overflow-hidden rounded-lg border bg-muted md:h-[560px]">
            <img key={current.image} src={current.image} alt={current.alt} className="h-full w-full object-contain" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">{current.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{lang === "fr" ? current.fr : current.en}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 text-sm tabular-nums text-muted-foreground">{index % visible.length + 1} / {visible.length}</span>
              <Button variant="outline" size="icon" disabled={visible.length < 2} onClick={() => move(-1)} aria-label={lang === "fr" ? "Photo précédente" : "Previous photo"} title={lang === "fr" ? "Photo précédente" : "Previous photo"}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" disabled={visible.length < 2} onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : (lang === "fr" ? "Lecture" : "Play")} title={playing ? "Pause" : (lang === "fr" ? "Lecture" : "Play")}>{playing ? <Pause /> : <Play />}</Button>
              <Button variant="outline" size="icon" disabled={visible.length < 2} onClick={() => move(1)} aria-label={lang === "fr" ? "Photo suivante" : "Next photo"} title={lang === "fr" ? "Photo suivante" : "Next photo"}><ChevronRight /></Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-48 items-center justify-center py-10 text-center text-muted-foreground">
          {lang === "fr" ? "Aucune annonce pour le moment." : "No announcements yet."}
        </div>
      )}
    </section>
  );
}