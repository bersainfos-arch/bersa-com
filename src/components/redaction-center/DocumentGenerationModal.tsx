import React, { useState } from "react";
import { X, Sparkles, Upload, FileText, Check, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModelItem, GenerationFormData, AcademicLevel, DocumentLength, JurisdictionCode } from "@/lib/redaction-center/redaction-types";

interface Props {
  model: ModelItem;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: GenerationFormData) => void;
}

export const DocumentGenerationModal: React.FC<Props> = ({ model, isOpen, onClose, onGenerate }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [subject, setSubject] = useState("");
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>("graduat_licence");
  const [language, setLanguage] = useState("Français");
  const [length, setLength] = useState<DocumentLength>("court");
  const [instructions, setInstructions] = useState("");
  const [scope, setScope] = useState<"complet" | "sections">("complet");
  const [selectedSections, setSelectedSections] = useState<string[]>(
    model.sections ? model.sections.map((s) => s.id) : []
  );
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>("RDC");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; content: string }[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      setAttachedFiles((prev) => [...prev, { name: file.name, type: file.type, content }]);
    };
    reader.readAsText(file);
  };

  const handleLaunch = () => {
    if (!subject.trim()) return;
    onGenerate({
      modelId: model.id,
      category: model.category,
      title: model.title,
      subject,
      academicLevel: model.category === "personnalises" ? academicLevel : undefined,
      language,
      length,
      instructions,
      attachments: attachedFiles,
      scope,
      selectedSections: scope === "complet" ? [] : selectedSections,
      jurisdiction: model.jurisdictionAware ? jurisdiction : undefined,
    });
  };

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 uppercase tracking-wider">
                {model.badge || "Modèle BERSA"}
              </span>
              <span className="text-xs text-blue-100">Étape {step} sur 2</span>
            </div>
            <h2 className="text-xl font-bold mt-1 font-serif">{model.title}</h2>
            <p className="text-xs text-blue-100/90 mt-0.5">Plus vous êtes précis, meilleur sera le résultat.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-foreground mb-1.5">
                  Quel est le sujet ou l'objet de votre document ? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex : L'impact de la numérisation sur les procédures d'enregistrement des entreprises en RDC."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 dark:border-border p-3 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none dark:bg-background"
                />
              </div>

              {model.category === "personnalises" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-foreground mb-1.5">
                    Niveau académique
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "secondaire", label: "Secondaire" },
                      { id: "graduat_licence", label: "Graduat / Licence" },
                      { id: "master", label: "Master" },
                      { id: "doctorat", label: "Doctorat" },
                      { id: "professionnel", label: "Professionnel" },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setAcademicLevel(lvl.id as AcademicLevel)}
                        className={`py-2 px-3 text-xs rounded-xl border font-medium transition-all ${
                          academicLevel === lvl.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 dark:bg-muted text-slate-700 dark:text-foreground border-slate-200 dark:border-border hover:bg-slate-100"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {model.jurisdictionAware && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-foreground mb-1.5">
                    Pays / Juridiction applicable
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "RDC", label: "Rép. Dém. du Congo (RDC)" },
                      { id: "FR", label: "France" },
                      { id: "BE", label: "Belgique" },
                    ].map((jur) => (
                      <button
                        key={jur.id}
                        type="button"
                        onClick={() => setJurisdiction(jur.id as JurisdictionCode)}
                        className={`py-2 px-3 text-xs rounded-xl border font-medium transition-all ${
                          jurisdiction === jur.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 dark:bg-muted text-slate-700 dark:text-foreground border-slate-200 dark:border-border hover:bg-slate-100"
                        }`}
                      >
                        {jur.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-foreground mb-1.5">
                    Langue de rédaction
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-border p-2.5 text-sm dark:bg-background"
                  >
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Espagnol">Espagnol</option>
                    <option value="Portugais">Portugais</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-foreground mb-1.5">
                    Longueur souhaitée
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as DocumentLength)}
                    className="w-full rounded-xl border border-slate-300 dark:border-border p-2.5 text-sm dark:bg-background"
                  >
                    <option value="court">Court (~3 000 mots)</option>
                    <option value="moyen">Moyen (~7 000 mots)</option>
                    <option value="long">Long (~15 000 mots)</option>
                    <option value="tres_long">Très long (~30 000 mots)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-foreground mb-1.5">
                  Consignes spécifiques & exigences de l'encadreur
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ajoutez vos consignes spécifiques, l'angle d'analyse, auteurs à inclure ou éléments particuliers à respecter."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 dark:border-border p-3 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none dark:bg-background"
                />
              </div>

              {model.sections && model.sections.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 dark:text-foreground mb-1.5">
                    Périmètre de rédaction
                  </label>
                  <div className="flex gap-4 mb-3 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={scope === "complet"}
                        onChange={() => setScope("complet")}
                        className="text-blue-600"
                      />
                      <span>Document complet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={scope === "sections"}
                        onChange={() => setScope("sections")}
                        className="text-blue-600"
                      />
                      <span>Sections choisies</span>
                    </label>
                  </div>

                  {scope === "sections" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-muted p-3 rounded-xl border border-slate-200 dark:border-border">
                      {model.sections.map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => toggleSection(sec.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition-colors ${
                            selectedSections.includes(sec.id)
                              ? "bg-blue-600 text-white"
                              : "bg-white dark:bg-background text-slate-700 dark:text-foreground border border-slate-200 dark:border-border"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              selectedSections.includes(sec.id) ? "border-white bg-white/20" : "border-slate-300"
                            }`}
                          >
                            {selectedSections.includes(sec.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span>{sec.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-800 dark:text-foreground mb-1.5">
                  Fichiers de référence (plan, guide, instructions DOCX/PDF/TXT)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Ajouter un fichier</span>
                    <input type="file" accept=".docx,.pdf,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {attachedFiles.length > 0 && (
                    <span className="text-xs text-slate-600 dark:text-muted-foreground flex items-center gap-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      {attachedFiles.length} fichier(s) joint(s)
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pied d'action */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-muted/50 border-t border-slate-200 dark:border-border flex items-center justify-between">
          {step === 2 ? (
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" />
              <span>Précédent</span>
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} className="rounded-xl text-slate-500">
              Annuler
            </Button>
          )}

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!subject.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleLaunch}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Générer mon document avec BERSA AI</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
