export type CvLayout =
  | "lateral-bordeaux"
  | "bandeau-photo"
  | "lateral-couleur"
  | "lateral-gris"
  | "diagonal"
  | "bandeau-sombre"
  | "entete-arrondi"
  | "lateral-plein"
  | "elegant"
  | "arche"
  | "classique-centre"
  | "classique-filet";

export interface CvTemplate {
  id: string;
  name: string;
  category: "Modernes" | "Classiques";
  layout: CvLayout;
  primary: string;
  accent: string;
  font: string;
  premium: boolean;
  defaultPhoto?: string;
  isNew?: boolean;
}

export interface CvExperience {
  start: string;
  end: string;
  role: string;
  company: string;
  description: string;
}

export interface CvEducation {
  start: string;
  end: string;
  degree: string;
  school: string;
  grade?: string;
  description: string;
}

export interface CvLanguageItem {
  name: string;
  level: string;
  details?: string;
  percent?: number;
}

export interface CvData {
  photo: string;
  showPhoto: boolean;
  firstName: string;
  lastName: string;
  title: string;
  summary: string;
  address: string;
  email: string;
  phone: string;
  birth: string;
  birthPlace?: string;
  license: string;
  website: string;
  gender?: string;
  nationality?: string;
  civilStatus?: string;
  postalCode?: string;
  commune?: string;
  city?: string;
  skills: string[];
  languages: string[];
  languageItems?: CvLanguageItem[];
  hobbies: string[];
  experiences: CvExperience[];
  education: CvEducation[];
  cvTitle?: string;
  titleAsHeading?: boolean;
  photoShape?: "square" | "rounded" | "circle";
  extra?: Record<string, string>;
  signature?: string;
  signatureImage?: string;
  sections?: { key: string; title: string; content: string; start?: string; end?: string }[];
  customColor?: string;
  customFont?: string;
  rightColor?: string;
  fontSize?: "compact" | "normal" | "large" | "xlarge";
}

export const CV_MODEL_PHOTOS = [
  "/cv-photos/photo-1.png", // Femme : Sarah Garcia / Assistante
  "/cv-photos/photo-2.png", // Homme : Alexandre Dubois / Juriste
  "/cv-photos/photo-3.png", // Femme : Clémence Kanku / RH
  "/cv-photos/photo-4.png", // Homme : Marc Ilunga / Ingénieur
  "/cv-photos/photo-5.png", // Femme : Amina Diallo / Finance
  "/cv-photos/photo-6.png", // Homme : Patrick Tshisekedi / Logistique
];

export const CV_CATEGORIES = ["Modernes", "Classiques"] as const;

const MODERN_LAYOUTS: { layout: CvLayout; name: string }[] = [
  { layout: "lateral-bordeaux", name: "Bordeaux Studio" },
  { layout: "bandeau-photo", name: "Bandeau Moderne" },
  { layout: "lateral-couleur", name: "Corail Élite" },
  { layout: "lateral-gris", name: "Clarté Pro" },
  { layout: "diagonal", name: "Diagonale Design" },
  { layout: "bandeau-sombre", name: "Contraste Exécutif" },
  { layout: "entete-arrondi", name: "Horizon Moderne" },
  { layout: "lateral-plein", name: "Azur Affaires" },
  { layout: "elegant", name: "Élégance Carrière" },
  { layout: "arche", name: "Arche Prestige" },
];

const PALETTES: { n: string; p: string; a: string }[] = [
  { n: "Bordeaux", p: "#7a2838", a: "#7a2838" },
  { n: "Bleu Nuit", p: "#1e3a8a", a: "#1e3a8a" },
  { n: "Ardoise", p: "#374151", a: "#111827" },
  { n: "Émeraude", p: "#1b5e20", a: "#2e7d32" },
  { n: "Bleu Roi", p: "#0f4c81", a: "#0f4c81" },
  { n: "Chocolat", p: "#4a2c11", a: "#6b4423" },
  { n: "Anthracite", p: "#262626", a: "#171717" },
  { n: "Saphir", p: "#0d47a1", a: "#1565c0" },
  { n: "Rubis", p: "#881337", a: "#9f1239" },
  { n: "Océan", p: "#0e7490", a: "#0891b2" },
];

const FONTS_MODERN = ["Arial", "Calibri", "Verdana", "Trebuchet MS", "Segoe UI"];
const FONTS_CLASSIC = ["Times New Roman", "Georgia", "Garamond", "Cambria"];

const modern: CvTemplate[] = Array.from({ length: 100 }, (_, i) => {
  const L = MODERN_LAYOUTS[i % MODERN_LAYOUTS.length]!;
  const P = PALETTES[(i + Math.floor(i / MODERN_LAYOUTS.length)) % PALETTES.length]!;
  return {
    id: `cv-m-${i + 1}`,
    name: `${L.name} ${P.n}`,
    category: "Modernes",
    layout: L.layout,
    primary: P.p,
    accent: P.a,
    font: FONTS_MODERN[i % FONTS_MODERN.length]!,
    premium: i % 2 === 1,
    defaultPhoto: CV_MODEL_PHOTOS[i % CV_MODEL_PHOTOS.length]!,
  };
});

const CLASSIC_COLORS = ["#111827", "#1e3a8a", "#374151", "#7f1d3a", "#14532d", "#3f3f46"];
const classic: CvTemplate[] = Array.from({ length: 20 }, (_, i) => ({
  id: `cv-c-${i + 1}`,
  name: `Classique ${i % 2 ? "Filet" : "Centre"} ${i + 1}`,
  category: "Classiques",
  layout: i % 2 ? "classique-filet" : "classique-centre",
  primary: CLASSIC_COLORS[i % CLASSIC_COLORS.length]!,
  accent: CLASSIC_COLORS[i % CLASSIC_COLORS.length]!,
  font: FONTS_CLASSIC[i % FONTS_CLASSIC.length]!,
  premium: i >= 10,
  defaultPhoto: CV_MODEL_PHOTOS[i % CV_MODEL_PHOTOS.length]!,
}));

export const TEMPLATE_SARAH_GARCIA: CvTemplate = {
  id: "cv-sarah-garcia",
  name: "Sarah Garcia — Bordeaux Studio",
  category: "Modernes",
  layout: "lateral-bordeaux",
  primary: "#7a2838",
  accent: "#7a2838",
  font: "Calibri",
  premium: false,
  defaultPhoto: "/cv-photos/photo-1.png",
  isNew: true,
};

export const TEMPLATE_NO_PHOTO: CvTemplate = {
  id: "cv-sans-photo",
  name: "Épuré Universel (Sans photo)",
  category: "Classiques",
  layout: "classique-filet",
  primary: "#1e3a8a",
  accent: "#1e3a8a",
  font: "Calibri",
  premium: false,
  defaultPhoto: "",
};

export const CV_TEMPLATES: CvTemplate[] = [
  TEMPLATE_SARAH_GARCIA,
  ...modern.slice(1, 6),
  TEMPLATE_NO_PHOTO,
  ...modern.slice(6),
  ...classic,
];

export const PLACEHOLDER_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 170"><rect width="140" height="170" fill="#ffffff"/><circle cx="70" cy="58" r="30" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5"/><path d="M22 165c5-34 26-50 48-50s43 16 48 50z" fill="#cbd5e1"/><path d="M62 110l8 24 8-24z" fill="#94a3b8"/><rect x="1" y="1" width="138" height="168" fill="none" stroke="#e2e8f0" stroke-width="2" rx="4"/></svg>`,
  );

export const EMPTY_CV: CvData = {
  photo: "",
  showPhoto: true,
  firstName: "",
  lastName: "",
  title: "",
  summary: "",
  address: "",
  email: "",
  phone: "",
  birth: "",
  license: "",
  website: "",
  skills: [],
  languages: [],
  hobbies: [],
  experiences: [],
  education: [],
};

// Profils denses et complets adaptés exactement au genre de chaque photo
const SAMPLE_PROFILES: Record<string, Omit<CvData, "photo" | "showPhoto">> = {
  // Photo 1 : Femme (Sarah Garcia)
  "/cv-photos/photo-1.png": {
    firstName: "Sarah",
    lastName: "GARCIA",
    title: "LYCÉENNE & ASSISTANTE ADMINISTRATIVE",
    summary:
      "Étudiante motivée et rigoureuse, je bénéficie d'une solide expérience pratique dans l'accueil, la gestion administrative et le soutien scolaire. Proactive, organisée et digne de confiance, je m'adapte rapidement aux environnements exigeants.",
    address: "94 rue de la Mare aux Carats, Montpellier",
    city: "Montpellier",
    commune: "Centre",
    postalCode: "34080",
    email: "sarah.garcia@exemple.com",
    phone: "+33 6 12 34 56 78",
    birth: "14/05/2004",
    birthPlace: "Montpellier",
    license: "Permis B",
    nationality: "Française",
    gender: "Féminin",
    civilStatus: "Célibataire",
    website: "linkedin.com/in/sarah-garcia",
    skills: [
      "Secrétariat et gestion du courrier",
      "Maîtrise du Pack Office & Google Workspace",
      "Accueil physique et standard téléphonique",
      "Sens aigu de l'organisation et ponctualité",
      "Premiers secours civiques (PSC1)",
      "Communication bienveillante et diplomatie",
    ],
    languages: ["Français", "Anglais", "Espagnol"],
    languageItems: [
      { name: "Français", level: "Langue maternelle", percent: 100 },
      { name: "Anglais", level: "Opérationnel (B2)", percent: 80, details: "Séjour linguistique de 4 semaines" },
      { name: "Espagnol", level: "Intermédiaire (B1)", percent: 65 },
    ],
    hobbies: ["Pratique du VTT en montagne", "Bénévolat associatif", "Lecture d'essais historiques"],
    experiences: [
      {
        start: "01/2022",
        end: "En cours",
        role: "Assistante périscolaire & Garde d'enfants",
        company: "Services aux familles | Montpellier",
        description:
          "- Accompagnement quotidien aux devoirs scolaires et suivi pédagogique régulier.\n- Organisation d'activités ludo-éducatives et gestion des plannings de garde.\n- Transmission de rapports bienveillants et détaillés aux parents.",
      },
      {
        start: "01/2020",
        end: "06/2021",
        role: "Stagiaire au Secrétariat Général",
        company: "Préfecture de Région | Montpellier",
        description:
          "- Enregistrement, numérisation et dispatching des courriers officiels entrants.\n- Accueil et orientation du public au guichet administratif.\n- Rédaction de comptes rendus de réunions internes.",
      },
    ],
    education: [
      {
        start: "2021",
        end: "2023",
        degree: "Baccalauréat Général — Mention Très Bien",
        school: "Lycée Jean-Jacques Rousseau | Montpellier",
        grade: "Très Bien (16.8/20)",
        description: "Spécialités : Sciences Économiques et Sociales, Langues et Littérature.",
      },
      {
        start: "2018",
        end: "2021",
        degree: "Diplôme National du Brevet — Mention Bien",
        school: "Collège Las Cazes | Montpellier",
        grade: "Bien",
        description: "Déléguée de classe et animatrice du club journal du collège.",
      },
    ],
  },

  // Photo 2 : Homme (Alexandre Dubois)
  "/cv-photos/photo-2.png": {
    firstName: "Alexandre",
    lastName: "DUBOIS",
    title: "JURISTE D'ENTREPRISE & CONFORMITÉ",
    summary:
      "Juriste d'affaires spécialisé en droit des contrats et gouvernance d'entreprise. 5 ans d'expérience dans la sécurisation juridique de transactions commerciales, la gestion des contentieux et la mise en conformité réglementaire.",
    address: "Avenue Colonel Mondjiba, Kinshasa",
    city: "Kinshasa",
    commune: "Gombe",
    postalCode: "1001",
    email: "alexandre.dubois@exemple.com",
    phone: "+243 81 234 5678",
    birth: "22/09/1993",
    birthPlace: "Kinshasa",
    license: "Permis B",
    nationality: "Congolaise (RDC)",
    gender: "Masculin",
    civilStatus: "Marié",
    website: "linkedin.com/in/alexandre-dubois-law",
    skills: [
      "Rédaction et négociation de contrats complexes",
      "Droit OHADA des sociétés et sûretés",
      "Veille juridique et conformité anti-corruption",
      "Gestion précontentieuse et arbitrage",
      "Audit juridique et due diligence",
    ],
    languages: ["Français", "Anglais", "Lingala"],
    languageItems: [
      { name: "Français", level: "Langue maternelle", percent: 100 },
      { name: "Anglais", level: "Professionnel courant (C1)", percent: 88, details: "Pratique quotidienne en cabinet international" },
      { name: "Lingala", level: "Courant", percent: 95 },
    ],
    hobbies: ["Échecs en compétition", "Conférences universitaires", "Course à pied semi-marathon"],
    experiences: [
      {
        start: "03/2021",
        end: "En cours",
        role: "Juriste d'Affaires Senior",
        company: "Groupe Industriel Horizon | Kinshasa",
        description:
          "- Rédaction et négociation de plus de 80 contrats fournisseurs et partenaires commerciaux.\n- Pilotage de la mise en conformité des filiales aux normes réglementaires en vigueur.\n- Réduction des litiges commerciaux de 35% grâce à une médiation préventive.",
      },
      {
        start: "09/2018",
        end: "02/2021",
        role: "Juriste Junior — Droit des Sociétés",
        company: "Cabinet Conseil Juridique Atlas | Lubumbashi",
        description:
          "- Constitution de sociétés, modifications statutaires et formalités de greffe.\n- Rédaction de consultations juridiques ciblées en droit social et fiscal.",
      },
    ],
    education: [
      {
        start: "2016",
        end: "2018",
        degree: "Master 2 en Droit des Affaires Internationales",
        school: "Université de Kinshasa (UNIKIN)",
        grade: "Distinction",
        description: "Mémoire sur la protection des investissements privés en zone OHADA.",
      },
      {
        start: "2012",
        end: "2016",
        degree: "Licence en Droit Économique et Social",
        school: "Université Protestante au Congo (UPC)",
        grade: "Grande Distinction",
        description: "Major de promotion.",
      },
    ],
  },

  // Photo 3 : Femme (Clémence Kanku)
  "/cv-photos/photo-3.png": {
    firstName: "Clémence",
    lastName: "KANKU",
    title: "RESPONSABLE RESSOURCES HUMAINES & TALENTS",
    summary:
      "Professionnelle RH dynamique avec une expertise affirmée dans le recrutement stratégique, l'ingénierie de formation et l'amélioration du climat social. Orientée résultats et axée sur l'épanouissement des collaborateurs.",
    address: "Boulevard du 30 Juin, Kinshasa",
    city: "Kinshasa",
    commune: "Barumbu",
    postalCode: "1002",
    email: "clemence.kanku@exemple.com",
    phone: "+243 82 555 4321",
    birth: "08/11/1991",
    birthPlace: "Kananga",
    license: "Permis B",
    nationality: "Congolaise",
    gender: "Féminin",
    civilStatus: "Mariée",
    website: "linkedin.com/in/clemence-kanku-rh",
    skills: [
      "Recrutement de profils cadres et techniques",
      "Gestion prévisionnelle des emplois et compétences (GPEC)",
      "Élaboration et pilotage du plan de formation annuel",
      "Audit social et médiation des conflits internes",
      "SIRH et automatisation de la paie",
    ],
    languages: ["Français", "Anglais", "Tshiluba"],
    languageItems: [
      { name: "Français", level: "Langue maternelle", percent: 100 },
      { name: "Anglais", level: "Avancé (B2)", percent: 80 },
      { name: "Tshiluba", level: "Langue usuelle", percent: 90 },
    ],
    hobbies: ["Mentorat de jeunes diplômées", "Art contemporain africain", "Jardinage"],
    experiences: [
      {
        start: "10/2020",
        end: "En cours",
        role: "Responsable du Développement RH",
        company: "Banque Panafricaine | Kinshasa",
        description:
          "- Pilotage des campagnes de recrutement nationales : 120 recrutements finalisés en 2 ans.\n- Déploiement d'une nouvelle grille d'évaluation de la performance du personnel.\n- Diminution du taux de turnover de 14% à 6% en 18 mois.",
      },
      {
        start: "01/2017",
        end: "09/2020",
        role: "Chargée de Recrutement & Formation",
        company: "Société Télécoms Express | Kinshasa",
        description:
          "- Gestion du cycle complet de sélection : sourcing, entretiens structurés et intégration.\n- Organisation des sessions d'onboarding et des bilans de compétences.",
      },
    ],
    education: [
      {
        start: "2014",
        end: "2016",
        degree: "Master Professionnel en Management des Ressources Humaines",
        school: "Institut Supérieur de Commerce (ISC) | Kinshasa",
        grade: "Distinction",
        description: "Spécialisation en relations sociales et dialogue en entreprise.",
      },
      {
        start: "2010",
        end: "2014",
        degree: "Licence en Psychologie du Travail",
        school: "Université de Kinshasa",
        grade: "Bien",
        description: "Étude sur la motivation des équipes dans le secteur bancaire.",
      },
    ],
  },

  // Photo 4 : Homme (Marc Ilunga)
  "/cv-photos/photo-4.png": {
    firstName: "Marc",
    lastName: "ILUNGA",
    title: "INGÉNIEUR LOGICIEL FULL STACK & CHEF DE PROJET",
    summary:
      "Ingénieur informatique passionné par l'architecture logicielle, le cloud computing et les applications web modernes. 6 ans de pratique dans la conception de solutions scalables et le management d'équipes agiles.",
    address: "Avenue Kasa-Vubu, Lubumbashi",
    city: "Lubumbashi",
    commune: "Lubumbashi",
    postalCode: "7001",
    email: "marc.ilunga@exemple.com",
    phone: "+243 99 765 4321",
    birth: "19/03/1990",
    birthPlace: "Likasi",
    license: "Permis B",
    nationality: "Congolaise",
    gender: "Masculin",
    civilStatus: "Célibataire",
    website: "github.com/marc-ilunga",
    skills: [
      "TypeScript, React, Next.js, Node.js",
      "Architecture microservices, PostgreSQL, Redis",
      "DevOps, Docker, CI/CD et déploiement Cloud",
      "Gestion de projet Agile (Scrum / Kanban)",
      "Sécurité applicative et optimisation des performances",
    ],
    languages: ["Français", "Anglais", "Swahili"],
    languageItems: [
      { name: "Français", level: "Langue maternelle", percent: 100 },
      { name: "Anglais", level: "Courant technique (C1)", percent: 90, details: "Documentation et coordination avec équipes internationales" },
      { name: "Swahili", level: "Courant", percent: 95 },
    ],
    hobbies: ["Contributions open-source", "Robotique et impression 3D", "Cyclisme sur route"],
    experiences: [
      {
        start: "06/2021",
        end: "En cours",
        role: "Lead Développeur Full Stack",
        company: "Tech Solutions Afrique | Lubumbashi",
        description:
          "- Direction technique d'une équipe de 7 développeurs sur une plateforme fintech sécurisée.\n- Migration vers une architecture moderne réduisant les temps de réponse de 60%.\n- Mise en place d'un pipeline CI/CD automatisé avec tests unitaires rigoureux.",
      },
      {
        start: "08/2017",
        end: "05/2021",
        role: "Ingénieur d'Études & Développement Web",
        company: "Agence Digitale Innovate | Kinshasa",
        description:
          "- Développement d'applications web réactives pour des banques et assurances régionales.\n- Intégration d'APIs de paiements mobiles (M-Pesa, Airtel Money, Orange Money).",
      },
    ],
    education: [
      {
        start: "2015",
        end: "2017",
        degree: "Diplôme d'Ingénieur en Génie Informatique",
        school: "Faculté Polytechnique | Université de Lubumbashi",
        grade: "Très Grande Distinction",
        description: "Major de promotion avec félicitations du jury.",
      },
      {
        start: "2011",
        end: "2015",
        degree: "Licence en Mathématiques et Informatique",
        school: "Université de Lubumbashi",
        grade: "Distinction",
        description: "Bourse d'excellence académique.",
      },
    ],
  },

  // Photo 5 : Femme (Amina Diallo)
  "/cv-photos/photo-5.png": {
    firstName: "Amina",
    lastName: "DIALLO",
    title: "DIRECTRICE ADMINISTRATIVE ET FINANCIÈRE",
    summary:
      "Cadre financière chevronnée avec plus de 8 ans d'expérience dans la modélisation financière, le contrôle budgétaire et la gestion de trésorerie multidevises. Garant de la conformité comptable et de la rentabilité des investissements.",
    address: "Boulevard Lumumba, Kinshasa",
    city: "Kinshasa",
    commune: "Limete",
    postalCode: "1004",
    email: "amina.diallo@exemple.com",
    phone: "+243 89 123 9876",
    birth: "30/01/1988",
    birthPlace: "Kinshasa",
    license: "Permis B",
    nationality: "Congolaise",
    gender: "Féminin",
    civilStatus: "Mariée",
    website: "linkedin.com/in/amina-diallo-finance",
    skills: [
      "Contrôle de gestion et clôtures comptables",
      "Élaboration et suivi des budgets prévisionnels",
      "Gestion de trésorerie et optimisation fiscale",
      "Audit financier interne et gestion des risques",
      "Reporting financier pour conseils d'administration",
    ],
    languages: ["Français", "Anglais", "Lingala"],
    languageItems: [
      { name: "Français", level: "Langue maternelle", percent: 100 },
      { name: "Anglais", level: "Bilingue financier (C2)", percent: 95 },
      { name: "Lingala", level: "Courant", percent: 90 },
    ],
    hobbies: ["Économie solidaire et microcrédit", "Littérature africaine", "Natation"],
    experiences: [
      {
        start: "04/2019",
        end: "En cours",
        role: "Directrice Financière Adjointe",
        company: "Consortium Minier Central | Kolwezi",
        description:
          "- Supervision directe d'un budget opérationnel annuel de 45 millions USD.\n- Négociation des lignes de crédit bancaires avec une baisse de coût de financement de 2.2%.\n- Restructuration des procédures comptables internes et conformité fiscale stricte.",
      },
      {
        start: "02/2015",
        end: "03/2019",
        role: "Auditeur Financier Senior",
        company: "Cabinet d'Audit International | Kinshasa",
        description:
          "- Conduite de missions de certification des comptes pour des multinationales du secteur énergie.\n- Détection des anomalies de procédures et recommandations d'optimisation du contrôle interne.",
      },
    ],
    education: [
      {
        start: "2012",
        end: "2014",
        degree: "Master en Comptabilité, Contrôle et Audit (CCA)",
        school: "Institut Supérieur de Commerce | Kinshasa",
        grade: "Distinction",
        description: "Diplômée d'expertise comptable intermédiaire.",
      },
      {
        start: "2008",
        end: "2012",
        degree: "Licence en Sciences Économiques et Gestion",
        school: "Université de Kinshasa",
        grade: "Distinction",
        description: "Mémoire sur l'impact des régimes de change sur la balance commerciale.",
      },
    ],
  },

  // Photo 6 : Homme (Patrick Tshisekedi)
  "/cv-photos/photo-6.png": {
    firstName: "Patrick",
    lastName: "TSHISEKEDI",
    title: "RESPONSABLE LOGISTIQUE & SUPPLY CHAIN",
    summary:
      "Expert en logistique d'approvisionnement, gestion de stocks et transport multimodal. Capacité reconnue à optimiser les flux de distribution, réduire les délais de livraison et négocier avec les transitaires internationaux.",
    address: "Avenue du Port, Matadi",
    city: "Matadi",
    commune: "Matadi",
    postalCode: "2001",
    email: "patrick.tshisekedi@exemple.com",
    phone: "+243 85 432 1098",
    birth: "12/07/1989",
    birthPlace: "Boma",
    license: "Permis B & C",
    nationality: "Congolaise",
    gender: "Masculin",
    civilStatus: "Marié",
    website: "linkedin.com/in/patrick-tshisekedi-logistics",
    skills: [
      "Gestion de stocks et inventaires tournants",
      "Dédouanement portuaire et formalités douanières",
      "Planification des tournées de transport routier",
      "Management d'équipes d'entrepôt (35 personnes)",
      "Négociation tarifaire avec transporteurs et transitaires",
    ],
    languages: ["Français", "Anglais", "Kikongo"],
    languageItems: [
      { name: "Français", level: "Langue maternelle", percent: 100 },
      { name: "Anglais", level: "Professionnel opérationnel (B2)", percent: 78 },
      { name: "Kikongo", level: "Langue maternelle", percent: 100 },
    ],
    hobbies: ["Football associatif", "Musique acoustique", "Voyages fluviaux"],
    experiences: [
      {
        start: "05/2018",
        end: "En cours",
        role: "Chef du Département Logistique & Transit",
        company: "Société Commerciale de Distribution | Matadi",
        description:
          "- Gestion quotidienne de la chaîne d'approvisionnement pour 3 entrepôts régionaux (12 000 m²).\n- Diminution des ruptures de stock de 42% via l'implémentation du réapprovisionnement automatique.\n- Pilotage du passage en douane de plus de 400 conteneurs par an sans pénalités de surestaries.",
      },
      {
        start: "03/2014",
        end: "04/2018",
        role: "Superviseur d'Entrepôt & Expéditions",
        company: "Transit Maritime International | Boma",
        description:
          "- Coordination des opérations de chargement, déchargement et palettisation sécurisée.\n- Suivi rigoureux des indicateurs de performance (taux de service client à 98.5%).",
      },
    ],
    education: [
      {
        start: "2011",
        end: "2013",
        degree: "Master en Transport et Logistique Internationale",
        school: "Institut Supérieur de Statistique | Kinshasa",
        grade: "Distinction",
        description: "Spécialité gestion des corridors de transport multimodal.",
      },
      {
        start: "2007",
        end: "2011",
        degree: "Licence en Gestion d'Entreprise",
        school: "Université Kongo | Matadi",
        grade: "Bien",
        description: "Option Commerce et Gestion des flux de marchandises.",
      },
    ],
  },
};

export function sampleCvFor(t: CvTemplate): CvData {
  const keys = Object.keys(SAMPLE_PROFILES);
  const idx = Math.max(0, CV_TEMPLATES.findIndex((x) => x.id === t.id));
  const photoKey = t.defaultPhoto || keys[idx % keys.length] || "/cv-photos/photo-1.png";
  const profile = SAMPLE_PROFILES[photoKey] || SAMPLE_PROFILES["/cv-photos/photo-1.png"];
  if (!profile) return { ...EMPTY_CV };
  return {
    photo: "",
    showPhoto: t.id !== TEMPLATE_NO_PHOTO.id,
    ...structuredClone(profile),
  };
}

export const ICONS = {
  phone: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  email: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  location: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  birth: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  birthPlace: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>`,
  civil: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  gender: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  nationality: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
  license: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  link: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  custom: `<svg style="display:inline-block;vertical-align:-2px;width:12px;height:12px;margin-right:6px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

const esc = (s: string) =>
  (s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

export function formatCvPeriod(start: string, end: string): string {
  return [start, end].map((x) => (x ?? "").trim()).filter(Boolean).join(" \u2014 ");
}

function rich(s: string, size = "9pt") {
  const ls = (s ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  let out = "";
  let ul: string[] = [];
  const flush = () => {
    if (ul.length) out += `<ul style="margin:2px 0 2px 14px;padding:0">${ul.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    ul = [];
  };
  for (const l of ls) {
    if (/^[-•]/.test(l)) ul.push(l.replace(/^[-•]\s*/, ""));
    else { flush(); out += `<div style="margin:1px 0;font-size:${size}">${esc(l)}</div>`; }
  }
  flush();
  return out;
}

interface Parts {
  photo: string;
  name: string;
  contacts: { icon: string; label: string; value: string }[];
}

function parts(d: CvData, t?: CvTemplate): Parts {
  const fullAddress = [d.address, d.commune, d.city, d.postalCode].filter((x) => (x ?? "").trim()).join(", ");
  const contacts: { icon: string; label: string; value: string }[] = [
    { icon: ICONS.phone, label: "Téléphone", value: d.phone },
    { icon: ICONS.email, label: "E-mail", value: d.email },
    { icon: ICONS.location, label: "Adresse", value: fullAddress },
    { icon: ICONS.birth, label: "Date de naissance", value: d.birth },
    { icon: ICONS.birthPlace, label: "Lieu de naissance", value: d.birthPlace || "" },
    { icon: ICONS.nationality, label: "Nationalité", value: d.nationality || "" },
    { icon: ICONS.gender, label: "Sexe", value: d.gender || "" },
    { icon: ICONS.civil, label: "État civil", value: d.civilStatus || "" },
    { icon: ICONS.license, label: "Permis", value: d.license },
    { icon: ICONS.link, label: "Web / LinkedIn", value: d.website },
    ...Object.entries(d.extra ?? {}).map(([label, value]) => ({ icon: ICONS.custom, label, value })),
  ].filter((c) => (c.value ?? "").trim());

  const noPhotoModel = t?.id === TEMPLATE_NO_PHOTO.id;
  const effectivePhoto = !d.showPhoto
    ? ""
    : noPhotoModel
    ? d.photo && d.photo !== PLACEHOLDER_PHOTO
      ? d.photo
      : ""
    : d.photo && d.photo !== PLACEHOLDER_PHOTO
    ? d.photo
    : t?.defaultPhoto || d.photo || PLACEHOLDER_PHOTO;

  const fullName = `${d.firstName.trim()} ${d.lastName.trim()}`.trim();
  return { photo: effectivePhoto, name: esc(fullName), contacts };
}

function renderLanguageGauges(d: CvData, isDarkBg = false): string {
  const items: CvLanguageItem[] = d.languageItems && d.languageItems.length
    ? d.languageItems
    : d.languages.map((l) => ({ name: l, level: "Opérationnel", percent: 75, details: "" }));
  if (!items.length) return "";

  const nameColor = isDarkBg ? "#ffffff" : "#111827";
  const barBg = isDarkBg ? "rgba(255,255,255,0.25)" : "#e5e7eb";
  const barFill = isDarkBg ? "#ffffff" : "#2563eb";
  const subColor = isDarkBg ? "rgba(255,255,255,0.85)" : "#6b7280";

  return items.map((li) => `
    <div style="margin:0 0 10px">
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:8.5pt;color:${nameColor}">
        <span>${esc(li.name)}</span>
        <span style="font-size:7.5pt;font-weight:normal;color:${subColor}">${esc(li.level)}</span>
      </div>
      <div style="height:4px;background:${barBg};border-radius:2px;margin:3px 0 2px;overflow:hidden">
        <div style="height:100%;width:${li.percent ?? 75}%;background:${barFill};border-radius:2px"></div>
      </div>
      ${li.details ? `<div style="font-size:7pt;color:${subColor};font-style:italic">${esc(li.details)}</div>` : ""}
    </div>
  `).join("");
}

function renderExperiences(d: CvData, color: string): string {
  return d.experiences.map((e) => `
    <div style="margin:0 0 12px">
      <div style="font-size:9.5pt;font-weight:bold;color:#111827;line-height:1.25">
        <span style="color:#6b7280;font-size:8.5pt;font-weight:600">${esc(formatCvPeriod(e.start, e.end))}</span>
        <span style="color:#9ca3af;margin:0 4px">•</span>
        <span>${esc(e.role)}</span>
      </div>
      <div style="font-size:8.5pt;font-weight:600;color:${color};margin-top:2px">${esc(e.company)}</div>
      ${e.description ? `<div style="color:#4b5563;font-size:8.5pt;margin-top:3px">${rich(e.description, "8.5pt")}</div>` : ""}
    </div>
  `).join("");
}

function renderEducation(d: CvData, color: string): string {
  return d.education.map((e) => `
    <div style="margin:0 0 10px">
      <div style="font-size:9.5pt;font-weight:bold;color:#111827;line-height:1.25">
        <span style="color:#6b7280;font-size:8.5pt;font-weight:600">${esc(formatCvPeriod(e.start, e.end))}</span>
        <span style="color:#9ca3af;margin:0 4px">•</span>
        <span>${esc(e.degree)}</span>
      </div>
      <div style="font-size:8.5pt;color:#374151;margin-top:1px">${esc(e.school)}${e.grade ? ` <span style="color:${color};font-weight:600">— Mention : ${esc(e.grade)}</span>` : ""}</div>
      ${e.description ? `<div style="color:#6b7280;font-size:8pt;margin-top:2px">${rich(e.description, "8pt")}</div>` : ""}
    </div>
  `).join("");
}

const SHAPE_RADIUS = { square: "0px", rounded: "16px", circle: "50%" } as const;

export function renderCvHtml(t0: CvTemplate, d: CvData): string {
  const safeColor = /^#[0-9a-f]{6}$/i.test(d.customColor || "") ? d.customColor : undefined;
  const safeFont = /^[a-z ]+$/i.test(d.customFont || "") ? d.customFont : undefined;
  const safeRight = /^#[0-9a-f]{6}$/i.test(d.rightColor || "") ? d.rightColor : undefined;
  const t: CvTemplate = { ...t0, primary: safeColor || t0.primary, accent: safeRight || safeColor || t0.accent, font: safeFont || t0.font };
  let html = renderBase(t, d.titleAsHeading === false ? { ...d, title: "" } : d);
  const bodySize = d.fontSize === "compact" ? 11 : d.fontSize === "large" ? 13 : d.fontSize === "xlarge" ? 14 : 12;
  html = html.replace(/font-size:(\d+(?:\.\d+)?)pt/g, (match, value: string) => Number(value) < 12 ? `font-size:${bodySize}pt` : match);
  html = html.replace(/letter-spacing:[^;"]+/g, "letter-spacing:0");
  if (d.photoShape) {
    html = html.replace(/(<img [^>]*?style="[^"]*?)border-radius:[^;]*;/g, (_, prefix: string) => `${prefix}border-radius:${SHAPE_RADIUS[d.photoShape ?? "circle"]};`);
  }

  // Intégration des rubriques supplémentaires et de la signature
  const blocks = (d.sections ?? []).filter((x) => x.content && x.content.trim());
  const hasSignature = Boolean(d.signature?.trim() || d.signatureImage?.trim());

  if (!blocks.length && !hasSignature) return html.replace("<!-- cv-extras -->", "");

  const h = (s: string) => `<div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${t.primary};border-bottom:1.5px solid ${t.primary};padding-bottom:3px;margin:14px 0 6px">${esc(s)}</div>`;
  const extraHtml = blocks.map((b) => h(b.title) + (b.start || b.end ? `<div style="font-size:12pt">${esc(formatCvPeriod(b.start || "", b.end || ""))}</div>` : "") + rich(b.content, "12pt")).join("");

  const sigHtml = hasSignature ? `
    <div style="margin-top:18px;display:flex;justify-content:flex-end">
      <div style="text-align:center;min-width:180px">
        <div style="font-size:8pt;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">Signature</div>
        ${d.signatureImage ? `<img src="${d.signatureImage}" alt="Signature" style="max-height:55px;max-width:160px;object-fit:contain;display:inline-block">` : ""}
        ${d.signature ? `<div style="font-family:'Brush Script MT',cursive,italic;font-size:16pt;color:#111;margin-top:2px">${esc(d.signature)}</div>` : ""}
      </div>
    </div>
  ` : "";

  return html.replace("<!-- cv-extras -->", extraHtml + sigHtml);

}

function renderBase(t: CvTemplate, d: CvData): string {
  const p = parts(d, t);
  const color = t.primary;
  // Base avec police 9.5pt et interligne 1.45 pour une excellente lisibilité
  const base = `font-family:'${t.font}',Arial,sans-serif;font-size:9.5pt;color:#111827;line-height:1.45;background:#fff;width:794px;min-height:1123px;box-sizing:border-box;overflow:hidden;`;

  if (t.layout === "lateral-bordeaux" || t.layout === "lateral-couleur" || t.layout === "lateral-gris" || t.layout === "lateral-plein" || t.layout === "arche") {
    const isDark = t.layout !== "lateral-gris";
    const sideBg = isDark ? color : "#f3f4f6";
    const sideText = isDark ? "#ffffff" : "#111827";
    const sideHead = (s: string) => `<div style="font-size:11pt;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${isDark ? '#fff' : color};margin:16px 0 8px;border-bottom:1.5px solid ${isDark ? 'rgba(255,255,255,0.35)' : color};padding-bottom:3px">${esc(s)}</div>`;
    const mainHead = (s: string) => `<div style="font-size:12pt;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${t.accent};margin:16px 0 6px;border-bottom:1.5px solid ${t.accent};padding-bottom:3px">${esc(s)}</div>`;

    return `
      <div style="${base}display:flex">
        <!-- Colonne latérale gauche (280px) -->
        <div style="width:280px;background:${sideBg};color:${sideText};padding:28px 20px;box-sizing:border-box;flex-shrink:0">
          ${p.photo ? `
            <div style="text-align:center;margin-bottom:18px">
              <img src="${p.photo}" alt="" style="width:145px;height:145px;object-fit:cover;border-radius:50%;border:4px solid #ffffff;display:inline-block;box-shadow:0 3px 10px rgba(0,0,0,0.18)">
            </div>
          ` : ""}

          ${d.summary.trim() ? `
            ${sideHead("Profil")}
            <div style="font-size:9.5pt;line-height:1.5;text-align:left;color:${isDark ? '#f9fafb' : '#374151'}">
              ${rich(d.summary, "9.5pt")}
            </div>
          ` : ""}

          ${d.skills.length ? `
            ${sideHead("Compétences")}
            <div style="font-size:9.5pt;line-height:1.6">
              ${d.skills.map((s) => `<div style="margin:2px 0;text-align:left;word-spacing:normal;letter-spacing:0;overflow-wrap:break-word">• ${esc(s.replace(/\s+/g, " ").trim())}</div>`).join("")}
            </div>
          ` : ""}

          ${(d.languages.length || (d.languageItems && d.languageItems.length)) ? `
            ${sideHead("Langues")}
            ${renderLanguageGauges(d, isDark)}
          ` : ""}

          ${d.hobbies.length ? `
            ${sideHead("Centres d'intérêt")}
            <div style="font-size:9pt;line-height:1.5;color:${isDark ? '#f9fafb' : '#4b5563'}">
              ${d.hobbies.map((h) => `<div style="margin:2px 0">• ${esc(h)}</div>`).join("")}
            </div>
          ` : ""}
        </div>
        
        <!-- Colonne principale droite -->
        <div style="flex:1;padding:32px 30px;box-sizing:border-box">
            <div style="margin-bottom:14px;text-align:left">
            <div style="font-size:${Math.min(26, 450 / Math.max(1, p.name.length))}pt;font-weight:900;color:${color};line-height:1.2;letter-spacing:0;text-align:left;white-space:nowrap">
              ${p.name}
            </div>
            <div style="font-size:11pt;letter-spacing:1px;text-transform:uppercase;color:#4b5563;font-weight:600;margin-top:6px;text-align:left">
              ${esc(d.title)}
            </div>
          </div>
          

          <!-- Coordonnées avec icônes -->
          <div style="font-size:8.5pt;color:#4b5563;margin-bottom:14px;line-height:1.65;background:#f9fafb;padding:10px 14px;border-radius:8px">
            ${p.contacts.map((c) => `<div style="display:flex;align-items:center">${c.icon} <span>${esc(c.value)}</span></div>`).join("")}
          </div>

          ${d.education.length ? `${mainHead("Formations")}${renderEducation(d, color)}` : ""}
          ${d.experiences.length ? `${mainHead("Expériences Professionnelles")}${renderExperiences(d, color)}` : ""}
          <!-- cv-extras -->
        </div>
      </div>
    `;
  }

  // Layout 2 : Bandeau avec 2 colonnes
  const hMain = (s: string) => `<div style="font-size:10.5pt;font-weight:bold;text-transform:uppercase;color:${color};border-bottom:1.5px solid ${color};padding-bottom:2px;margin:14px 0 6px">${esc(s)}</div>`;
  const isNoPhoto = t.id === TEMPLATE_NO_PHOTO.id || !p.photo;

  return `
    <div style="${base}">
      <!-- En-tête bandeau -->
      <div style="background:${color};color:#fff;padding:26px 36px;display:flex;align-items:center;gap:24px">
        ${!isNoPhoto ? `<img src="${p.photo}" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:12px;border:3px solid #fff;flex-shrink:0">` : ""}
        <div style="flex:1;text-align:left">
          <div style="font-size:${Math.min(24, 650 / Math.max(1, p.name.length))}pt;font-weight:bold;line-height:1.2;text-align:left;white-space:nowrap">${p.name}</div>
          <div style="font-size:11pt;letter-spacing:1px;margin-top:4px;color:rgba(255,255,255,0.9);text-align:left">${esc(d.title)}</div>
        </div>
      </div>
      
      <!-- Corps en deux colonnes -->
      <div style="display:flex;padding:22px 34px;gap:28px">
        <div style="width:230px;flex-shrink:0">
          ${p.contacts.length ? `
            ${hMain("Contact")}
            <div style="font-size:8pt;color:#4b5563;line-height:1.6">
              ${p.contacts.map((c) => `<div style="display:flex;align-items:center;margin:3px 0">${c.icon} <span>${esc(c.value)}</span></div>`).join("")}
            </div>
          ` : ""}
          ${d.skills.length ? `
            ${hMain("Compétences")}
            <div style="font-size:8pt;line-height:1.5">${d.skills.map((s) => `<div style="margin:2px 0;text-align:left;word-spacing:normal;letter-spacing:0;overflow-wrap:break-word">• ${esc(s.replace(/\s+/g, " ").trim())}</div>`).join("")}</div>
          ` : ""}
          ${(d.languages.length || (d.languageItems && d.languageItems.length)) ? `
            ${hMain("Langues")}
            ${renderLanguageGauges(d, false)}
          ` : ""}
          ${d.hobbies.length ? `
            ${hMain("Loisirs")}
            <div style="font-size:8pt;color:#6b7280">${d.hobbies.map((h) => `<div style="margin:1px 0">• ${esc(h)}</div>`).join("")}</div>
          ` : ""}
        </div>

        <div style="flex:1;border-left:1px solid #e5e7eb;padding-left:24px">
          ${d.summary.trim() ? `
            ${hMain("Profil")}
            <div style="color:#4b5563;font-size:8.5pt;margin-bottom:10px">${rich(d.summary, "8.5pt")}</div>
          ` : ""}
          ${d.experiences.length ? `${hMain("Expériences professionnelles")}${renderExperiences(d, color)}` : ""}
          ${d.education.length ? `${hMain("Formations")}${renderEducation(d, color)}` : ""}
          <!-- cv-extras -->
        </div>
      </div>
    </div>
  `;
    }
    
