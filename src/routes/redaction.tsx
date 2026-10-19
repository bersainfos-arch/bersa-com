import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { serviceGroups, type Service } from "@/lib/catalog";
import { Search, PenLine, Sparkles, CreditCard, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/redaction")({
  head: () => ({
    meta: [
      { title: "Rédaction & Modèles professionnels — BERSA" },
      { name: "description", content: "Plus de 50 modèles de rédaction académique, juridique, administrative et professionnelle avec l’Assistant BERSA." },
      { property: "og:title", content: "Rédaction & Modèles professionnels — BERSA" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RedactionPage,
});

function RedactionPage() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // États pour formulaires spécialisés
  const [academicForm, setAcademicForm] = useState({
    subject: "",
    country: "",
    discipline: "",
    level: "Master",
    pages: "30",
    citationStyle: "APA 7",
    outline: "",
    guidelines: "",
  });

  const [cvForm, setCvForm] = useState({
    lastName: "",
    postName: "",
    firstName: "",
    contacts: "",
    profile: "",
    education: "",
    experience: "",
    skills: "",
    languages: "Français, Anglais",
  });

  const [generalForm, setGeneralForm] = useState({
    title: "",
    context: "",
    instructions: "",
  });

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return serviceGroups;
    const q = search.toLowerCase();
    return serviceGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [search]);

  function handleStart(service: Service) {
    setSelectedService(service);
  }

  function submitRequest() {
    if (!selectedService) return;

    let finalPrompt = "";
    if (selectedService.formKind === "academic") {
      if (!academicForm.subject.trim()) {
        toast.error("Veuillez renseigner le sujet du travail.");
        return;
      }
      finalPrompt = `[PROJET DE RÉDACTION ACADÉMIQUE]\nType : ${selectedService.name}\nSujet : ${academicForm.subject}\nDiscipline : ${academicForm.discipline || "Non spécifiée"}\nNiveau d'études : ${academicForm.level}\nPays / Juridiction : ${academicForm.country || "Non spécifié"}\nLongueur cible : ~${academicForm.pages} pages\nStyle de citation : ${academicForm.citationStyle}\nPlan proposé : ${academicForm.outline || "À structurer selon les normes"}\nConsignes particulières : ${academicForm.guidelines || "Méthodologie rigoureuse, sources fiables et esprit critique."}`;
    } else if (selectedService.formKind === "cv") {
      if (!cvForm.lastName.trim() || !cvForm.firstName.trim()) {
        toast.error("Veuillez renseigner le nom et le prénom.");
        return;
      }
      finalPrompt = `[RÉDACTION DE CV PROFESSIONNEL]\nIdentité : ${cvForm.lastName} ${cvForm.postName} ${cvForm.firstName}\nContacts : ${cvForm.contacts}\nProfil visé : ${cvForm.profile}\nParcours académique : ${cvForm.education}\nExpériences professionnelles / Stages : ${cvForm.experience}\nCompétences clés : ${cvForm.skills}\nLangues : ${cvForm.languages}`;
    } else {
      if (!generalForm.title.trim()) {
        toast.error("Veuillez renseigner le titre ou l'objet du document.");
        return;
      }
      finalPrompt = `[PROJET DE RÉDACTION : ${selectedService.name}]\nObjet / Titre : ${generalForm.title}\nContexte : ${generalForm.context}\nConsignes spécifiques : ${generalForm.instructions || "Rédaction claire, formelle et conforme aux usages."}`;
    }

    sessionStorage.setItem("bersa-writing-request", finalPrompt);
    setSelectedService(null);
    toast.success("Demande enregistrée. Ouverture dans l'éditeur A4…");
    nav({ to: "/" });
  }

  return (
    <AppShell>
      <PageHeader
        title={lang === "fr" ? "Mon atelier de rédaction" : "My Writing Workshop"}
        subtitle={
          lang === "fr"
            ? "Plus de 50 modèles académiques, juridiques et professionnels prêts à être rédigés avec rigueur."
            : "Over 50 academic, legal and professional templates ready for structured writing."
        }
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Bandeau d'information sur les abonnements */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border bg-primary/5 p-4 text-sm">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Tarifs centralisés et accès tout-en-un</p>
              <p className="text-xs text-muted-foreground">
                Tous les modèles de rédaction sont accessibles via nos forfaits d'abonnement sans frais additionnels par modèle.
              </p>
            </div>
          </div>
          <Link to="/abonnements">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              Voir les forfaits <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Barre de recherche rapide */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un modèle (mémoire, CV, contrat, rapport…)"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Liste des groupes de services */}
        <div className="space-y-10">
          {filteredGroups.map((g) => (
            <section key={g.title} className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-xl font-bold text-foreground">
                  {lang === "fr" ? g.title : g.titleEn}
                </h2>
                <p className="text-xs text-muted-foreground">{g.items.length} modèles disponibles</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{s.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        Modèle BERSA
                      </span>
                      <Button size="sm" onClick={() => handleStart(s)}>
                        <PenLine className="mr-1.5 h-3.5 w-3.5" /> Rédiger
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Boîte de dialogue : Formulaire adapté */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              Fiche de rédaction : {selectedService?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedService?.formKind === "academic" && (
            <div className="space-y-3 py-2 text-sm">
              <div>
                <Label>Sujet ou titre du travail *</Label>
                <Input
                  placeholder="Ex : L'impact de l'IA sur la productivité des PME en Afrique..."
                  value={academicForm.subject}
                  onChange={(e) => setAcademicForm({ ...academicForm, subject: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Discipline</Label>
                  <Input
                    placeholder="Ex : Droit, Économie, Santé..."
                    value={academicForm.discipline}
                    onChange={(e) => setAcademicForm({ ...academicForm, discipline: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Pays ou juridiction</Label>
                  <Input
                    placeholder="Ex : RDC, France, OHADA..."
                    value={academicForm.country}
                    onChange={(e) => setAcademicForm({ ...academicForm, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Niveau</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-2 text-xs"
                    value={academicForm.level}
                    onChange={(e) => setAcademicForm({ ...academicForm, level: e.target.value })}
                  >
                    <option value="Licence">Licence / Bac+3</option>
                    <option value="Master">Master / Bac+5</option>
                    <option value="Doctorat">Doctorat / Ph.D</option>
                    <option value="Professionnel">Professionnel</option>
                  </select>
                </div>
                <div>
                  <Label>Nombre de pages</Label>
                  <Input
                    type="number"
                    value={academicForm.pages}
                    onChange={(e) => setAcademicForm({ ...academicForm, pages: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Style de citation</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-2 text-xs"
                    value={academicForm.citationStyle}
                    onChange={(e) => setAcademicForm({ ...academicForm, citationStyle: e.target.value })}
                  >
                    <option value="APA 7">APA 7</option>
                    <option value="Chicago 17">Chicago 17</option>
                    <option value="Vancouver">Vancouver</option>
                    <option value="OHADA">Juridique OHADA</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Plan indicatif (facultatif)</Label>
                <Textarea
                  placeholder="Chapitre 1 : ..., Chapitre 2 : ..."
                  className="h-16 text-xs"
                  value={academicForm.outline}
                  onChange={(e) => setAcademicForm({ ...academicForm, outline: e.target.value })}
                />
              </div>
              <div>
                <Label>Consignes méthodologiques</Label>
                <Textarea
                  placeholder="Hypothèses, auteurs obligatoires, exigences institutionnelles..."
                  className="h-16 text-xs"
                  value={academicForm.guidelines}
                  onChange={(e) => setAcademicForm({ ...academicForm, guidelines: e.target.value })}
                />
              </div>
            </div>
          )}

          {selectedService?.formKind === "cv" && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={cvForm.lastName}
                    onChange={(e) => setCvForm({ ...cvForm, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Post-nom</Label>
                  <Input
                    value={cvForm.postName}
                    onChange={(e) => setCvForm({ ...cvForm, postName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={cvForm.firstName}
                    onChange={(e) => setCvForm({ ...cvForm, firstName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Contacts (email, téléphone, ville)</Label>
                <Input
                  placeholder="contact@exemple.com · Kinshasa"
                  value={cvForm.contacts}
                  onChange={(e) => setCvForm({ ...cvForm, contacts: e.target.value })}
                />
              </div>
              <div>
                <Label>Poste visé ou profil résumé</Label>
                <Input
                  placeholder="Ex : Juriste d'entreprise senior spécialisé en droit des contrats"
                  value={cvForm.profile}
                  onChange={(e) => setCvForm({ ...cvForm, profile: e.target.value })}
                />
              </div>
              <div>
                <Label>Parcours académique & Formations</Label>
                <Textarea
                  placeholder="Diplômes, universités, années..."
                  className="h-16 text-xs"
                  value={cvForm.education}
                  onChange={(e) => setCvForm({ ...cvForm, education: e.target.value })}
                />
              </div>
              <div>
                <Label>Expériences & Stages</Label>
                <Textarea
                  placeholder="Postes occupés, entreprises, réalisations clés..."
                  className="h-16 text-xs"
                  value={cvForm.experience}
                  onChange={(e) => setCvForm({ ...cvForm, experience: e.target.value })}
                />
              </div>
              <div>
                <Label>Compétences & Langues</Label>
                <Input
                  placeholder="Ex : Rédaction d'actes, Négociation, Français, Anglais"
                  value={cvForm.skills}
                  onChange={(e) => setCvForm({ ...cvForm, skills: e.target.value })}
                />
              </div>
            </div>
          )}

          {selectedService?.formKind !== "academic" && selectedService?.formKind !== "cv" && (
            <div className="space-y-3 py-2 text-sm">
              <div>
                <Label>Titre ou objet du document *</Label>
                <Input
                  placeholder="Ex : Note de service relative aux horaires de travail..."
                  value={generalForm.title}
                  onChange={(e) => setGeneralForm({ ...generalForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Contexte & Destinataire</Label>
                <Textarea
                  placeholder="À qui s'adresse le document et dans quel cadre ?"
                  className="h-20 text-xs"
                  value={generalForm.context}
                  onChange={(e) => setGeneralForm({ ...generalForm, context: e.target.value })}
                />
              </div>
              <div>
                <Label>Consignes et points obligatoires à inclure</Label>
                <Textarea
                  placeholder="Détails importants, chiffres clés, clauses nécessaires..."
                  className="h-20 text-xs"
                  value={generalForm.instructions}
                  onChange={(e) => setGeneralForm({ ...generalForm, instructions: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedService(null)}>
              Annuler
            </Button>
            <Button onClick={submitRequest}>
              Valider et ouvrir dans l'éditeur <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
