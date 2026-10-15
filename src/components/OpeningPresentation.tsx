import { useEffect, useState } from "react";
import { INTRO_STEP_MS, OPENING_PHOTOS, SLIDESHOW_INTERVAL_MS } from "@/lib/opening";
import logo from "@/assets/bersa-logo.png.asset.json";
import { ChevronRight } from "lucide-react";

const SLOGAN = "Le Berceau du Savoir au service de votre plume";
const SIGNATURE = "Transformer vos idées en résultats";

export function OpeningPresentation({ onDone }: { onDone: () => void }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);



  // Rotation des 20 photos toutes les 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % OPENING_PHOTOS.length);
    }, SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Défilement de 6 secondes avec mise à jour fluide
  useEffect(() => {
    const step = 50;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + step;
        if (next >= INTRO_STEP_MS * 2) {
          clearInterval(interval);
          onDone();
          return INTRO_STEP_MS * 2;
        }
        return next;
      });
    }, step);
    return () => clearInterval(interval);
  }, [onDone]);

  // Animation caractère par caractère
  const isFirstPhase = elapsed < INTRO_STEP_MS;
  const currentFullText = isFirstPhase ? SLOGAN : SIGNATURE;
  const phaseProgress = isFirstPhase
    ? elapsed / INTRO_STEP_MS
    : (elapsed - INTRO_STEP_MS) / INTRO_STEP_MS;
  const visibleCharsCount = Math.min(
    currentFullText.length,
    Math.floor(phaseProgress * currentFullText.length * 1.15)
  );
  const displayedText = currentFullText.slice(0, visibleCharsCount);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-center text-white">
      {/* Arrière-plan avec les 20 photos en fondu et flou doux */}
            {/* Arrière-plan avec les 20 photos */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${OPENING_PHOTOS[photoIndex]})` }}
      />

      {/* Voile léger pour garantir la lisibilité du texte sans cacher l'image */}
      <div className="absolute inset-0 bg-slate-950/45 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/50" />
      <div className="relative z-10 flex max-w-4xl flex-col items-center space-y-6">
        <div className="flex flex-col items-center">
          <img
            src={logo.url}
            alt="Logo BERSA"
            className="h-24 w-24 rounded-2xl shadow-2xl border border-white/10 ring-2 ring-primary/40 animate-pulse"
          />
          <h1 className="mt-4 text-2xl font-bold tracking-widest text-primary font-display uppercase">
            BERSA
          </h1>
        </div>

        {/* Zone de texte avec frappe animée */}
        <div className="min-h-[110px] flex items-center justify-center px-4">
          <p
            className="font-display text-3xl font-medium leading-relaxed tracking-wide text-white drop-shadow-lg md:text-5xl lg:text-6xl"
            aria-live="polite"
          >
            « {displayedText}
            <span className="inline-block w-[3px] h-[1em] ml-1 bg-amber-400 animate-pulse align-middle" />
            {" »"}
          </p>
        </div>

        {/* Raccourci pour passer sans attendre */}
        <button
          type="button"
          onClick={onDone}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-xs font-medium tracking-wider text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
        >
          Accéder directement <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

