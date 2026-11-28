import React, { useState, useMemo } from "react";
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
  Sparkles,
  Award,
  Scale,
  Stamp,
  BookCheck,
  FileCheck2,
  FolderOpen,
  Calendar,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type {
  ModelItem,
  GenerationFormData,
} from "@/lib/redaction-center/redaction-types";
import { ALL_MODELS } from "@/lib/redaction-center/models-data";
import { CV_TEMPLATES, renderCvHtml, sampleCvFor } from "@/lib/cv-templates";
import { DOC_TEMPLATES } from "@/lib/doc-templates";
import { RDC_LETTERS } from "@/lib/letter-catalog-rdc";
import { CvPreview } from "@/components/CvPreview";
import { DocumentGenerationModal } from "./DocumentGenerationModal";

interface RedactionHubProps {
  onOpenBlank: () => void;
  onStartGeneration: (data: GenerationFormData) => void;
  onOpenGraphicEditor?: (model: ModelItem) => void;
}

// 1. Les 13 types de documents ordonnés rigoureusement
const ACADEMIC_TYPES = [
  {
    id: "memoire_fin_etudes",
    title: "Mémoire",
    desc: "Licence, Master & Ingéniorat, problématique et méthodologie",
    icon: GraduationCap,
    badge: "Académique",
    color: "bg-blue-600 text-white",
    border: "border-blue-200",
  },
  {
    id: "these_doctorat",
    title: "Thèse",
    desc: "Doctorat & PhD, recherche originale approfondie",
    icon: Award,
    badge: "Doctorat",
    color: "bg-indigo-700 text-white",
    border: "border-indigo-200",
  },
  {
    id: "article_scientifique",
    title: "Article scientifique",
    desc: "Format IMRAD pour revues indexées et colloques",
    icon: BookOpen,
    badge: "Recherche",
    color: "bg-emerald-600 text-white",
    border: "border-emerald-200",
  },
  {
    id: "ebook_livre",
    title: "Ebook / Livre",
    desc: "Mise en page éditoriale, chapitrage et préface",
    icon: BookMarked,
    badge: "Édition",
    color: "bg-purple-600 text-white",
    border: "border-purple-200",
  },
  {
    id: "roman_fiction",
    title: "Roman / Fiction",
    desc: "Intrigue romanesque, développement de personnages et dialogues",
    icon: Sparkles,
    badge: "Littérature",
    color: "bg-pink-600 text-white",
    border: "border-pink-200",
  },
  {
    id: "travail_pratique",
    title: "Travail pratique",
    desc: "Rapports de TP, exercices académiques et travaux dirigés",
    icon: FileText,
    badge: "TP & TD",
    color: "bg-cyan-600 text-white",
    border: "border-cyan-200",
  },
  {
    id: "revue_litterature",
    title: "Revue de la littérature",
    desc: "État de l'art critique et synthèse documentaire approfondie",
    icon: BookCheck,
    badge: "Synthèse",
    color: "bg-sky-700 text-white",
    border: "border-sky-200",
  },
  {
    id: "protocole_recherche",
    title: "Protocole de recherche",
    desc: "Planification des variables, hypothèses et échantillonnage",
    icon: Scale,
    badge: "Méthode",
    color: "bg-teal-600 text-white",
    border: "border-teal-200",
  },
  {
    id: "expose_acad",
    title: "Exposé académique",
    desc: "Présentation orale structurée et plan minuté",
    icon: FileText,
    badge: "Oral",
    color: "bg-blue-800 text-white",
    border: "border-blue-200",
  },
  {
    id: "rapport_stage",
    title: "Rapport de stage",
    desc: "Immersion professionnelle, analyse de poste et bilan d'acquis",
    icon: FileSpreadsheet,
    badge: "Professionnel",
    color: "bg-amber-600 text-white",
    border: "border-amber-200",
  },
  {
    id: "etude_cas",
    title: "Étude de cas",
    desc: "Diagnostic managérial, organisationnel ou clinique",
    icon: Search,
    badge: "Analyse",
    color: "bg-violet-700 text-white",
    border: "border-violet-200",
  },
  {
    id: "dissertation_acad",
    title: "Dissertation",
    desc: "Plan dialectique ou thématique avec argumentation rigoureuse",
    icon: FileCheck2,
    badge: "Dissertation",
    color: "bg-slate-700 text-white",
    border: "border-slate-200",
  },
  {
    id: "autre_document",
    title: "Autres documents",
    desc: "Création libre avec structure et sections sur mesure",
    icon: Plus,
    badge: "Sur-mesure",
    color: "bg-slate-900 text-white",
    border: "border-slate-300",
  },
];

// 2. Modèles d'affiches grand format
const POSTER_MODELS = [
  {
    id: "post_conf",
    title: "Conférence & Colloque",
    theme: "GRAND FORUM BERSA",
    date: "28 NOVEMBRE",
    location: "Kinshasa Gombe",
    bg: "from-[#0A192F] via-[#112240] to-[#020C1B]",
    accent: "text-amber-400 border-amber-400/40",
    tag: "ACADÉMIQUE",
  },
  {
    id: "post_form",
    title: "Formation & Masterclass",
    theme: "ATELIER PRATIQUE",
    date: "SESSION INTENSIVE",
    location: "Campus Numérique",
    bg: "from-[#0F2027] via-[#203A43] to-[#2C5364]",
    accent: "text-cyan-400 border-cyan-400/40",
    tag: "FORMATION",
  },
  {
    id: "post_recrut",
    title: "Recrutement & Carrière",
    theme: "TALENTS D'AVENIR",
    date: "POSTULEZ MAINTENANT",
    location: "Session Annuelle",
    bg: "from-[#134E5E] via-[#1A2A6C] to-[#243B55]",
    accent: "text-emerald-400 border-emerald-400/40",
    tag: "CARRIÈRE",
  },
  {
    id: "post_anniv",
    title: "Célébration & Gala",
    theme: "GRANDE SOIRÉE PRESTIGE",
    date: "ÉVÉNEMENT EXCLUSIF",
    location: "Hôtel Fleuve",
    bg: "from-[#200122] via-[#481140] to-[#0f0c29]",
    accent: "text-rose-300 border-rose-300/40",
    tag: "GALA",
  },
];

// 3. Modèles d'invitations raffinées
const INVITATION_MODELS = [
  {
    id: "inv_mariage",
    title: "Mariage d'Or",
    subtitle: "Union & Bénédiction Nuptiale",
    type: "Mariage Prestige",
    bg: "from-[#FFFDF7] via-[#FFF9ED] to-[#FFF4DE]",
    border: "border-amber-300/90",
    goldBorder: true,
    dark: false,
  },
  {
    id: "inv_gala",
    title: "Gala d'Excellence",
    subtitle: "Dîner de Bienfaisance & Récital",
    type: "Cérémonie Officielle",
    bg: "from-[#0B132B] via-[#1C2541] to-[#3A506B]",
    border: "border-amber-400/50",
    goldBorder: true,
    dark: true,
  },
  {
    id: "inv_anniv",
    title: "Anniversaire Célébration",
    subtitle: "Jubilé & Réception Privée",
    type: "Anniversaire",
    bg: "from-[#1F1C2C] via-[#928DAB] to-[#1F1C2C]",
    border: "border-purple-300/40",
    goldBorder: false,
    dark: true,
  },
  {
    id: "inv_soutenance",
    title: "Soutenance Académique",
    subtitle: "Défense Publique de Thèse",
    type: "Académique",
    bg: "from-[#FAFAFA] via-[#F4F4F5] to-[#E4E4E7]",
    border: "border-blue-300",
    goldBorder: false,
    dark: false,
  },
];

// 4. Modèles de certificats & brevets
const CERTIFICATE_MODELS = [
  {
    id: "cert_reussite",
    title: "Certificat de Réussite",
    sub: "Attestation de fin de parcours",
    type: "ACADÉMIQUE",
    seal: "border-amber-500 text-amber-600 bg-amber-50",
  },
  {
    id: "attest_stage",
    title: "Attestation de Stage",
    sub: "Validation de stage en entreprise",
    type: "PROFESSIONNEL",
    seal: "border-blue-600 text-blue-700 bg-blue-50",
  },
  {
    id: "brevet_aptitude",
    title: "Brevet d'Aptitude",
    sub: "Reconnaissance de qualification",
    type: "MÉRITE",
    seal: "border-indigo-600 text-indigo-700 bg-indigo-50",
  },
  {
    id: "diplome_honneur",
    title: "Diplôme d'Honneur",
    sub: "Distinction & engagement citoyen",
    type: "PRESTIGE",
    seal: "border-amber-600 text-amber-700 bg-amber-50",
  },
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

  // Vrais modèles pré-rendus de CV Studio
  const realCvSlides = useMemo(() => {
    return CV_TEMPLATES.map((tmpl) => ({
      tmpl,
      html: renderCvHtml(tmpl, sampleCvFor(tmpl)),
    }));
  }, []);

  // Modèles réels de contrats et correspondances
  const legalContracts = useMemo(
    () => DOC_TEMPLATES.filter((t) => t.cat === "juridique"),
    []
  );
  const businessPlans = useMemo(
    () => DOC_TEMPLATES.filter((t) => t.cat === "business"),
    []
  );
  const realLetters = useMemo(() => RDC_LETTERS, []);

  // Recherche
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
    const match =
      ALL_MODELS.find((m) => m.id === id) ||
      (fallbackCategory ? ALL_MODELS.find((m) => m.category === fallbackCategory) : null) ||
      ALL_MODELS[0];
    if (match) setSelectedModelForModal(match);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-slate-900 pb-24">
      <div className="max-w-3xl mx-auto px-2.5 pt-3 sm:pt-4 space-y-3">

        {/* BARRE DU HAUT : Retour ❮ + Moteur de recherche */}
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
              placeholder="Rechercher un type de document (CV, Contrat, Mémoire...)"
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

        {/* MODALE COMPLETE DES 13 TYPES DE RÉDACTION ORDONNÉS */}
        {showAcademicPicker && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2.5 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <PenSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Documents à rédiger</h3>
                    <p className="text-[11px] text-slate-500">13 types classés dans l'ordre strict — choisissez votre format</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAcademicPicker(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACADEMIC_TYPES.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setShowAcademicPicker(false);
                      handleOpenModelById(t.id, "personnalises");
                    }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${t.border} bg-white hover:bg-slate-50 hover:border-blue-500 transition-all text-left shadow-sm group`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${t.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{t.title}</span>
                        <span className="text-[9px] font-bold text-slate-400">#{idx + 1}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PREMIER RANG : DEUX GRANDS PANNEAUX ALLONGÉS (PAPIER TOUT BLANC & RÉDIGER) */}
        {!isSearching && (
          <div className="grid grid-cols-2 gap-2">
            
            {/* Panneau 1 : Nouveau document avec papier tout blanc A4 complet */}
            <div
              onClick={onOpenBlank}
              className="group bg-white rounded-2xl border border-slate-200/90 p-3 shadow-sm hover:shadow-md hover:border-blue-500/60 cursor-pointer flex flex-col justify-between transition-all min-h-[220px]"
            >
              <div className="flex items-center gap-1.5 pb-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 leading-tight truncate">
                  + Créer un nouveau document
                </h2>
              </div>

              {/* Rendu d'une véritable feuille A4 tout blanc, pure et soignée */}
              <div className="flex-1 my-1 bg-[#FAFAFA] border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="w-[85%] h-full bg-white rounded-sm border border-slate-300/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col justify-between p-2.5 transition-transform group-hover:scale-[1.02]">
                  <div className="w-8 h-1 bg-slate-200 rounded" />
                  <div className="text-center">
                    <span className="text-[8px] font-serif text-slate-300 tracking-widest uppercase">
                      PAGE BLANCHE A4
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[7px] font-mono text-slate-300">794 × 1123</span>
                  </div>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>Atelier Word A4</span>
                <span className="text-blue-600 font-bold group-hover:underline">Ouvrir ➔</span>
              </div>
            </div>

            {/* Panneau 2 : Rédiger — Ouvre les 13 formats ordonnés */}
            <div
              onClick={() => setShowAcademicPicker(true)}
              className="group bg-white rounded-2xl border border-slate-200/90 p-3 shadow-sm hover:shadow-md hover:border-blue-500/60 cursor-pointer flex flex-col justify-between transition-all min-h-[220px]"
            >
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <PenSquare className="w-4 h-4 text-blue-600" />
                    <h2 className="text-xs font-bold text-slate-900">Rédiger</h2>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold group-hover:underline">13 types</span>
                </div>

                {/* Les 4 premiers types affichés directement dans le panneau */}
                <div className="space-y-1 mt-2">
                  {ACADEMIC_TYPES.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-2 py-1 rounded-md text-[10px] font-medium text-slate-700 bg-slate-50/80 group-hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <item.icon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-blue-600">
                <span className="truncate text-slate-600 font-medium">Mémoire, Thèse, Article...</span>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 ml-1" />
              </div>
            </div>

          </div>
        )}

        {/* RANGÉES SUIVANTES : PANNEAUX AGRANDIS ET ESPACEMENTS RESSERRÉS (GAP-2) */}
        {!isSearching && (
          <div className="space-y-3.5 pt-1">

            {/* 1. RANGÉE CV PROFESSIONNELS (L'intégralité du modèle est visible comme sur l'accueil) */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">CV Professionnels</h3>
                <button
                  onClick={() => navigate({ to: "/cv-studio" })}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Ouvrir CV Studio ➔
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {realCvSlides.map(({ tmpl, html }) => (
                  <div
                    key={tmpl.id}
                    onClick={() => navigate({ to: "/cv-studio" })}
                    className="flex-shrink-0 w-48 sm:w-52 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between select-none transition-all group min-h-[220px]"
                  >
                    {/* Miniature entière de la feuille A4 du CV */}
                    <div className="w-full h-36 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/70 relative pointer-events-none">
                      <div className="w-full h-full transform scale-[0.24] origin-top-left">
                        <CvPreview compact html={html} />
                      </div>
                    </div>

                    <div className="pt-1.5 px-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                          {tmpl.name}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white shadow-xs"
                          style={{ backgroundColor: tmpl.primary }}
                        />
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{tmpl.category}</div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] font-semibold text-slate-500">
                      <span>Modèle A4 complet</span>
                      <span className="text-blue-600 font-bold">Personnaliser</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. RANGÉE AFFICHES & COMMUNICATION VISUELLE (Vient juste après les CV) */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Affiches & Communication Visuelle</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {POSTER_MODELS.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      const model = ALL_MODELS.find((m) => m.category === "affiches") || ALL_MODELS[0];
                      if (onOpenGraphicEditor && model) onOpenGraphicEditor(model);
                      else if (model) setSelectedModelForModal(model);
                    }}
                    className={`flex-shrink-0 w-48 sm:w-52 rounded-2xl border border-slate-800 bg-gradient-to-br ${post.bg} p-3 shadow-md hover:shadow-lg cursor-pointer snap-start flex flex-col justify-between text-white select-none transition-all min-h-[220px] group`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-600 shadow-sm">
                        {post.tag}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    </div>

                    <div className="my-auto text-center space-y-1">
                      <div className="text-[11px] font-black uppercase tracking-wider leading-tight text-white group-hover:scale-105 transition-transform">
                        {post.theme}
                      </div>
                      <div className="text-[9px] text-white/80 font-medium">{post.title}</div>
                      <div className="text-[8px] text-white/60 flex items-center justify-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{post.location}</span>
                      </div>
                    </div>

                    <div className={`text-[8px] text-center font-mono py-1 rounded border ${post.accent} bg-black/20`}>
                      {post.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. RANGÉE INVITATIONS ÉVÉNEMENTS (Vient juste après les Affiches) */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Invitations Événements</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {INVITATION_MODELS.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => handleOpenModelById(inv.id, "invitations")}
                    className={`flex-shrink-0 w-48 sm:w-52 rounded-2xl border ${inv.border} bg-gradient-to-br ${inv.bg} p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between select-none transition-all min-h-[220px] group`}
                  >
                    <div className={`border ${inv.goldBorder ? "border-amber-400/50" : "border-slate-300/40"} rounded-xl p-2.5 h-full flex flex-col justify-between text-center`}>
                      <div className={`text-[8px] font-serif tracking-widest uppercase font-bold ${inv.dark ? "text-amber-300" : "text-amber-800"}`}>
                        {inv.type}
                      </div>

                      <div className="space-y-0.5 my-auto">
                        <div className={`font-serif italic text-sm font-bold leading-tight ${inv.dark ? "text-white" : "text-slate-900"}`}>
                          {inv.title}
                        </div>
                        <div className={`text-[9px] ${inv.dark ? "text-slate-300" : "text-slate-600"}`}>
                          {inv.subtitle}
                        </div>
                      </div>

                      <div className={`text-[8px] font-mono tracking-wider ${inv.dark ? "text-amber-400" : "text-amber-700"}`}>
                        ✦ BERSA CÉRÉMONIE ✦
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. RANGÉE CONTRATS & ACTES JURIDIQUES */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Contrats & Actes Juridiques</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {legalContracts.map((contract) => (
                  <div
                    key={contract.id}
                    onClick={() => handleOpenModelById("contrat_prestation", "juridique")}
                    className="flex-shrink-0 w-48 sm:w-52 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between select-none transition-all group min-h-[220px]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <Scale className="w-4 h-4 text-blue-700" />
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        OFFICIEL
                      </span>
                    </div>

                    <div className="space-y-1.5 my-auto">
                      <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600">
                        {contract.label}
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-slate-100 rounded" />
                        <div className="h-1.5 w-4/5 bg-slate-100 rounded" />
                        <div className="h-1.5 w-2/3 bg-slate-100 rounded" />
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                      <span>Articles & Clauses</span>
                      <span className="text-blue-600 font-bold">Ouvrir</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. RANGÉE LETTRES ADMINISTRATIVES (Catalogue réel RDC) */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Lettres Administratives</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {realLetters.map(([id, label, kind, objet]) => (
                  <div
                    key={id}
                    onClick={() => handleOpenModelById("lettre_motivation", "administratif")}
                    className="flex-shrink-0 w-48 sm:w-52 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between select-none transition-all group min-h-[220px]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <FileText className="w-4 h-4 text-slate-700" />
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {kind === "p" ? "Particulier" : "Officiel"}
                      </span>
                    </div>

                    <div className="my-auto space-y-1.5">
                      <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600">
                        {label}
                      </div>
                      <div className="text-[9px] text-slate-500 italic line-clamp-2">
                        Objet : {objet}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Kinshasa, RDC</span>
                      <span className="text-blue-600 font-bold">Rédiger</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. RANGÉE CERTIFICATS, ATTESTATIONS & BREVETS */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Certificats, Attestations & Brevets</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {CERTIFICATE_MODELS.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => handleOpenModelById("certificat_reussite", "autres")}
                    className="flex-shrink-0 w-48 sm:w-52 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between select-none transition-all group min-h-[220px]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <Stamp className="w-4 h-4 text-amber-600" />
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {cert.type}
                      </span>
                    </div>

                    <div className="my-auto text-center space-y-1">
                      <div className="text-xs font-bold text-slate-900 leading-snug group-hover:text-amber-700">
                        {cert.title}
                      </div>
                      <div className="text-[9px] text-slate-500 leading-tight">{cert.sub}</div>
                      <div className={`mx-auto mt-1.5 w-6 h-6 rounded-full border-2 ${cert.seal} flex items-center justify-center text-[7px] font-bold`}>
                        ★
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Sceau officiel</span>
                      <span className="text-amber-700 font-bold">Délivrer</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. RANGÉE BUSINESS PLANS & PROJETS */}
            <div>
              <div className="flex items-center justify-between mb-1 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Business Plans & Projets</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {businessPlans.map((bp) => (
                  <div
                    key={bp.id}
                    onClick={() => handleOpenModelById("business_plan_pro", "juridique")}
                    className="flex-shrink-0 w-48 sm:w-52 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between select-none transition-all group min-h-[220px]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <FolderOpen className="w-4 h-4 text-emerald-700" />
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        FINANCE
                      </span>
                    </div>

                    <div className="my-auto space-y-1">
                      <div className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-700">
                        {bp.label}
                      </div>
                      <div className="text-[9px] text-slate-500">Étude de marché & Bilan financier 3 ans</div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Chiffrage USD</span>
                      <span className="text-emerald-700 font-bold">Ouvrir</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* AFFICHAGE DES RÉSULTATS DE RECHERCHE */}
        {isSearching && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700">
              Résultats pour « {searchQuery} » ({filteredModels.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {filteredModels.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModelForModal(m)}
                  className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[170px] group"
                >
                  <div>
                    <span className="text-[8px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                      {m.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-2 group-hover:text-blue-600">
                      {m.title}
                    </h4>
                  </div>
                  <p className="text-[9px] text-slate-500 line-clamp-2">{m.subtitle}</p>
                  <div className="pt-1.5 border-t border-slate-100 text-right">
                    <span className="text-[9px] font-bold text-blue-600">Choisir ➔</span>
                  </div>
                </div>
              ))}
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
