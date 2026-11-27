import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  PenSquare,
  GraduationCap,
  BookOpen,
  FileText,
  BookMarked,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Award,
  Scroll,
  Mail,
  Briefcase,
  Building2,
  Calendar,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import type {
  ModelItem,
  GenerationFormData,
} from "@/lib/redaction-center/redaction-types";
import { ALL_MODELS } from "@/lib/redaction-center/models-data";
import { DocumentGenerationModal } from "./DocumentGenerationModal";

interface RedactionHubProps {
  onOpenBlank: () => void;
  onStartGeneration: (data: GenerationFormData) => void;
  onOpenGraphicEditor?: (model: ModelItem) => void;
}

// Données des diaporamas visuels haute définition
const CV_SLIDES = [
  {
    title: "CV Exécutif",
    tag: "Profil Moderne",
    gradient: "from-blue-900 via-indigo-900 to-slate-900",
    accent: "#0B2863",
    layout: "modern",
  },
  {
    title: "CV Académique",
    tag: "Recherche & Enseignement",
    gradient: "from-slate-800 to-slate-900",
    accent: "#1e293b",
    layout: "academic",
  },
  {
    title: "CV Créatif",
    tag: "Design & Communication",
    gradient: "from-blue-800 via-teal-900 to-slate-900",
    accent: "#0d9488",
    layout: "creative",
  },
];

const POSTER_SLIDES = [
  {
    title: "Conférence & Colloque",
    tag: "Format Affiche Pro",
    bg: "bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950",
    label: "GRAND SÉMINAIRE BERSA",
  },
  {
    title: "Atelier & Formation",
    tag: "Flyer A5 Communication",
    bg: "bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950",
    label: "MASTERCLASS RÉDACTION",
  },
  {
    title: "Annonce & Publication",
    tag: "Visuel Réseaux & Affichage",
    bg: "bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900",
    label: "LANCEMENT OFFICIEL",
  },
];

export const RedactionHub: React.FC<RedactionHubProps> = ({
  onOpenBlank,
  onStartGeneration,
  onOpenGraphicEditor,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [cvSlideIndex, setCvSlideIndex] = useState(0);
  const [posterSlideIndex, setPosterSlideIndex] = useState(0);
  const [selectedModelForModal, setSelectedModelForModal] = useState<ModelItem | null>(null);

  // Rotation automatique douce des diaporamas (CV et Affiches)
  useEffect(() => {
    const cvTimer = setInterval(() => {
      setCvSlideIndex((prev) => (prev + 1) % CV_SLIDES.length);
    }, 3800);

    const posterTimer = setInterval(() => {
      setPosterSlideIndex((prev) => (prev + 1) % POSTER_SLIDES.length);
    }, 4400);

    return () => {
      clearInterval(cvTimer);
      clearInterval(posterTimer);
    };
  }, []);

  // Filtrage interactif selon le moteur de recherche
  const isSearching = searchQuery.trim().length > 0;
  const filteredModels = useMemo(() => {
    if (!isSearching) return ALL_MODELS;
    const q = searchQuery.toLowerCase();
    return ALL_MODELS.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, isSearching]);

  // Clic sur un type de rédaction académique
  const handleOpenAcademicCategory = (docType: string) => {
    const match = ALL_MODELS.find(
      (m) =>
        m.title.toLowerCase().includes(docType.toLowerCase()) ||
        m.category === "academique"
    );
    if (match) setSelectedModelForModal(match);
    else onOpenBlank();
  };

  // Clic sur un modèle d'affiche ou flyer
  const handleOpenPoster = () => {
    const posterModel = ALL_MODELS.find((m) => m.category === "affiches") || {
      id: "affiche_conf",
      title: "Affiche Officielle BERSA",
      subtitle: "Format événementiel",
      category: "affiches" as const,
      description: "Affiche haute définition pour annonce et communication.",
      defaultPrompt: "Créer une affiche professionnelle",
      badge: "OFFICIEL",
    };
    if (onOpenGraphicEditor) onOpenGraphicEditor(posterModel);
    else setSelectedModelForModal(posterModel);
  };

  // Clic sur invitation
  const handleOpenInvitation = () => {
    const inviteModel = ALL_MODELS.find((m) => m.category === "invitations") || {
      id: "invitation_pro",
      title: "Invitation Officielle",
      subtitle: "Cérémonie & Événement",
      category: "invitations" as const,
      description: "Carton d'invitation avec dorures et typographie soignée.",
      defaultPrompt: "Rédiger une invitation formelle",
      badge: "PREMIUM",
    };
    if (onOpenGraphicEditor) onOpenGraphicEditor(inviteModel);
    else setSelectedModelForModal(inviteModel);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-900 pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        
        {/* RANG 1 : Moteur de recherche supérieur */}
        <div className="relative">
          <div className="flex items-center bg-white rounded-full border border-slate-200/90 shadow-sm px-4 py-2.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un type de document..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-slate-600 px-1.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* RANG 2 : Deux panneaux principaux côte à côte */}
        {!isSearching && (
          <div className="grid grid-cols-2 gap-3.5">
            {/* Panneau 1 : Page blanche avec bouton + */}
            <div
              onClick={onOpenBlank}
              className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Créer un nouveau document
                  </h2>
                </div>

                {/* Feuille A4 miniature réaliste avec ombre */}
                <div className="w-full aspect-[4/3] bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-md shadow-sm p-2 flex flex-col justify-between my-2 group-hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <div className="h-1.5 w-1/3 bg-slate-200 rounded" />
                    <div className="h-1 w-full bg-slate-100 rounded" />
                    <div className="h-1 w-4/5 bg-slate-100 rounded" />
                    <div className="h-1 w-2/3 bg-slate-100 rounded" />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[9px] font-mono text-slate-300">A4</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight mt-1">
                Commencez à partir d'une page blanche pour rédiger votre document
              </p>
            </div>

            {/* Panneau 2 : Rédiger avec liste d'éléments */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <PenSquare className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">Rédiger</h2>
                </div>

                <div className="space-y-1.5">
                  {[
                    { label: "Mémoire", icon: GraduationCap },
                    { label: "Thèses", icon: BookMarked },
                    { label: "Article", icon: FileText },
                    { label: "Ebook / Livres", icon: BookOpen },
                    { label: "Rapport académique", icon: FileSpreadsheet },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOpenAcademicCategory(item.label)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <item.icon className="w-3.5 h-3.5 text-blue-500/80 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSearchQuery("académique")}
                className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>Voir tous</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

                {/* RANG 3 & 4 : Section Modèles suggérés en 2 colonnes */}
        {!isSearching ? (
          <div className="space-y-3.5 pt-1">
            {/* Titre de section */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Modèles suggérés
              </h3>
              <button
                onClick={() => setSearchQuery("modèle")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Voir tout
              </button>
            </div>

            {/* RANG 3 : CV en diaporama (gauche) & Invitation Adobe (droite) */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Panneau CV en diaporama */}
              <div
                onClick={() => navigate({ to: "/cv-studio" })}
                className="group bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
              >
                {/* Aperçu diaporama CV */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative shadow-sm border border-slate-200/60 bg-slate-900 p-3 text-white flex flex-col justify-between select-none">
                  {/* Effet dégradé dynamique du slide actif */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${CV_SLIDES[cvSlideIndex]?.gradient} transition-all duration-700`} />
                  
                  {/* Miniature réaliste de CV */}
                  <div className="relative z-10 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-bold">
                      👤
                    </div>
                    <div>
                      <div className="h-1.5 w-12 bg-white/90 rounded" />
                      <div className="h-1 w-16 bg-white/50 rounded mt-0.5" />
                    </div>
                  </div>

                  {/* Lignes de compétences */}
                  <div className="relative z-10 space-y-1 my-auto">
                    <div className="h-1 w-full bg-white/30 rounded" />
                    <div className="h-1 w-4/5 bg-white/20 rounded" />
                    <div className="h-1 w-3/5 bg-white/20 rounded" />
                  </div>

                  {/* Étiquette du modèle actif */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] font-semibold tracking-wide uppercase text-white/80">
                    <span>{CV_SLIDES[cvSlideIndex]?.tag}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="mt-2.5 px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">CV</h4>
                  <p className="text-[11px] text-slate-500 truncate">Curriculum vitae</p>
                </div>
              </div>

              {/* Panneau Invitation (Modèle propre style Adobe) */}
              <div
                onClick={handleOpenInvitation}
                className="group bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
              >
                {/* Aperçu carton d'invitation raffiné */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative shadow-sm border border-amber-200/60 bg-gradient-to-br from-[#FFFDF9] via-[#FAF6ED] to-[#F3ECE0] p-3 flex flex-col justify-between text-center select-none">
                  {/* Motif doré raffiné */}
                  <div className="border border-amber-700/20 rounded-lg p-2 h-full flex flex-col justify-between">
                    <div className="text-[8px] tracking-widest text-amber-800 uppercase font-serif font-bold">
                      INVITATION OFFICIELLE
                    </div>
                    <div className="my-auto font-serif italic text-[13px] text-slate-800 leading-tight">
                      Cérémonie & Réception
                    </div>
                    <div className="text-[8px] text-amber-700/80 font-mono">
                      ✦ BERSA PRESTIGE ✦
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Invitation</h4>
                  <p className="text-[11px] text-slate-500 truncate">Invitation événement</p>
                </div>
              </div>
            </div>

            {/* RANG 4 : Affiche en photo diaporama (gauche) & Contrat / Documents (droite) */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Panneau Affiche en diaporama (Style Adobe Express) */}
              <div
                onClick={handleOpenPoster}
                className="group bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
              >
                {/* Aperçu affiche dynamique */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative shadow-sm border border-slate-800 p-3 text-white flex flex-col justify-between select-none">
                  <div className={`absolute inset-0 ${POSTER_SLIDES[posterSlideIndex]?.bg} transition-all duration-700`} />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-blue-500/80 text-white">
                      ADOBE STYLE
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </div>

                  <div className="relative z-10 my-auto text-center">
                    <div className="text-[11px] font-extrabold uppercase tracking-tight text-white leading-tight">
                      {POSTER_SLIDES[posterSlideIndex]?.label}
                    </div>
                    <div className="text-[8px] text-white/70 mt-0.5">
                      {POSTER_SLIDES[posterSlideIndex]?.tag}
                    </div>
                  </div>

                  <div className="relative z-10 flex justify-center gap-1">
                    {POSTER_SLIDES.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all ${
                          idx === posterSlideIndex ? "w-4 bg-white" : "w-1 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-2.5 px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Affiche</h4>
                  <p className="text-[11px] text-slate-500 truncate">Communication visuelle</p>
                </div>
              </div>

              {/* Panneau Contrat & Documents officiels */}
              <div
                onClick={() => {
                  const match = ALL_MODELS.find((m) => m.category === "juridique") || ALL_MODELS[0];
                  if (match) setSelectedModelForModal(match);
                }}
                className="group bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
              >
                {/* Aperçu contrat avec cachet bleu officiel */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative shadow-sm border border-slate-200 bg-white p-3 flex flex-col justify-between select-none">
                  <div className="space-y-1">
                    <div className="h-1.5 w-1/2 bg-slate-800 rounded" />
                    <div className="h-1 w-full bg-slate-100 rounded" />
                    <div className="h-1 w-5/6 bg-slate-100 rounded" />
                    <div className="h-1 w-3/4 bg-slate-100 rounded" />
                  </div>

                  {/* Sceau et paraphe officiel */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-700 text-blue-700 flex items-center justify-center text-[7px] font-bold">
                      SEAL
                    </div>
                    <div className="text-[8px] font-mono text-slate-400">Lu et approuvé</div>
                  </div>
                </div>

                <div className="mt-2.5 px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Contrat</h4>
                  <p className="text-[11px] text-slate-500 truncate">Contrat de prestation</p>
                </div>
              </div>
            </div>

            {/* RANG 5 : Lettre officielle & Rapport d'activité */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Lettre */}
              <div
                onClick={() => {
                  const match = ALL_MODELS.find((m) => m.category === "lettres") || ALL_MODELS[0];
                  if (match) setSelectedModelForModal(match);
                }}
                className="group bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative border border-slate-200 bg-[#FCFDFD] p-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="h-1.5 w-1/3 bg-slate-700 rounded" />
                    <div className="h-1 w-full bg-slate-100 rounded" />
                    <div className="h-1 w-4/5 bg-slate-100 rounded" />
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-400">
                    <span>Objet : Requête</span>
                    <Mail className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
                <div className="mt-2.5 px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Lettre</h4>
                  <p className="text-[11px] text-slate-500 truncate">Lettre officielle</p>
                </div>
              </div>

              {/* Rapport */}
              <div
                onClick={() => {
                  const match = ALL_MODELS.find((m) => m.category === "professionnel") || ALL_MODELS[0];
                  if (match) setSelectedModelForModal(match);
                }}
                className="group bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative border border-slate-200 bg-white p-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="h-1.5 w-2/5 bg-blue-900 rounded" />
                    <div className="h-1 w-full bg-slate-100 rounded" />
                    <div className="h-1 w-3/4 bg-slate-100 rounded" />
                  </div>
                  <div className="flex items-end gap-1 h-5 pt-1">
                    <div className="w-2 h-2 bg-blue-300 rounded-t" />
                    <div className="w-2 h-4 bg-blue-500 rounded-t" />
                    <div className="w-2 h-3 bg-blue-400 rounded-t" />
                    <div className="w-2 h-5 bg-blue-800 rounded-t" />
                  </div>
                </div>
                <div className="mt-2.5 px-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Rapport</h4>
                  <p className="text-[11px] text-slate-500 truncate">Rapport d'activité</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Résultats de recherche instantanés */
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Résultats de recherche ({filteredModels.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    if (
                      (model.category === "affiches" || model.category === "invitations") &&
                      onOpenGraphicEditor
                    ) {
                      onOpenGraphicEditor(model);
                    } else {
                      setSelectedModelForModal(model);
                    }
                  }}
                  className="bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-500 hover:shadow-sm cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {model.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                      {model.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                      {model.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-blue-600 font-semibold">
                    <span>Ouvrir</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modale assistée pour les documents textuels */}
      {selectedModelForModal && (
        <DocumentGenerationModal
          model={selectedModelForModal}
          isOpen={true}
          onClose={() => setSelectedModelForModal(null)}
          onGenerate={(data) => {
            setSelectedModelForModal(null);
            onStartGeneration(data);
          }}
        />
      )}
    </div>
  );
};
