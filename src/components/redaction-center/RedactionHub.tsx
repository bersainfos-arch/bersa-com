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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Mail,
  Scale,
  Receipt,
  Tag,
  Newspaper,
  Image as ImageIcon,
  BookCheck,
  CalendarDays,
  FileCheck2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
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

// Sous-modèles d'invitations
const INVITATION_MODELS = [
  { id: "inv_mariage", title: "Mariage d'Or", type: "Mariage", date: "Célébration", bg: "from-amber-100 via-rose-50 to-amber-50", border: "border-amber-300" },
  { id: "inv_anniv", title: "Anniversaire Gala", type: "Anniversaire", date: "Jubilé", bg: "from-indigo-950 via-slate-900 to-blue-950", border: "border-blue-400/30", dark: true },
  { id: "inv_fete", title: "Fête & Réception", type: "Soirée privée", date: "Soirée", bg: "from-purple-950 via-slate-900 to-indigo-950", border: "border-purple-400/30", dark: true },
  { id: "inv_pro", title: "Conférence Prestige", type: "Officielle", date: "Inauguration", bg: "from-slate-900 via-blue-950 to-slate-900", border: "border-amber-400/40", dark: true },
];

// Sous-modèles d'affiches
const POSTER_MODELS = [
  { id: "post_conf", title: "Conférence & Colloque", theme: "GRAND FORUM BERSA", date: "28 NOVEMBRE", bg: "from-blue-950 via-indigo-900 to-slate-950", tag: "ACADÉMIQUE" },
  { id: "post_form", title: "Formation & Masterclass", theme: "ATELIER PRATIQUE", date: "SESSION INTENSIVE", bg: "from-slate-950 via-blue-900 to-cyan-950", tag: "FORMATION" },
  { id: "post_recrut", title: "Recrutement & Emploi", theme: "TALENTS D'AVENIR", date: "POSTULEZ MAINTENANT", bg: "from-emerald-950 via-slate-900 to-teal-950", tag: "CARRIÈRE" },
  { id: "post_anniv", title: "Soirée d'Anniversaire", theme: "GRANDE CÉLÉBRATION", date: "ÉVÉNEMENT SPÉCIAL", bg: "from-amber-950 via-purple-950 to-slate-950", tag: "FESTIF" },
];

// Types de documents académiques détaillés
const ACADEMIC_TYPES = [
  { title: "Mémoire de fin d'études", desc: "Licence, Master & Ingéniorat", icon: GraduationCap, color: "bg-blue-600 text-white", border: "border-blue-200" },
  { title: "Thèse de doctorat", desc: "Recherche doctorale approfondie", icon: Award, color: "bg-indigo-700 text-white", border: "border-indigo-200" },
  { title: "Article scientifique", desc: "Format IMRAD pour revues indexées", icon: BookOpen, color: "bg-emerald-600 text-white", border: "border-emerald-200" },
  { title: "Ebook / Livre", desc: "Mise en page éditoriale et chapitrage", icon: BookMarked, color: "bg-purple-600 text-white", border: "border-purple-200" },
  { title: "Rapport académique", desc: "Projet tuteuré & stage", icon: FileSpreadsheet, color: "bg-sky-600 text-white", border: "border-sky-200" },
  { title: "Projet de recherche", desc: "Problématique & méthodologie", icon: FileText, color: "bg-amber-600 text-white", border: "border-amber-200" },
];

export const RedactionHub: React.FC<RedactionHubProps> = ({
  onOpenBlank,
  onStartGeneration,
  onOpenGraphicEditor,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelForModal, setSelectedModelForModal] = useState<ModelItem | null>(null);
  const [showAcademicPicker, setShowAcademicPicker] = useState(false);

  // Filtrage dynamique
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

  const handleOpenModelById = (id: string, fallbackCategory?: string) => {
    const match = ALL_MODELS.find((m) => m.id === id) ||
      (fallbackCategory ? ALL_MODELS.find((m) => m.category === fallbackCategory) : null) ||
      ALL_MODELS[0];
    if (match) setSelectedModelForModal(match);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-900 pb-24">
      <div className="max-w-3xl mx-auto px-3.5 pt-3 sm:pt-5 space-y-3.5">

        {/* RANG SUPÉRIEUR : Bouton retour ❮ + Moteur de recherche */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Retour à l'accueil"
            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-blue-700 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex-1 flex items-center bg-white rounded-full border border-slate-200/90 shadow-sm px-3.5 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-4 h-4 text-blue-600 mr-2.5 flex-shrink-0" />
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
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* MODAL / VUE DÉTAILLÉE : Tous les types de rédaction */}
        {showAcademicPicker && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <PenSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Documents à rédiger</h3>
                    <p className="text-[11px] text-slate-500">Sélectionnez le type pour ouvrir le formulaire</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAcademicPicker(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ACADEMIC_TYPES.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowAcademicPicker(false);
                      handleOpenModelById("memoire_fin_etudes", "personnalises");
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${t.border} bg-white hover:bg-slate-50 transition-all text-left shadow-sm group`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${t.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RANG 1 : Document blanc (Feuille A4 remplie) & Panneau Rédiger */}
        {!isSearching && (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Panneau 1 : Page A4 complète remplie */}
            <div
              onClick={onOpenBlank}
              className="group bg-white rounded-xl border border-slate-200/90 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  Créer un nouveau document
                </h2>
              </div>

              {/* Rendu réaliste d'une feuille A4 entièrement rédigée */}
              <div className="w-full aspect-[4/3] bg-white border border-slate-300 rounded-md shadow-sm p-2 flex flex-col justify-between group-hover:shadow transition-shadow">
                <div className="space-y-1">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <div className="h-1.5 w-1/3 bg-blue-900 rounded" />
                    <div className="h-1 w-8 bg-slate-300 rounded" />
                  </div>
                  <div className="h-2 w-3/4 bg-slate-800 rounded mt-1" />
                  <div className="space-y-0.5 pt-0.5">
                    <div className="h-1 w-full bg-slate-200 rounded" />
                    <div className="h-1 w-full bg-slate-200 rounded" />
                    <div className="h-1 w-5/6 bg-slate-200 rounded" />
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <div className="h-1 w-full bg-slate-200 rounded" />
                    <div className="h-1 w-4/5 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[8px] text-slate-400">
                  <span>BERSA WRITER</span>
                  <span>Page 1 / 1</span>
                </div>
              </div>
            </div>

            {/* Panneau 2 : Rédiger — ouvre les types de documents */}
            <div
              onClick={() => setShowAcademicPicker(true)}
              className="group bg-white rounded-xl border border-slate-200/90 p-3 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <PenSquare className="w-4 h-4 text-blue-600" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">Rédiger</h2>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold group-hover:underline">Ouvrir</span>
                </div>

                <div className="space-y-1">
                  {ACADEMIC_TYPES.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-1.5 py-1 rounded-md text-left text-[11px] font-medium text-slate-700 bg-slate-50/70"
                    >
                      <item.icon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-blue-600">
                <span>Mémoire, Thèse, Article...</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        )}

        {/* SECTION GALERIE DE MODÈLES AVEC DÉFILEMENT HORIZONTAL */}
        {!isSearching && (
          <div className="space-y-4 pt-1">

            {/* RANG CV : Diaporama & Modèles réels */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">CV Professionnels</h3>
                <button
                  onClick={() => navigate({ to: "/cv-studio" })}
                  className="text-[11px] font-semibold text-blue-600"
                >
                  Tous les CV
                </button>
              </div>

              <div
                onClick={() => navigate({ to: "/cv-studio" })}
                className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-sm hover:shadow-md cursor-pointer transition-all"
              >
                <div className="w-full aspect-[21/9] sm:aspect-[3/1] rounded-lg overflow-hidden relative bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-3 text-white flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-300 bg-slate-800 flex items-center justify-center text-lg font-bold">
                      👤
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white tracking-wide">CURRICULUM VITAE MODERNE</div>
                      <div className="text-[10px] text-amber-300">Expérience, Compétences & Formation</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="h-1 w-8 bg-blue-400 rounded-full" />
                        <span className="h-1 w-12 bg-indigo-400 rounded-full" />
                        <span className="h-1 w-6 bg-amber-400 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                      A4 RECOMMANDÉ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RANG INVITATIONS : Défilement horizontal */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Invitations Événements</h3>
                <span className="text-[10px] text-slate-400">Glisser ➔</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {INVITATION_MODELS.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => handleOpenModelById(inv.id, "invitations")}
                    className={`flex-shrink-0 w-44 sm:w-48 rounded-xl border ${inv.border} bg-gradient-to-br ${inv.bg} p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] select-none`}
                  >
                    <div className="border border-amber-400/30 rounded-lg p-2 h-full flex flex-col justify-between text-center">
                      <div className={`text-[8px] font-serif tracking-widest uppercase ${inv.dark ? "text-amber-300" : "text-amber-800"}`}>
                        {inv.type}
                      </div>
                      <div className={`font-serif italic text-xs leading-tight ${inv.dark ? "text-white" : "text-slate-900"}`}>
                        {inv.title}
                      </div>
                      <div className={`text-[7px] font-mono ${inv.dark ? "text-slate-300" : "text-slate-600"}`}>
                        ✦ BERSA PRESTIGE ✦
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RANG AFFICHES : Défilement horizontal */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Affiches & Communication</h3>
                <span className="text-[10px] text-slate-400">Glisser ➔</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {POSTER_MODELS.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      const model = ALL_MODELS.find((m) => m.category === "affiches") || ALL_MODELS[0];
                      if (onOpenGraphicEditor && model) onOpenGraphicEditor(model);
                      else if (model) setSelectedModelForModal(model);
                    }}
                    className={`flex-shrink-0 w-44 sm:w-48 rounded-xl border border-slate-800 bg-gradient-to-br ${post.bg} p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] text-white select-none`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500">
                        {post.tag}
                      </span>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    </div>
                    <div className="my-auto text-center">
                      <div className="text-[10px] font-black uppercase tracking-tight leading-tight">
                        {post.theme}
                      </div>
                      <div className="text-[8px] text-white/70 mt-0.5">{post.title}</div>
                    </div>
                    <div className="text-[7px] text-center text-amber-300 font-mono">
                      {post.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RANG 4 : Contrat & Lettre */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Contrat avec signature */}
              <div
                onClick={() => handleOpenModelById("contrat_prestation", "juridique")}
                className="group bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between transition-all"
              >
                <div className="w-full aspect-[4/3] rounded-lg border border-slate-200 bg-slate-50 p-2 flex flex-col justify-between select-none">
                  <div className="space-y-1">
                    <div className="h-1.5 w-1/2 bg-slate-800 rounded" />
                    <div className="h-1 w-full bg-slate-200 rounded" />
                    <div className="h-1 w-5/6 bg-slate-200 rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-700 text-blue-700 flex items-center justify-center text-[7px] font-bold">
                      SEAL
                    </div>
                    <div className="text-[7px] font-mono text-slate-500">✍ Signature</div>
                  </div>
                </div>
                <div className="mt-1.5">
                  <h4 className="text-xs font-bold text-slate-900">Contrat officiel</h4>
                  <p className="text-[10px] text-slate-500 truncate">Prestation & Bail</p>
                </div>
              </div>

              {/* Lettre officielle */}
              <div
                onClick={() => handleOpenModelById("lettre_motivation", "administratif")}
                className="group bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between transition-all"
              >
                <div className="w-full aspect-[4/3] rounded-lg border border-slate-200 bg-white p-2 flex flex-col justify-between select-none">
                  <div className="space-y-1">
                    <div className="h-1.5 w-1/3 bg-blue-900 rounded" />
                    <div className="h-1 w-full bg-slate-100 rounded" />
                    <div className="h-1 w-4/5 bg-slate-100 rounded" />
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-400">
                    <span>Requête officielle</span>
                    <Mail className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
                <div className="mt-1.5">
                  <h4 className="text-xs font-bold text-slate-900">Lettre formelle</h4>
                  <p className="text-[10px] text-slate-500 truncate">Administrative</p>
                </div>
              </div>
            </div>

            {/* RANG 5 : Nouveaux Modèles (Certificat, Coupon, Syllabus, Facture, etc.) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Autres Modèles & Documents</h3>
                <span className="text-[10px] text-slate-400">Glisser ➔</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {[
                  { title: "Certificat & Diplôme", desc: "Sceau académique officiel", icon: FileCheck2, color: "bg-amber-600 text-white" },
                  { title: "Coupon & Bon d'achat", desc: "Remise & Code promo", icon: Tag, color: "bg-rose-600 text-white" },
                  { title: "Programme de cours", desc: "Syllabus universitaire", icon: CalendarDays, color: "bg-blue-600 text-white" },
                  { title: "Facture & Devis", desc: "Gestion proforma A4", icon: Receipt, color: "bg-emerald-600 text-white" },
                  { title: "Journal & Bulletin", desc: "Mise en page presse", icon: Newspaper, color: "bg-slate-700 text-white" },
                  { title: "Album & Portfolio", desc: "Présentation visuelle", icon: ImageIcon, color: "bg-purple-600 text-white" },
                  { title: "Fiche & Résumé", desc: "Synthèse de lecture", icon: BookCheck, color: "bg-teal-600 text-white" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenModelById("art_scientifique", "autres")}
                    className="flex-shrink-0 w-36 sm:w-40 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] select-none"
                  >
                    <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shadow-sm`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">{item.title}</div>
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modal de génération de document */}
      {selectedModelForModal && (
        <DocumentGenerationModal
          model={selectedModelForModal}
          isOpen={true}
          onClose={() => setSelectedModelForModal(null)}
          onStartGeneration={(formData) => {
            setSelectedModelForModal(null);
            onStartGeneration(formData);
          }}
        />
      )}
    </div>
  );
};
