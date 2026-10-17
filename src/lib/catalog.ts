export const WHATSAPP = "243818147637";
export const MOBILE_MONEY = { mpesa: "+243 818 147 637", airtel: "+243 971 395 319" };
export const waLink = (phone: string, text = "") =>
  `https://wa.me/${phone.replace(/[^\d]/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export type DocumentFormKind = "academic" | "cv" | "legal" | "business" | "general";

export type Service = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  desc: string;
  formKind: DocumentFormKind;
};

export const serviceGroups: { title: string; titleEn: string; items: Service[] }[] = [
  {
    title: "Recherche & Universitaire",
    titleEn: "Research & Academic",
    items: [
      { id: "memoire", name: "Mémoire universitaire", nameEn: "Master's thesis", category: "academic", desc: "Mémoire de licence, master ou TFC avec méthodologie rigoureuse.", formKind: "academic" },
      { id: "these", name: "Thèse de doctorat", nameEn: "Doctoral dissertation", category: "academic", desc: "Recherche doctorale approfondie, revue critique et analyse.", formKind: "academic" },
      { id: "article_sci", name: "Article scientifique", nameEn: "Scientific paper", category: "academic", desc: "Article de recherche aux normes internationales de publication.", formKind: "academic" },
      { id: "dissertation", name: "Dissertation académique", nameEn: "Academic essay", category: "academic", desc: "Développement argumenté avec problématique et plan détaillé.", formKind: "academic" },
      { id: "revue_lit", name: "Revue de littérature", nameEn: "Literature review", category: "academic", desc: "Synthèse critique de l'état de l'art sur un sujet donné.", formKind: "academic" },
      { id: "protocole_rech", name: "Protocole de recherche", nameEn: "Research protocol", category: "academic", desc: "Cadre méthodologique, hypothèses et échantillonnage.", formKind: "academic" },
      { id: "tp", name: "Travaux pratiques (TP)", nameEn: "Lab & practical report", category: "academic", desc: "Rapport d'expérimentation, calculs et interprétations.", formKind: "academic" },
      { id: "rapport_stage", name: "Rapport de stage / TFE", nameEn: "Internship report", category: "academic", desc: "Restitution d'expérience professionnelle et recommandations.", formKind: "academic" },
      { id: "etude_cas", name: "Étude de cas", nameEn: "Case study", category: "academic", desc: "Analyse clinique ou organisationnelle d'une situation concrète.", formKind: "academic" },
      { id: "resume_synth", name: "Résumé & Synthèse de document", nameEn: "Summary & Synthesis", category: "academic", desc: "Condensé fidèle et structuré de textes volumineux.", formKind: "academic" },
      { id: "fiche_lecture", name: "Fiche de lecture", nameEn: "Reading note", category: "academic", desc: "Analyse critique d'un ouvrage ou d'un corpus de référence.", formKind: "academic" },
      { id: "analyse_stat", name: "Rapport d'analyse statistique", nameEn: "Statistical analysis report", category: "academic", desc: "Traitement de données qualitatives et quantitatives.", formKind: "academic" },
    ],
  },
  {
    title: "Droit & Juridique",
    titleEn: "Law & Legal",
    items: [
      { id: "commentaire_arret", name: "Commentaire d’arrêt", nameEn: "Ruling commentary", category: "legal", desc: "Analyse de jurisprudence, faits, procédure et portée juridique.", formKind: "legal" },
      { id: "consultation_jur", name: "Consultation juridique", nameEn: "Legal consultation", category: "legal", desc: "Avis de droit sur une situation litigieuse ou contractuelle.", formKind: "legal" },
      { id: "statuts_ohada", name: "Statuts de société OHADA", nameEn: "OHADA bylaws", category: "legal", desc: "SARL, SA, SAS ou SASU conformes à l'Acte uniforme.", formKind: "legal" },
      { id: "contrat_type", name: "Contrat type & Convention", nameEn: "Standard contract", category: "legal", desc: "Prestation de service, bail, travail ou partenariat.", formKind: "legal" },
      { id: "requete_assign", name: "Requête & Acte de procédure", nameEn: "Legal petition", category: "legal", desc: "Projet de requête gracieuse, mémoire en défense ou saisine.", formKind: "legal" },
      { id: "procedures_conf", name: "Procédure & Règlement intérieur", nameEn: "Internal procedures & bylaws", category: "legal", desc: "Dispositions internes et conformité institutionnelle.", formKind: "legal" },
    ],
  },
  {
    title: "Carrière, Candidatures & RH",
    titleEn: "Career & HR",
    items: [
      { id: "cv_pro", name: "Curriculum Vitae (CV)", nameEn: "Curriculum Vitae", category: "career", desc: "CV professionnel adapté aux normes internationales et ATS.", formKind: "cv" },
      { id: "lettre_motiv", name: "Lettre de motivation", nameEn: "Cover letter", category: "career", desc: "Argumentaire personnalisé pour emploi, stage ou master.", formKind: "general" },
      { id: "dossier_candidature", name: "Dossier complet de candidature", nameEn: "Application package", category: "career", desc: "Ensemble coordonné : CV, projet professionnel et lettre.", formKind: "cv" },
      { id: "description_poste", name: "Fiche & Description de poste", nameEn: "Job description", category: "career", desc: "Missions, responsabilités et profil requis pour recrutement.", formKind: "general" },
      { id: "biographie", name: "Biographie professionnelle", nameEn: "Executive biography", category: "career", desc: "Portrait professionnel pour profil exécutif ou institutionnel.", formKind: "general" },
    ],
  },
  {
    title: "Administration & Gestion",
    titleEn: "Administration & Management",
    items: [
      { id: "lettre_admin", name: "Lettre administrative officielle", nameEn: "Official letter", category: "admin", desc: "Demande hiérarchique, recours ou correspondance ministérielle.", formKind: "general" },
      { id: "note_service", name: "Note de service / Circulaire", nameEn: "Internal memo", category: "admin", desc: "Instruction interne claire adressée aux collaborateurs.", formKind: "general" },
      { id: "compte_rendu", name: "Compte rendu de réunion", nameEn: "Meeting minutes", category: "admin", desc: "Synthèse fidèle des débats, décisions et points d'action.", formKind: "general" },
      { id: "proces_verbal", name: "Procès-verbal (PV)", nameEn: "Official proceedings", category: "admin", desc: "PV d'assemblée générale, conseil ou réunion solennelle.", formKind: "general" },
      { id: "rapport_activite", name: "Rapport d’activités", nameEn: "Activity report", category: "admin", desc: "Bilan périodique des réalisations, indicateurs et défis.", formKind: "general" },
      { id: "plan_action", name: "Plan d’action opérationnel", nameEn: "Action plan", category: "admin", desc: "Matrice d'objectifs, responsabilités, délais et livrables.", formKind: "general" },
      { id: "tableau_suivi", name: "Tableau de bord & Suivi", nameEn: "Monitoring dashboard", category: "admin", desc: "Indicateurs clés de performance (KPI) et jalons.", formKind: "general" },
    ],
  },
  {
    title: "Entrepreneuriat, Stratégie & Finance",
    titleEn: "Business, Strategy & Finance",
    items: [
      { id: "business_plan", name: "Plan d’affaires (Business Plan)", nameEn: "Business Plan", category: "business", desc: "Modèle économique, stratégie, prévisions et retour sur investissement.", formKind: "business" },
      { id: "etude_marche", name: "Étude de marché", nameEn: "Market study", category: "business", desc: "Analyse de la demande, concurrence et positionnement.", formKind: "business" },
      { id: "etude_faisabilite", name: "Étude de faisabilité", nameEn: "Feasibility study", category: "business", desc: "Viabilité technique, économique et juridique d'un projet.", formKind: "business" },
      { id: "dossier_finance", name: "Dossier de recherche de financement", nameEn: "Funding proposal", category: "business", desc: "Présentation bancaire ou pour investisseurs et bailleurs.", formKind: "business" },
      { id: "demande_subvention", name: "Demande de subvention", nameEn: "Grant application", category: "business", desc: "Dossier structuré pour ONG, fondations et coopérations.", formKind: "business" },
      { id: "demande_partenariat", name: "Demande de partenariat", nameEn: "Partnership request", category: "business", desc: "Proposition d'alliance stratégique et synergies mutuelles.", formKind: "general" },
      { id: "prop_commerciale", name: "Proposition commerciale (Offre)", nameEn: "Commercial proposal", category: "business", desc: "Offre de services adaptée aux besoins d'un prospect.", formKind: "business" },
      { id: "budget_prev", name: "Budget prévisionnel commenté", nameEn: "Project budget", category: "business", desc: "Structure des coûts, recettes et justification financière.", formKind: "business" },
      { id: "projet_developpement", name: "Document de projet (ProDoc)", nameEn: "Project document", category: "business", desc: "Cadre logique, théorie du changement et activités.", formKind: "business" },
    ],
  },
  {
    title: "Pédagogie, Enseignement & Édition",
    titleEn: "Pedagogy & Publishing",
    items: [
      { id: "support_pedagogique", name: "Support pédagogique & Module", nameEn: "Teaching module", category: "education", desc: "Contenu de formation structuré avec objectifs pédagogiques.", formKind: "general" },
      { id: "fiche_cours", name: "Fiche de cours synthétique", nameEn: "Course cheat sheet", category: "education", desc: "Rappel des concepts clés, définitions et illustrations.", formKind: "general" },
      { id: "guide_pratique", name: "Guide pratique & Manuel", nameEn: "Practical guide", category: "education", desc: "Mode d'emploi pas à pas avec fiches réflexes.", formKind: "general" },
      { id: "manuscrit_ouvrage", name: "Structure d’ouvrage / Livre", nameEn: "Book manuscript", category: "education", desc: "Plan de livre, chapitrage et introduction générale.", formKind: "academic" },
      { id: "questionnaire_enquete", name: "Questionnaire d’enquête", nameEn: "Survey questionnaire", category: "education", desc: "Questions ouvertes et fermées pour collecte terrain.", formKind: "general" },
      { id: "formulaire_collecte", name: "Formulaire d'évaluation", nameEn: "Evaluation form", category: "education", desc: "Grille d'évaluation des compétences ou des acquis.", formKind: "general" },
      { id: "plan_editorial", name: "Plan éditorial de publication", nameEn: "Editorial calendar & plan", category: "education", desc: "Stratégie de parution d'articles, essais ou chroniques.", formKind: "general" },
    ],
  },
  {
    title: "Communication & Événements",
    titleEn: "Communication & Events",
    items: [
      { id: "discours_officiel", name: "Discours solennel & Allocution", nameEn: "Keynote speech", category: "comm", desc: "Discours d'ouverture, de clôture ou d'inauguration.", formKind: "general" },
      { id: "expose_oral", name: "Exposé académique / Soutenance", nameEn: "Oral presentation", category: "comm", desc: "Texte d'exposé chronométré avec trame de diapositives.", formKind: "academic" },
      { id: "plan_communication", name: "Plan de communication", nameEn: "Communication plan", category: "comm", desc: "Cibles, messages clés, canaux et calendrier de diffusion.", formKind: "general" },
    ],
  },
];

export const domains = [
  { fr: "Droit", en: "Law" },
  { fr: "Économie", en: "Economics" },
  { fr: "Intelligence artificielle", en: "Artificial intelligence" },
  { fr: "Ingénierie", en: "Engineering" },
  { fr: "Santé", en: "Health" },
  { fr: "Sciences", en: "Sciences" },
];

export const courses = [
  { name: "Méthodologie de la recherche scientifique", nameEn: "Research methodology" },
  { name: "Rédaction administrative et juridique", nameEn: "Administrative & legal writing" },
  { name: "Intelligence artificielle appliquée", nameEn: "Applied artificial intelligence" },
  { name: "Création et gestion d'entreprise (OHADA)", nameEn: "Starting a business (OHADA)" },
  { name: "Bureautique et outils numériques", nameEn: "Office & digital tools" },
  { name: "Prise de parole et soutenance", nameEn: "Public speaking & defense" },
];
