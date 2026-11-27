import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  Settings2,
  ChevronRight,
  AlertCircle,
  X,
  FileUp,
  Sliders,
  AlignLeft,
  GraduationCap,
  Globe,
  Compass,
} from "lucide-react";
import type { RedactionDocumentTemplate } from "@/types/redaction-hub";
import { saveUserCreation } from "@/lib/storage-creations";

interface DocumentGenerationFormProps {
  template: RedactionDocumentTemplate;
  onBack: () => void;
  onOpenInEditor: (content: string, title: string) => void;
}

export type AcademicLevel =
  | "secondaire"
  | "graduat_licence"
  | "master"
  | "doctorat"
  | "professionnel"
  | "autre";

export type WordLengthOption = "3000" | "7000" | "15000" | "30000" | "custom";

export interface FormState {
  subject: string;
  academicLevel: AcademicLevel;
  language: string;
  lengthOption: WordLengthOption;
  customPages: number;
  instructions: string;
  targetAudience: string;
  referenceAuthors: string;
  includePlanValidation: boolean;
  attachedFileName?: string;
  attachedFileContent?: string;
}

export const DocumentGenerationForm: React.FC<DocumentGenerationFormProps> = ({
  template,
  onBack,
  onOpenInEditor,
}) => {
  // Étape courante : 1 = Projet & Sujet, 2 = Paramètres & Longueur, 3 = Consignes & Pièces, 4 = Génération
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [form, setForm] = useState<FormState>({
    subject: "",
    academicLevel: "graduat_licence",
    language: "Français",
    lengthOption: "7000",
    customPages: 10,
    instructions: "",
    targetAudience: "",
    referenceAuthors: "",
    includePlanValidation: true,
  });

  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPhaseLabel, setCurrentPhaseLabel] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<string[]>([]);
  const [planApproved, setPlanApproved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAcademic =
    template.category === "memoires_theses" ||
    template.category === "rapports_stages" ||
    template.category === "projets_academiques" ||
    template.id.includes("tfc") ||
    template.id.includes("memoire") ||
    template.id.includes("these");

  const isLongDocument =
    isAcademic ||
    template.category === "livres_ebooks" ||
    template.category === "discours_exposes";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Le fichier dépasse la limite maximale de 15 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        attachedFileName: file.name,
        attachedFileContent: typeof reader.result === "string" ? reader.result : "",
      }));
      setErrorMessage(null);
    };
    reader.readAsText(file);
  };

  const validateStep1 = () => {
    if (!form.subject.trim()) {
      setErrorMessage("Veuillez renseigner le sujet ou l'objet de votre document.");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleNextFromStep2 = () => {
    setCurrentStep(3);
  };

  const startGenerationFlow = async () => {
    setIsGenerating(true);
    setCurrentStep(4);
    setGenerationProgress(5);
    setCurrentPhaseLabel("Analyse approfondie du sujet et des consignes...");

    try {
      // Étape 1 : Plan
      await new Promise((r) => setTimeout(r, 1200));
      setGenerationProgress(25);
      setCurrentPhaseLabel("Élaboration de la structure et du plan détaillé...");

      const demoPlan = [
        "Introduction générale et contextualisation",
        "Chapitre 1 : Cadre théorique et revue de la littérature",
        "Chapitre 2 : Méthodologie et approche analytique",
        "Chapitre 3 : Présentation des résultats et discussions",
        "Conclusion générale et recommandations stratégiques",
      ];
      setGeneratedPlan(demoPlan);

      if (form.includePlanValidation && !planApproved) {
        // Pause pour validation du plan par l'utilisateur
        setIsGenerating(false);
        setGenerationProgress(35);
        setCurrentPhaseLabel("Plan prêt pour validation.");
        return;
      }

      await completeGenerationProcess();
    } catch {
      setErrorMessage("Une interruption est survenue lors de la rédaction. Veuillez réessayer.");
      setIsGenerating(false);
    }
  };

  const completeGenerationProcess = async () => {
    setIsGenerating(true);
    setGenerationProgress(45);
    setCurrentPhaseLabel("Rédaction de l'introduction et de la problématique...");
    await new Promise((r) => setTimeout(r, 1500));

    setGenerationProgress(70);
    setCurrentPhaseLabel("Développement des chapitres et articulation des arguments...");
    await new Promise((r) => setTimeout(r, 1800));

    setGenerationProgress(90);
    setCurrentPhaseLabel("Harmonisation du style, conclusion et références...");
    await new Promise((r) => setTimeout(r, 1200));

    setGenerationProgress(100);
    setCurrentPhaseLabel("Assemblage terminé. Transfert vers l'atelier Word A4...");

    const finalHtml = buildDocumentHtmlContent(template, form, generatedPlan);

    // Sauvegarde automatique dans "Mes créations"
    saveUserCreation({
      id: `doc-${Date.now()}`,
      title: form.subject || template.title,
      templateId: template.id,
      category: template.category,
      wordCount: form.lengthOption === "custom" ? form.customPages * 300 : parseInt(form.lengthOption, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "completed",
      isFavorite: false,
      contentHtml: finalHtml,
    });

    await new Promise((r) => setTimeout(r, 600));
    onOpenInEditor(finalHtml, form.subject || template.title);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Barre supérieure BERSA */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-[#1E3A8A] hover:text-[#172554] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#F1F5F9]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au catalogue</span>
          </button>

          <div className="text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#1E3A8A] block">
              {template.categoryTitle}
            </span>
            <h1 className="text-sm font-bold text-[#0F172A] truncate max-w-[200px] sm:max-w-md">
              {template.title}
            </h1>
          </div>

          <div className="w-20 flex justify-end">
            <span className="text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
              Étape {currentStep} / 4
            </span>
          </div>
        </div>
      </header>

      {/* Corps du formulaire */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* En-tête descriptif */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>Centre de Rédaction Assistée BERSA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F172A] tracking-tight">
            Décrivez votre projet
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-lg mx-auto">
            Plus vous êtes précis, meilleur sera le résultat rédigé et mis en page.
          </p>
        </div>

        {/* Indicateur d'étapes visuel */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { num: 1, label: "Sujet" },
            { num: 2, label: "Paramètres" },
            { num: 3, label: "Consignes" },
            { num: 4, label: "Rédaction" },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                currentStep === s.num
                  ? "bg-white border-[#1E3A8A] shadow-sm ring-1 ring-[#1E3A8A]/20"
                  : currentStep > s.num
                  ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E3A8A]"
                  : "bg-white/60 border-[#E2E8F0] text-[#94A3B8]"
              }`}
            >
              <span className="text-xs font-bold">{s.num}. {s.label}</span>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-[#FEE2E2] rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

                {/* CONTENU DE L'ÉTAPE 1 : Sujet & Niveau académique */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-2">
                Quel est le sujet ou l'objet de votre document ? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Ex. : L'impact de l'intelligence artificielle sur les méthodes d'enseignement dans l'enseignement supérieur en RDC..."
                rows={4}
                className="w-full rounded-xl border border-[#CBD5E1] p-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 outline-none transition-all leading-relaxed"
              />
              <p className="text-[11px] text-[#64748B] mt-1.5">
                Indiquez clairement votre thématique, la problématique ou le titre précis de votre travail.
              </p>
            </div>

            {/* Niveau académique si pertinent */}
            {isAcademic && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>Niveau académique ou professionnel</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "secondaire", label: "Secondaire / Humanités" },
                    { id: "graduat_licence", label: "Graduat / Licence (Bac+3/5)" },
                    { id: "master", label: "Master / Maîtrise" },
                    { id: "doctorat", label: "Doctorat / Thèse" },
                    { id: "professionnel", label: "Cadre Professionnel" },
                    { id: "autre", label: "Autre niveau" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setForm({ ...form, academicLevel: lvl.id as AcademicLevel })}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        form.academicLevel === lvl.id
                          ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm"
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Choix de la langue */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>Langue de rédaction</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {["Français", "Anglais", "Espagnol", "Portugais", "Autre langue"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setForm({ ...form, language: lang })}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      form.language === lang
                        ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                        : "bg-[#F8FAFC] border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton Suivant */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Continuer vers les paramètres</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENU DE L'ÉTAPE 2 : Paramètres & Longueur */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Longueur estimée et profondeur du document</span>
              </label>

              {isLongDocument ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "3000", label: "Format Synthétique", words: "Environ 3 000 mots", desc: "Idéal pour article court, travail pratique ou synthèse." },
                    { id: "7000", label: "Format Moyen", words: "Environ 7 000 mots", desc: "Recommandé pour rapport de stage, TFC ou projet de recherche." },
                    { id: "15000", label: "Format Approfondi", words: "Environ 15 000 mots", desc: "Idéal pour mémoire complet de fin d'études ou monographie." },
                    { id: "30000", label: "Format Magistral", words: "Environ 30 000 mots ou plus", desc: "Thèse doctorale, traité ou livre complet." },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm({ ...form, lengthOption: opt.id as WordLengthOption })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        form.lengthOption === opt.id
                          ? "bg-[#EFF6FF] border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20"
                          : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#0F172A]">{opt.label}</span>
                        <span className="text-[10px] font-semibold text-[#1E3A8A] bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                          {opt.words}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-xs text-[#334155] font-medium">
                    Ce type de document est calibré au format standard {template.category === "lettres_administratives" ? "de 1 à 2 pages A4 normées" : "standard professionnel"}.
                  </p>
                </div>
              )}
            </div>

            {/* Validation du plan intermédiaire */}
            <div className="p-4 rounded-xl bg-[#EFF6FF]/60 border border-[#BFDBFE] flex items-start gap-3">
              <input
                type="checkbox"
                id="planValidationCheck"
                checked={form.includePlanValidation}
                onChange={(e) => setForm({ ...form, includePlanValidation: e.target.checked })}
                className="mt-1 w-4 h-4 rounded text-[#1E3A8A] border-[#CBD5E1] focus:ring-[#1E3A8A]"
              />
              <label htmlFor="planValidationCheck" className="text-xs text-[#1E293B] cursor-pointer">
                <span className="font-bold block text-[#1E3A8A]">Générer et me faire valider le plan avant rédaction complète</span>
                Vous pourrez ajuster les titres de chapitres avant que l'Assistant ne développe l'intégralité du texte.
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-all"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-sm transition-all"
              >
                <span>Continuer vers les consignes</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENU DE L'ÉTAPE 3 : Consignes spécifiques & Fichiers */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 sm:p-7 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-2 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4" />
                <span>Consignes spécifiques et angle d'analyse</span>
              </label>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Ajoutez vos consignes particulières, les auteurs ou théories à inclure impérativement, vos exigences de style ou le plan imposé par votre encadreur..."
                rows={5}
                className="w-full rounded-xl border border-[#CBD5E1] p-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 outline-none transition-all leading-relaxed"
              />
            </div>

            {/* Importation de documents (Plan, fiche de consignes, syllabus) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-2 flex items-center gap-1.5">
                <FileUp className="w-4 h-4" />
                <span>Joindre un document de référence (Optionnel)</span>
              </label>
              <p className="text-[11px] text-[#64748B] mb-2.5">
                Vous pouvez joindre un plan existant, une grille d'évaluation ou des notes (DOCX, PDF, TXT jusqu'à 15 Mo).
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />

              {form.attachedFileName ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-[#1E3A8A]" />
                    <div>
                      <span className="text-xs font-bold text-[#0F172A] block">{form.attachedFileName}</span>
                      <span className="text-[10px] text-[#1E3A8A]">Fichier analysé prêt pour la rédaction</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, attachedFileName: undefined, attachedFileContent: undefined })}
                    className="p-1 text-[#64748B] hover:text-[#DC2626] rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#CBD5E1] hover:border-[#1E3A8A] bg-[#F8FAFC] hover:bg-[#EFF6FF]/40 rounded-xl p-5 text-center transition-all group"
                >
                  <Upload className="w-6 h-6 text-[#94A3B8] group-hover:text-[#1E3A8A] mx-auto mb-2 transition-colors" />
                  <span className="text-xs font-bold text-[#334155] block">
                    Cliquer pour importer vos consignes ou votre plan
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">Formats acceptés : DOCX, PDF, TXT</span>
                </button>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-all"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={startGenerationFlow}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] hover:from-[#172554] hover:to-[#1E3A8A] text-white text-xs font-bold tracking-wide flex items-center gap-2.5 shadow-md shadow-[#1E3A8A]/20 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#FDE047]" />
                <span>Lancer la rédaction intelligente</span>
              </button>
            </div>
          </div>
        )}

                {/* CONTENU DE L'ÉTAPE 4 : Génération en direct et validation du plan */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] mx-auto flex items-center justify-center">
                <Sparkles className={`w-6 h-6 ${isGenerating ? "animate-spin" : "text-[#1E3A8A]"}`} />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                {generationProgress === 100
                  ? "Votre document est prêt !"
                  : "Rédaction en cours..."}
              </h3>
              <p className="text-xs text-[#64748B]">{currentPhaseLabel}</p>
            </div>

            {/* Barre de progression */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E2E8F0]">
                <div
                  className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] transition-all duration-500 rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
                <span>Progression générale</span>
                <span>{generationProgress}%</span>
              </div>
            </div>

            {/* Plan proposé pour validation par l'utilisateur */}
            {generatedPlan.length > 0 && (
              <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Plan structuré du document</span>
                  </span>
                  {planApproved && (
                    <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Plan validé
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {generatedPlan.map((chap, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#1E293B] flex items-center gap-2.5 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#1E3A8A] font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{chap}</span>
                    </div>
                  ))}
                </div>

                {!planApproved && !isGenerating && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setPlanApproved(true);
                        completeGenerationProcess();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider le plan et lancer la rédaction complète</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Fonction pure générant le contenu HTML A4 normé BERSA
function buildDocumentHtmlContent(
  template: RedactionDocumentTemplate,
  form: FormState,
  plan: string[]
): string {
  const dateFormatted = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.6; color: #111827; text-align: justify;">
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1E3A8A; padding-bottom: 25px;">
        <p style="font-size: 10pt; text-transform: uppercase; letter-spacing: 2px; color: #1E3A8A; margin-bottom: 8px; font-weight: bold;">
          RÉPUBLIQUE DÉMOCRATIQUE DU CONGO<br/>ENSEIGNEMENT SUPÉRIEUR ET UNIVERSITAIRE
        </p>
        <h1 style="font-size: 20pt; font-weight: bold; margin: 20px 0 10px 0; color: #0F172A; text-transform: uppercase;">
          ${escapeHtml(form.subject || template.title)}
        </h1>
        <p style="font-size: 12pt; font-style: italic; color: #475569; margin: 0;">
          Document rédigé dans le cadre : ${escapeHtml(template.title)}
        </p>
        <p style="font-size: 11pt; color: #64748B; margin-top: 15px;">
          Date de production : ${dateFormatted}
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 15pt; font-weight: bold; color: #1E3A8A; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px; margin-top: 30px;">
          SOMMAIRE ANALYTIQUE
        </h2>
        <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
          ${plan
            .map(
              (item, idx) =>
                `<li style="border-bottom: 1px dotted #E2E8F0; padding: 4px 0; display: flex; justify-content: space-between;">
                  <span><strong>${idx + 1}.</strong> ${escapeHtml(item)}</span>
                </li>`
            )
            .join("")}
        </ul>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 15pt; font-weight: bold; color: #1E3A8A; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px; margin-top: 30px;">
          INTRODUCTION GÉNÉRALE
        </h2>
        <p style="text-indent: 30px; margin-bottom: 15px;">
          L'étude portant sur « <strong>${escapeHtml(
            form.subject
          )}</strong> » s'inscrit au cœur des questionnements contemporains de notre discipline. Dans un contexte caractérisé par des mutations technologiques et institutionnelles majeures, l'analyse approfondie de cette thématique permet d'éclairer les dynamiques fondamentales et d'apporter des réponses méthodologiques adaptées.
        </p>
        <p style="text-indent: 30px; margin-bottom: 15px;">
          ${
            form.instructions
              ? `Conformément aux orientations fixées : ${escapeHtml(form.instructions)}`
              : "Le présent travail articule rigueur conceptuelle et analyse empirique afin de formuler des perspectives critiques rigoureusement étayées."
          }
        </p>
      </div>

      ${plan
        .map(
          (title, idx) => `
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 14pt; font-weight: bold; color: #1E3A8A; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px; margin-top: 35px;">
            ${escapeHtml(title)}
          </h2>
          <p style="text-indent: 30px; margin-bottom: 15px;">
            Ce développement examine les principes directeurs et les fondements théoriques inhérents à cette section. Les éléments recueillis attestent de la nécessité de structurer les observations selon une démarche systématique et reproductible.
          </p>
          <p style="text-indent: 30px; margin-bottom: 15px;">
            L'analyse comparée des données met en lumière des corrélations significatives, contribuant à consolider le cadre d'investigation retenu.
          </p>
        </div>
      `
        )
        .join("")}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #1E3A8A;">
        <h2 style="font-size: 14pt; font-weight: bold; color: #1E3A8A; margin-bottom: 10px;">
          RÉFÉRENCES BIBLIOGRAPHIQUES
        </h2>
        <p style="margin: 5px 0; font-size: 11pt;">
          1. BERSA, <em>Guide méthodologique de la rédaction universitaire et scientifique</em>, Kinshasa, Éditions du Savoir.
        </p>
        <p style="margin: 5px 0; font-size: 11pt;">
          2. Ouvrages de référence académiques conformes aux normes APA / CAMBRIDGE en vigueur.
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
