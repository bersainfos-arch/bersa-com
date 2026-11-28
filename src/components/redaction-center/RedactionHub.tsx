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
  Briefcase,
  Layers,
  Scroll,
  Stamp,
  BookCheck,
  FileCheck2,
  FolderOpen,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type {
  ModelItem,
  GenerationFormData,
} from "@/lib/redaction-center/redaction-types";
import { ALL_MODELS } from "@/lib/redaction-center/models-data";
import { CV_TEMPLATES, PLACEHOLDER_PHOTO } from "@/lib/cv-templates";
import { DOC_TEMPLATES } from "@/lib/doc-templates";
import { RDC_LETTERS } from "@/lib/letter-catalog-rdc";
import { DocumentGenerationModal } from "./DocumentGenerationModal";

interface RedactionHubProps {
  onOpenBlank: () => void;
  onStartGeneration: (data: GenerationFormData) => void;
  onOpenGraphicEditor?: (model: ModelItem) => void;
}

// 1. Liste intégrale des 12 types de documents à rédiger
const ACADEMIC_WRITING_TYPES = [
  { id: "roman_fiction", title: "Roman / Fiction", desc: "Narration, chapitres & intrigue littéraire", icon: BookMarked, color: "bg-rose-700 text-white" },
  { id: "travail_pratique", title: "Travail pratique (TP)", desc: "Rapport d'expérimentation & analyses", icon: Layers, color: "bg-blue-600 text-white" },
  { id: "revue_litterature", title: "Revue de la littérature", desc: "Synthèse critique de l'état de l'art", icon: BookCheck, color: "bg-teal-700 text-white" },
  { id: "protocole_recherche", title: "Protocole de recherche", desc: "Méthodologie, hypothèses & démarche", icon: FileText, color: "bg-indigo-700 text-white" },
  { id: "expose_academique", title: "Exposé académique", desc: "Présentation orale & synthèse de cours", icon: Scroll, color: "bg-amber-600 text-white" },
  { id: "rapport_stage", title: "Rapport de stage", desc: "Restitution d'expérience professionnelle", icon: Briefcase, color: "bg-sky-600 text-white" },
  { id: "etude_cas", title: "Étude de cas", desc: "Diagnostic & résolution d'une situation", icon: FileSpreadsheet, color: "bg-emerald-700 text-white" },
  { id: "dissertation", title: "Dissertation", desc: "Développement argumenté & problématique", icon: PenSquare, color: "bg-purple-700 text-white" },
  { id: "memoire_fin_etudes", title: "Mémoire universitaire", desc: "Licence, Master & Ingéniorat", icon: GraduationCap, color: "bg-blue-800 text-white" },
  { id: "these_doctorat", title: "Thèse de doctorat", desc: "Recherche doctorale approfondie", icon: Award, color: "bg-slate-900 text-white" },
  { id: "article_scientifique", title: "Article scientifique", desc: "Format IMRAD pour revues indexées", icon: BookOpen, color: "bg-emerald-600 text-white" },
  { id: "ebook_livre", title: "Ebook / Livre", desc: "Mise en page éditoriale et chapitrage", icon: BookMarked, color: "bg-amber-700 text-white" },
];

// 2. Modèles de certificats, attestations & brevets officiels
const CERTIFICATE_MODELS = [
  { id: "cert_reussite", title: "Certificat de réussite", sub: "Fin de formation & session", type: "ACADÉMIQUE", sealColor: "border-amber-400 text-amber-500", bg: "bg-amber-50/70" },
  { id: "attest_stage", title: "Attestation de stage", sub: "Validation de stage en entreprise", type: "PROFESSIONNEL", sealColor: "border-blue-600 text-blue-700", bg: "bg-blue-50/70" },
  { id: "attest_service", title: "Attestation de services", sub: "Services rendus & fonctions", type: "OFFICIEL", sealColor: "border-emerald-600 text-emerald-700", bg: "bg-emerald-50/70" },
  { id: "brevet_aptitude", title: "Brevet d'aptitude", sub: "Reconnaissance de qualification", type: "MÉRITE", sealColor: "border-indigo-600 text-indigo-700", bg: "bg-indigo-50/70" },
  { id: "cert_travail", title: "Certificat de travail", sub: "Conforme au Code du travail", type: "LÉGAL", sealColor: "border-slate-700 text-slate-800", bg: "bg-slate-50/80" },
  { id: "diplome_honneur", title: "Diplôme d'honneur", sub: "Distinction & engagement", type: "PRESTIGE", sealColor: "border-amber-500 text-amber-600", bg: "bg-amber-50/90" },
];

// 3. Modèles d'affiches & communication visuelle
const POSTER_MODELS = [
  { id: "post_conf", title: "Conférence & Colloque", theme: "GRAND FORUM BERSA", date: "28 NOVEMBRE", bg: "from-blue-950 via-indigo-900 to-slate-950", tag: "ACADÉMIQUE" },
  { id: "post_form", title: "Formation & Masterclass", theme: "ATELIER PRATIQUE", date: "SESSION INTENSIVE", bg: "from-slate-950 via-blue-900 to-cyan-950", tag: "FORMATION" },
  { id: "post_recrut", title: "Recrutement & Emploi", theme: "TALENTS D'AVENIR", date: "POSTULEZ MAINTENANT", bg: "from-emerald-950 via-slate-900 to-teal-950", tag: "CARRIÈRE" },
  { id: "post_anniv", title: "Célébration & Gala", theme: "GRANDE SOIRÉE", date: "ÉVÉNEMENT SPÉCIAL", bg: "from-amber-950 via-purple-950 to-slate-950", tag: "FESTIF" },
];

// 4. Modèles d'invitations
const INVITATION_MODELS = [
  { id: "inv_mariage", title: "Mariage d'Or", type: "Mariage", date: "Célébration", bg: "from-amber-100 via-rose-50 to-amber-50", border: "border-amber-300", dark: false },
  { id: "inv_anniv", title: "Anniversaire Gala", type: "Anniversaire", date: "Jubilé", bg: "from-indigo-950 via-slate-900 to-blue-950", border: "border-blue-400/30", dark: true },
  { id: "inv_fete", title: "Fête & Réception", type: "Soirée privée", date: "Soirée", bg: "from-purple-950 via-slate-900 to-indigo-950", border: "border-purple-400/30", dark: true },
  { id: "inv_pro", title: "Conférence Prestige", type: "Officielle", date: "Inauguration", bg: "from-slate-900 via-blue-950 to-slate-900", border: "border-amber-400/40", dark: true },
];

export const RedactionHub: React.FC<RedactionHubProps> = ({
  onOpenBlank,
  onStartGeneration,
  onOpenGraphicEditor,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelForModal, setSelectedModelForModal] = useState<ModelItem | null>(null);
  const [showWritingModal, setShowWritingModal] = useState(false);

  // Filtrage des contrats juridiques et business plans réels de l'accueil
  const legalContracts = useMemo(
    () => DOC_TEMPLATES.filter((t) => t.cat === "juridique"),
    []
  );
  const businessPlans = useMemo(
    () => DOC_TEMPLATES.filter((t) => t.cat === "business"),
    []
  );

  // Modèles réels de CV Studio (avec photo et couleurs réelles)
  const realCvTemplates = useMemo(() => CV_TEMPLATES, []);

  // Modèles réels de correspondances administratives de l'accueil
  const realLetters = useMemo(() => RDC_LETTERS, []);

  // Recherche dynamique
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
      <div className="max-w-3xl mx-auto px-3 pt-3 sm:pt-4 space-y-3.5">

        {/* BARRE SUPÉRIEURE : Bouton retour ❮ + Moteur de recherche */}
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

        {/* MODAL : Sélection parmi tous les types de rédaction (12 formats) */}
        {showWritingModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <PenSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Documents à rédiger</h3>
                    <p className="text-[11px] text-slate-500">Sélectionnez le format pour démarrer la rédaction</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWritingModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACADEMIC_WRITING_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setShowWritingModal(false);
                      handleOpenModelById("memoire_fin_etudes", "personnalises");
                    }}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-blue-300 transition-all text-left shadow-sm group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                      <t.icon className="w-4 h-4" />
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

        {/* RANG 1 : DEUX PANNEAUX (Nouveau document tout blanc & Rédiger) */}
        {!isSearching && (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Panneau 1 : Nouveau document tout blanc avec feuille A4 complète */}
            <div
              onClick={onOpenBlank}
              className="group bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all aspect-[4/3]"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 leading-tight truncate">
                  + Créer un nouveau document
                </h2>
              </div>

              {/* Rendu fidèle d'une feuille A4 blanche remplie qui occupe tout le panneau */}
              <div className="flex-1 mt-1.5 bg-white border border-slate-200 rounded-md shadow-inner p-2 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1">
                  <div className="h-1.5 w-1/3 bg-blue-900 rounded-sm" />
                  <div className="h-2 w-3/4 bg-slate-800 rounded-sm mt-1" />
                  <div className="space-y-0.5 pt-0.5">
                    <div className="h-1 w-full bg-slate-200 rounded-sm" />
                    <div className="h-1 w-full bg-slate-200 rounded-sm" />
                    <div className="h-1 w-5/6 bg-slate-200 rounded-sm" />
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <div className="h-1 w-full bg-slate-200 rounded-sm" />
                    <div className="h-1 w-4/5 bg-slate-200 rounded-sm" />
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-400 font-mono">
                  <span>A4</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Panneau 2 : Rédiger — ouvre les 12 formats demandés */}
            <div
              onClick={() => setShowWritingModal(true)}
              className="group bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-sm hover:shadow-md hover:border-blue-500/50 cursor-pointer flex flex-col justify-between transition-all aspect-[4/3]"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <PenSquare className="w-4 h-4 text-blue-600" />
                    <h2 className="text-xs font-bold text-slate-900">Rédiger</h2>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold group-hover:underline">Voir tout</span>
                </div>

                <div className="space-y-1">
                  {ACADEMIC_WRITING_TYPES.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700 bg-slate-50"
                    >
                      <item.icon className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-blue-600">
                <span className="truncate">Roman, TP, Stage, Thèse...</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0 ml-1" />
              </div>
            </div>
          </div>
        )}

        {/* TOUTES LES RANGÉES EN PANNEAUX DE MÊME DIMENSION AVEC DÉFILEMENT DROIT */}
        {!isSearching && (
          <div className="space-y-4 pt-1">

            {/* 1. RANGÉE CV PROFESSIONNELS (Vrais modèles de CV Studio) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">CV Professionnels</h3>
                <button
                  onClick={() => navigate({ to: "/cv-studio" })}
                  className="text-[11px] font-semibold text-blue-600"
                >
                  Ouvrir CV Studio ➔
                </button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {realCvTemplates.map((cv) => (
                  <div
                    key={cv.id}
                    onClick={() => navigate({ to: "/cv-studio" })}
                    className="flex-shrink-0 w-44 sm:w-48 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] select-none transition-all group"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                      <img
                        src={cv.defaultPhoto || PLACEHOLDER_PHOTO}
                        alt={cv.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-300 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-slate-900 truncate group-hover:text-blue-600">
                          {cv.name}
                        </div>
                        <div className="text-[8px] text-slate-400 truncate">{cv.category}</div>
                      </div>
                    </div>

                    <div className="space-y-1 my-auto">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cv.primary }}
                        />
                        <div className="h-1 w-3/4 bg-slate-200 rounded" />
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded" />
                      <div className="h-1 w-5/6 bg-slate-100 rounded" />
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] font-semibold text-slate-500">
                      <span className="truncate">{cv.layout}</span>
                      <span className="text-blue-600 font-bold">Utiliser</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. RANGÉE CONTRATS & ACTES JURIDIQUES (Modèles réels de l'accueil) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Contrats & Actes juridiques</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {legalContracts.map((contract) => (
                  <div
                    key={contract.id}
                    onClick={() => handleOpenModelById("contrat_prestation", "juridique")}
                    className="flex-shrink-0 w-44 sm:w-48 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] select-none transition-all group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <Scale className="w-3.5 h-3.5 text-blue-700" />
                      <span className="text-[7px] font-bold uppercase px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        OFFICIEL
                      </span>
                    </div>

                    <div className="space-y-1 my-auto">
                      <div className="text-[10px] font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-blue-600">
                        {contract.label}
                      </div>
                      <div className="space-y-0.5">
                        <div className="h-1 w-full bg-slate-100 rounded" />
                        <div className="h-1 w-4/5 bg-slate-100 rounded" />
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500">
                      <span>Articles & Clauses</span>
                      <span className="text-blue-600 font-bold">Ouvrir</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. RANGÉE LETTRES ADMINISTRATIVES (Catalogue réel de l'accueil) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Lettres Administratives</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {realLetters.map(([id, label, kind, objet]) => (
                  <div
                    key={id}
                    onClick={() => handleOpenModelById("lettre_motivation", "administratif")}
                    className="flex-shrink-0 w-44 sm:w-48 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] select-none transition-all group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <FileText className="w-3.5 h-3.5 text-slate-700" />
                      <span className="text-[7px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-700">
                        {kind === "p" ? "Particulier" : "Officiel"}
                      </span>
                    </div>

                    <div className="my-auto space-y-1">
                      <div className="text-[10px] font-bold text-slate-900 leading-tight truncate group-hover:text-blue-600">
                        {label}
                      </div>
                      <div className="text-[8px] text-slate-500 italic line-clamp-2">
                        Objet : {objet}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500">
                      <span>Kinshasa, RDC</span>
                      <span className="text-blue-600 font-bold">Rédiger</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. RANGÉE CERTIFICATS, ATTESTATIONS & BREVETS */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Certificats, Attestations & Brevets</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {CERTIFICATE_MODELS.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => handleOpenModelById("certificat_reussite", "autres")}
                    className="flex-shrink-0 w-44 sm:w-48 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] select-none transition-all group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <Stamp className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[7px] font-bold uppercase px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {cert.type}
                      </span>
                    </div>

                    <div className="my-auto text-center space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-900 leading-tight group-hover:text-amber-700">
                        {cert.title}
                      </div>
                      <div className="text-[8px] text-slate-500 leading-tight">{cert.sub}</div>
                      <div className={`mx-auto mt-1 w-5 h-5 rounded-full border-2 ${cert.sealColor} flex items-center justify-center text-[6px] font-bold`}>
                        ★
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500">
                      <span>Sceau officiel</span>
                      <span className="text-amber-700 font-bold">Délivrer</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. RANGÉE BUSINESS PLANS (Modèles réels de l'accueil) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Business Plans & Projets</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x scrollbar-none">
                {businessPlans.map((bp) => (
                  <div
                    key={bp.id}
                    onClick={() => handleOpenModelById("business_plan_pro", "juridique")}
                    className="flex-shrink-0 w-44 sm:w-48 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer snap-start flex flex-col justify-between aspect-[4/3] select-none transition-all group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-[7px] font-bold uppercase px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        FINANCE
                      </span>
                    </div>

                    <div className="my-auto space-y-1">
                      <div className="text-[10px] font-bold text-slate-900 leading-tight group-hover:text-emerald-700">
                        {bp.label}
                      </div>
                      <div className="text-[8px] text-slate-500">Étude de marché & Bilan 3 ans</div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500">
                      <span>Chiffrage USD</span>
                      <span className="text-emerald-700 font-bold">Ouvrir</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. RANGÉE AFFICHES & FLYERS */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Affiches & Communication Visuelle</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
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

            {/* 7. RANGÉE INVITATIONS ÉVÉNEMENTS */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Invitations Événements</h3>
                <span className="text-[10px] text-slate-400">Glisser vers la droite ➔</span>
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

          </div>
        )}

        {/* AFFICHAGE DES RÉSULTATS DE RECHERCHE */}
        {isSearching && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700">
              Résultats pour « {searchQuery} » ({filteredModels.length})
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {filteredModels.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModelForModal(m)}
                  className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between aspect-[4/3] group"
                >
                  <div>
                    <span className="text-[8px] font-bold text-blue-600 uppercase bg-blue-50 px-1 py-0.5 rounded">
                      {m.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2 group-hover:text-blue-600">
                      {m.title}
                    </h4>
                  </div>
                  <p className="text-[9px] text-slate-500 line-clamp-2">{m.subtitle}</p>
                  <div className="pt-1 border-t border-slate-100 text-right">
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
