import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  FileText, 
  GraduationCap, 
  Briefcase, 
  Palette, 
  Mail, 
  Scale, 
  FolderClock, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  X,
  SlidersHorizontal,
  Bookmark,
  Share2,
  Download,
  Trash2,
  Clock,
  CheckCircle2
} from "lucide-react";
import { 
  CATEGORIES_CONFIG, 
  ALL_TEMPLATES, 
  DocumentTemplate, 
  TemplateCategory 
} from "./templates-data";
import { TemplateViewerModal } from "./TemplateViewerModal";
import { 
  getCreations, 
  deleteCreation, 
  toggleFavoriteCreation, 
  SavedCreation 
} from "@/lib/storage-creations";

interface RedactionHubProps {
  onOpenBlankDoc: () => void;
  onSelectTemplate: (template: DocumentTemplate) => void;
  onOpenGraphicEditor?: (template: DocumentTemplate) => void;
  onBackToHome?: () => void;
}

export const RedactionHub: React.FC<RedactionHubProps> = ({
  onOpenBlankDoc,
  onSelectTemplate,
  onOpenGraphicEditor,
  onBackToHome
}) => {
  // Recherche et navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("RDC");
  
  // Modale d'aperçu
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  // Filtre "Mes créations"
  const [creationsFilter, setCreationsFilter] = useState<"all" | "draft" | "finished" | "favorite">("all");
  const [userCreations, setUserCreations] = useState<SavedCreation[]>(() => getCreations());

  // Rafraîchir les créations
  const refreshCreations = () => {
    setUserCreations(getCreations());
  };

  // Filtrage intelligent des modèles selon recherche et catégorie
  const filteredTemplates = useMemo(() => {
    let list = ALL_TEMPLATES;

    // Filtre par texte de recherche
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.badge?.toLowerCase().includes(q)
      );
    }

    // Filtre par catégorie
    if (activeCategory !== "all" && activeCategory !== "creations") {
      list = list.filter(t => t.category === activeCategory);
    }

    // Filtre juridiction pour les documents juridiques
    if (activeCategory === "legal" && selectedJurisdiction) {
      list = list.filter(t => !t.jurisdiction || t.jurisdiction === selectedJurisdiction);
    }

    return list;
  }, [searchQuery, activeCategory, selectedJurisdiction]);

  // Modèles par catégorie pour l'affichage en rangées
  const academicTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "academic"), []);
  const cvTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "cv"), []);
  const posterTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "poster"), []);
  const flyerTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "flyer"), []);
  const invitationTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "invitation"), []);
  const legalTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "legal"), []);
  const administrativeTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "administrative"), []);
  const otherTemplates = useMemo(() => 
    ALL_TEMPLATES.filter(t => t.category === "other"), []);

  // Filtrage des créations enregistrées
  const filteredCreations = useMemo(() => {
    if (creationsFilter === "favorite") {
      return userCreations.filter(c => c.isFavorite);
    }
    if (creationsFilter === "draft") {
      return userCreations.filter(c => c.status === "draft");
    }
    if (creationsFilter === "finished") {
      return userCreations.filter(c => c.status === "finished");
    }
    return userCreations;
  }, [userCreations, creationsFilter]);

  // Action de sélection d'un modèle (graphique vs textuel)
  const handleTemplateAction = (template: DocumentTemplate) => {
    if (["poster", "flyer", "invitation"].includes(template.category) && onOpenGraphicEditor) {
      onOpenGraphicEditor(template);
    } else {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ========================================================
          EN-TÊTE SUPÉRIEUR & BARRE DE RECHERCHE PRINCIPALE
          ======================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Retour"
                  aria-label="Retour à l'accueil"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                    Centre de Rédaction
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 tracking-wider">
                    BERSA
                  </span>
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Créez vos documents académiques, administratifs, CV, affiches et invitations assistés par IA
                </p>
              </div>
            </div>

            {/* Bouton rapide Page Blanche */}
            <button
              type="button"
              onClick={onOpenBlankDoc}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="font-semibold">Page blanche</span>
            </button>
          </div>

          {/* Barre de recherche avec placeholder exact du prompt maître */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un document, un modèle, un CV, une affiche, une lettre..."
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Onglets horizontaux de navigation par catégories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES_CONFIG.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (cat.id === "creations") refreshCreations();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{cat.title}</span>
                  {cat.id === "creations" && userCreations.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700 font-bold"
                    }`}>
                      {userCreations.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ========================================================
            VUE 1 : RÉSULTATS DE RECHERCHE OU CATÉGORIE UNIQUE
            ======================================================== */}
        {searchQuery.trim().length > 0 || (activeCategory !== "all" && activeCategory !== "creations") ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {searchQuery.trim().length > 0 
                    ? `Résultats pour « ${searchQuery} » (${filteredTemplates.length})` 
                    : CATEGORIES_CONFIG.find(c => c.id === activeCategory)?.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {searchQuery.trim().length > 0 
                    ? "Modèles trouvés à travers toutes les catégories" 
                    : CATEGORIES_CONFIG.find(c => c.id === activeCategory)?.description}
                </p>
              </div>

              {/* Filtre Juridiction RDC / France si catégorie juridique */}
              {activeCategory === "legal" && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
                  <span className="text-[11px] text-slate-400 px-2 font-medium">Juridiction :</span>
                  {["RDC", "France", "Belgique"].map((jur) => (
                    <button
                      key={jur}
                      type="button"
                      onClick={() => setSelectedJurisdiction(jur)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        selectedJurisdiction === jur
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {jur}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grille responsive : 1 col mobile, 2 col tablette, 3 col ordinateur */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateGridCard
                    key={template.id}
                    template={template}
                    onPreview={() => setPreviewTemplate(template)}
                    onUse={() => handleTemplateAction(template)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">Aucun modèle ne correspond à votre recherche</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Essayez un autre mot-clé ou commencez directement depuis une page blanche.
                </p>
                <button
                  type="button"
                  onClick={onOpenBlankDoc}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Ouvrir une page blanche
                </button>
              </div>
            )}
          </div>
        ) : activeCategory === "creations" ? (
          /* ========================================================
             VUE 2 : ESPACE « MES CRÉATIONS » (Partie VIII du prompt)
             ======================================================== */
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mes créations</h2>
                <p className="text-xs text-slate-500">
                  Retrouvez vos documents générés, brouillons et projets en cours
                </p>
              </div>

              {/* Sous-filtres : Tout, Brouillons, Terminés, Favoris */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs self-start sm:self-auto">
                {[
                  { id: "all", label: "Tous" },
                  { id: "draft", label: "Brouillons" },
                  { id: "finished", label: "Terminés" },
                  { id: "favorite", label: "Favoris" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCreationsFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      creationsFilter === f.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredCreations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCreations.map((creation) => (
                  <CreationCard
                    key={creation.id}
                    creation={creation}
                    onOpen={() => {
                      // Ouverture dans l'éditeur approprié
                    }}
                    onToggleFavorite={() => {
                      toggleFavoriteCreation(creation.id);
                      refreshCreations();
                    }}
                    onDelete={() => {
                      if (confirm("Supprimer définitivement ce document ?")) {
                        deleteCreation(creation.id);
                        refreshCreations();
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <FolderClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">Aucun document dans cet espace</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Vos documents rédigés et exportés apparaîtront automatiquement ici pour que vous puissiez les reprendre à tout moment.
                </p>
                <button
                  type="button"
                  onClick={onOpenBlankDoc}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Créer un document
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================
             VUE 3 : TABLEAU DE BORD STANDARD (Prompt Maître Partie I & II)
             ======================================================== */
          <div className="space-y-10">
            {/* ------------------------------------------------------
                SECTION SUPÉRIEURE : LES DEUX GRANDS PANNEAUX PHARES
                (Partie I - Articles 4 & 5 du prompt maître)
                ------------------------------------------------------ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* PANNEAU 1 : PAGE BLANCHE */}
              <div 
                onClick={onOpenBlankDoc}
                className="group relative bg-white hover:bg-blue-50/40 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-500 p-5 sm:p-6 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-16 bg-slate-100 border border-slate-300 rounded shadow-xs flex items-center justify-center group-hover:scale-105 group-hover:shadow transition-transform">
                    <Plus className="w-6 h-6 text-blue-600 stroke-[2.5]" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Éditeur Word A4
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Page blanche
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Commencez votre document librement sur feuille A4 rigide avec tous les outils WPS/Word et l'assistance IA intégrée.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  Ouvrir la page blanche <ChevronRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>

              {/* PANNEAU 2 : DOCUMENTS PERSONNALISÉS (ACADÉMIQUE / RECHERCHE) */}
              <div 
                onClick={() => setActiveCategory("academic")}
                className="group relative bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-5 sm:p-6 text-white transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-300/30">
                    Formulaires intelligents
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                    Documents personnalisés
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Rédigez : Mémoire, Thèse, Article scientifique, Ebook / Livre, Projet de recherche et Rapports d'activité.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-amber-300 font-medium">
                  <span>19 modèles académiques & pros</span>
                  <span className="flex items-center font-semibold group-hover:translate-x-1 transition-transform">
                    Explorer <ChevronRight className="w-4 h-4 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
            {/* ------------------------------------------------------
                RANGÉE 1 : DOCUMENTS PERSONNALISÉS & ACADÉMIQUES
                (19 modèles - Article 5 du prompt maître)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="Documents académiques & scientifiques"
              subtitle="Mémoires, thèses, articles de recherche, dissertations et livres avec plan automatisé"
              templates={academicTemplates}
              onSeeAll={() => setActiveCategory("academic")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />

            {/* ------------------------------------------------------
                RANGÉE 2 : CV PROFESSIONNELS (Article 6 du prompt maître)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="CV professionnels & académiques"
              subtitle="Modèles sobres, modernes, exécutifs et avec portfolio graphique intégrés"
              templates={cvTemplates}
              onSeeAll={() => setActiveCategory("cv")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />

            {/* ------------------------------------------------------
                RANGÉE 3 : AFFICHES & COMMUNICATION VISUELLE (Article 7)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="Affiches et communication visuelle"
              subtitle="Événements, conférences, formations et campagnes publicitaires personnalisables"
              templates={posterTemplates}
              onSeeAll={() => setActiveCategory("poster")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />

            {/* ------------------------------------------------------
                RANGÉE 4 : FLYERS, DÉPLIANTS & BROCHURES (Article 8)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="Flyers et supports de communication"
              subtitle="Dépliants 2 et 3 volets, prospectus commerciaux et programmes d'activité"
              templates={flyerTemplates}
              onSeeAll={() => setActiveCategory("flyer")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />

            {/* ------------------------------------------------------
                RANGÉE 5 : INVITATIONS & CÉRÉMONIES (Article 9)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="Invitations et cérémonies"
              subtitle="Mariages, soutenances académiques, remises de certificats et invitations officielles"
              templates={invitationTemplates}
              onSeeAll={() => setActiveCategory("invitation")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />

            {/* ------------------------------------------------------
                RANGÉE 6 : DOCUMENTS JURIDIQUES (Article 10)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="Documents juridiques vérifiés"
              subtitle="Contrats, statuts, requêtes et conventions adaptés aux droits RDC, français et belge"
              templates={legalTemplates}
              onSeeAll={() => setActiveCategory("legal")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />

            {/* ------------------------------------------------------
                RANGÉE 7 : CORRESPONDANCES ADMINISTRATIVES (Article 11)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="Correspondances administratives"
              subtitle="Lettres de motivation, demandes d'emploi, notes de service et procès-verbaux"
              templates={administrativeTemplates}
              onSeeAll={() => setActiveCategory("administrative")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />

            {/* ------------------------------------------------------
                RANGÉE 8 : AUTRES CRÉATIONS & SUPPORTS (Article 12)
                ------------------------------------------------------ */}
            <HorizontalGallerySection
              title="Autres modèles & créations"
              subtitle="Certificats, diplômes, fiches pédagogiques et présentations professionnelles"
              templates={otherTemplates}
              onSeeAll={() => setActiveCategory("other")}
              onPreview={(t) => setPreviewTemplate(t)}
              onUse={handleTemplateAction}
            />
          </div>
        )}
      </main>

      {/* ========================================================
          MODALE D'APERÇU & ACTION DU MODÈLE SÉLECTIONNÉ
          ======================================================== */}
      {previewTemplate && (
        <TemplateViewerModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUseTemplate={(t) => {
            setPreviewTemplate(null);
            handleTemplateAction(t);
          }}
        />
      )}
    </div>
  );
};

/* ====================================================================
   COMPOSANT RANGÉE DÉFILANTE HORIZONTALE
   (Affichage 3 modèles sur grand écran, défilement fluide au doigt sur mobile)
   ==================================================================== */
interface HorizontalGalleryProps {
  title: string;
  subtitle: string;
  templates: DocumentTemplate[];
  onSeeAll: () => void;
  onPreview: (t: DocumentTemplate) => void;
  onUse: (t: DocumentTemplate) => void;
}

const HorizontalGallerySection: React.FC<HorizontalGalleryProps> = ({
  title,
  subtitle,
  templates,
  onSeeAll,
  onPreview,
  onUse
}) => {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center whitespace-nowrap pl-2"
        >
          Voir tout ({templates.length})
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* Galerie défilante horizontale */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {templates.map((template) => (
          <div
            key={template.id}
            className="w-[260px] sm:w-[300px] shrink-0 bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between group"
          >
            {/* Vignette d'aperçu stylisée */}
            <div 
              onClick={() => onPreview(template)}
              className="relative w-full h-36 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer mb-3 group-hover:opacity-95"
            >
              <div className="w-20 h-28 bg-white shadow-sm rounded-xs border border-slate-200 p-2 flex flex-col justify-between group-hover:scale-105 transition-transform">
                <div className="space-y-1">
                  <div className="h-1.5 w-10 bg-slate-300 rounded-full" />
                  <div className="h-1 w-full bg-slate-100 rounded-full" />
                  <div className="h-1 w-full bg-slate-100 rounded-full" />
                  <div className="h-1 w-3/4 bg-slate-100 rounded-full" />
                </div>
                <div className="h-1 w-8 bg-blue-300 rounded-full" />
              </div>

              {template.badge && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white">
                  {template.badge}
                </span>
              )}
            </div>

            {/* Infos du modèle */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {template.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {template.description}
              </p>
            </div>

            {/* Actions : Aperçu & Utiliser */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onPreview(template)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Aperçu
              </button>
              <button
                type="button"
                onClick={() => onUse(template)}
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                Utiliser
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ====================================================================
   CARTE POUR LA GRILLE PLEINE LARGEUR (RECHERCHE / CATÉGORIE)
   ==================================================================== */
const TemplateGridCard: React.FC<{
  template: DocumentTemplate;
  onPreview: () => void;
  onUse: () => void;
}> = ({ template, onPreview, onUse }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500 p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between group">
      <div 
        onClick={onPreview}
        className="relative w-full h-36 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer mb-3"
      >
        <div className="w-20 h-28 bg-white shadow-sm rounded-xs border border-slate-200 p-2 flex flex-col justify-between group-hover:scale-105 transition-transform">
          <div className="space-y-1">
            <div className="h-1.5 w-12 bg-slate-300 rounded-full" />
            <div className="h-1 w-full bg-slate-100 rounded-full" />
            <div className="h-1 w-full bg-slate-100 rounded-full" />
            <div className="h-1 w-2/3 bg-slate-100 rounded-full" />
          </div>
          <div className="h-1 w-8 bg-blue-400 rounded-full" />
        </div>
        {template.badge && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 text-white">
            {template.badge}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {template.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2">
          {template.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPreview}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100"
        >
          Aperçu
        </button>
        <button
          type="button"
          onClick={onUse}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
        >
          Choisir ce modèle
        </button>
      </div>
    </div>
  );
};

/* ====================================================================
   CARTE D'UN DOCUMENT DANS « MES CRÉATIONS » (Partie VIII)
   ==================================================================== */
const CreationCard: React.FC<{
  creation: SavedCreation;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}> = ({ creation, onOpen, onToggleFavorite, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
            creation.status === "finished" 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {creation.status === "finished" ? "Terminé" : "Brouillon"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`p-1 rounded-md transition-colors ${
                creation.isFavorite ? "text-amber-500" : "text-slate-300 hover:text-slate-500"
              }`}
              title={creation.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Bookmark className={`w-4 h-4 ${creation.isFavorite ? "fill-amber-500" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{creation.title}</h3>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          Modifié le {new Date(creation.updatedAt).toLocaleDateString("fr-FR")}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 uppercase font-medium">{creation.category}</span>
        <button
          type="button"
          onClick={onOpen}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Reprendre ❯
        </button>
      </div>
    </div>
  );
};
