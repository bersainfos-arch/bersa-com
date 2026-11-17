export type CvLayout =
  | "bandeau-photo" | "lateral-couleur" | "lateral-gris" | "diagonal" | "bandeau-sombre"
  | "entete-arrondi" | "lateral-plein" | "elegant" | "arche"
  | "classique-centre" | "classique-filet";

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
}

export interface CvExperience { start: string; end: string; role: string; company: string; description: string }
export interface CvEducation { start: string; end: string; degree: string; school: string; description: string }

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
  license: string;
  website: string;
  skills: string[];
  languages: string[];
  hobbies: string[];
  experiences: CvExperience[];
  education: CvEducation[];
  // BERSA Writer (optionnels : les modèles existants restent identiques)
  cvTitle?: string;
  titleAsHeading?: boolean;
  photoShape?: "square" | "rounded" | "circle";
  postalCode?: string;
  commune?: string;
  city?: string;
  extra?: Record<string, string>;
  signature?: string;
  sections?: { key: string; title: string; content: string }[];
  customColor?: string;
  customFont?: string;
}

export const CV_MODEL_PHOTOS = [
  "/cv-photos/photo-1.png",
  "/cv-photos/photo-2.png",
  "/cv-photos/photo-3.png",
  "/cv-photos/photo-4.png",
  "/cv-photos/photo-5.png",
  "/cv-photos/photo-6.png",
];

export const CV_CATEGORIES = ["Modernes", "Classiques"] as const;

const MODERN_LAYOUTS: { layout: CvLayout; name: string }[] = [
  { layout: "lateral-bordeaux", name: "Bordeaux Studio" },
  { layout: "bandeau-photo", name: "Bandeau" },
  { layout: "lateral-couleur", name: "Corail" },
  { layout: "lateral-gris", name: "Clarté" },
  { layout: "diagonal", name: "Diagonale" },
  { layout: "bandeau-sombre", name: "Contraste" },
  { layout: "entete-arrondi", name: "Horizon" },
  { layout: "lateral-plein", name: "Azur" },
  { layout: "elegant", name: "Élégance" },
  { layout: "arche", name: "Arche" },
];
  { layout: "bandeau-photo", name: "Bandeau" },
  { layout: "lateral-couleur", name: "Corail" },
  { layout: "lateral-gris", name: "Clarté" },
  { layout: "diagonal", name: "Diagonale" },
  { layout: "bandeau-sombre", name: "Contraste" },
  { layout: "entete-arrondi", name: "Horizon" },
  { layout: "lateral-plein", name: "Azur" },
  { layout: "elegant", name: "Élégance" },
  { layout: "arche", name: "Arche" },
];

const PALETTES: { n: string; p: string; a: string }[] = [
  { n: "Ardoise", p: "#475a78", a: "#111827" },
  { n: "Corail", p: "#e8897a", a: "#e8897a" },
  { n: "Bleu ciel", p: "#5b9fd6", a: "#5b9fd6" },
  { n: "Sarcelle", p: "#3fb3b9", a: "#3fb3b9" },
  { n: "Noir", p: "#1a1a1a", a: "#1a1a1a" },
  { n: "Rose poudré", p: "#d4a5ab", a: "#9d5b66" },
  { n: "Bleu roi", p: "#1e3a8a", a: "#c9a227" },
  { n: "Émeraude", p: "#2f7d5b", a: "#2f7d5b" },
  { n: "Bordeaux", p: "#7f1d3a", a: "#7f1d3a" },
  { n: "Gris perle", p: "#8a94a3", a: "#374151" },
  { n: "Prune", p: "#5b3a6e", a: "#5b3a6e" },
];

const FONTS_MODERN = ["Arial", "Calibri", "Verdana", "Trebuchet MS", "Segoe UI"];
const FONTS_CLASSIC = ["Times New Roman", "Georgia", "Garamond", "Book Antiqua", "Cambria"];

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

const CLASSIC_COLORS = ["#111827", "#1e3a8a", "#374151", "#7f1d3a", "#14532d", "#3f3f46", "#0f3d5e", "#5b3a6e", "#78350f", "#1f2937"];
const classic: CvTemplate[] = Array.from({ length: 20 }, (_, i) => ({
  id: `cv-c-${i + 1}`,
  name: `${i % 2 ? "Filet" : "Tradition"} ${i + 1}`,
  category: "Classiques",
  layout: i % 2 ? "classique-filet" : "classique-centre",
  primary: CLASSIC_COLORS[i % CLASSIC_COLORS.length]!,
  accent: CLASSIC_COLORS[i % CLASSIC_COLORS.length]!,
  font: FONTS_CLASSIC[i % FONTS_CLASSIC.length]!,
  premium: i >= 10,
  defaultPhoto: CV_MODEL_PHOTOS[i % CV_MODEL_PHOTOS.length]!,
}));

export const TEMPLATE_NO_PHOTO: CvTemplate = {
  id: "cv-sans-photo", name: "Épuré sans photo", category: "Classiques", layout: "classique-filet",
  primary: "#1e3a8a", accent: "#1e3a8a", font: "Calibri", premium: false, defaultPhoto: "",
};

export const CV_TEMPLATES: CvTemplate[] = [...modern.slice(0, 6), TEMPLATE_NO_PHOTO, ...modern.slice(6), ...classic];

// Photo portrait studio élégante sur fond blanc éclatant, conçue pour être remplacée d'un clic
export const PLACEHOLDER_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 170"><rect width="140" height="170" fill="#ffffff"/><circle cx="70" cy="58" r="30" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5"/><path d="M22 165c5-34 26-50 48-50s43 16 48 50z" fill="#cbd5e1"/><path d="M62 110l8 24 8-24z" fill="#94a3b8"/><rect x="1" y="1" width="138" height="168" fill="none" stroke="#e2e8f0" stroke-width="2" rx="4"/></svg>`,
  );

// Données 100% vierges à l'ouverture : aucun faux nom ni faux contenu, photo par défaut conservée
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

// Modèle de démonstration pour les vignettes de sélection (style soigné Mon CV Parfait)
export const SAMPLE_CV: CvData = {
  photo: PLACEHOLDER_PHOTO,
  showPhoto: true,
  firstName: "Alexandre",
  lastName: "DUBOIS",
  title: "Responsable Administratif & Juridique",
  summary: "Professionnel rigoureux doté d'une solide expertise en organisation, gestion documentaire et droit des affaires. Orienté résultats et excellence opérationnelle.",
  address: "Paris, France",
  email: "alexandre.dubois@email.com",
  phone: "+33 6 12 34 56 78",
  birth: "32 ans",
  license: "Permis B",
  website: "linkedin.com/in/adubois",
  skills: ["Gestion de projet", "Droit des affaires", "Rédaction juridique", "Négociation", "Management"],
  languages: ["Français (maternelle)", "Anglais (courant pro)"],
  hobbies: ["Lecture", "Veille stratégique"],
  experiences: [
    {
      start: "2021",
      end: "Présent",
      role: "Responsable Administratif",
      company: "Cabinet Conseil & Stratégie",
      description: "- Supervision des dossiers juridiques et administratifs\n- Optimisation des procédures de conformité",
    },
    {
      start: "2018",
      end: "2021",
      role: "Juriste d'Entreprise",
      company: "Groupe Industriel",
      description: "- Rédaction et audit des contrats commerciaux\n- Suivi des contentieux et négociations",
    },
  ],
  education: [
    {
      start: "2017",
      end: "2018",
      degree: "Master 2 Droit et Management",
      school: "Université de Droit",
      description: "Mention Bien - Mémoire d'excellence",
    },
  ],
};

const W = (first: string, last: string, title: string, summary: string, city: string, skills: string[], exp: CvExperience[], edu: CvEducation): Omit<CvData, "photo" | "showPhoto"> => ({
  firstName: first, lastName: last, title, summary, address: city,
  email: `${first.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}.${last.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@email.com`,
  phone: "", birth: "", license: "Permis B", website: "",
  skills, languages: ["Français (courant)", "Anglais (professionnel)"], hobbies: ["Lecture", "Bénévolat"],
  experiences: exp, education: [edu],
});

/** Profils d'exemple : index pair = portrait féminin (photos 1, 3, 5), impair = masculin (2, 4, 6). */
  const SAMPLE_PROFILES = [
  {
    firstName: "Sarah",
    lastName: "GARCIA",
    title: "LYCÉENNE",
    summary: "Étudiante motivée en année de terminale, je bénéficie d'une expérience pratique dans la garde d'enfants et l'aide aux devoirs. Dotée d'une grande capacité d'adaptation, je sais me montrer proactive et digne de confiance dans la réalisation de mes missions.",
    address: "94 rue de la Mare aux Carats, 34080 Montpellier",
    email: "sarah.garcia@exemple.com",
    phone: "0612345678",
    birth: "",
    license: "",
    website: "",
    skills: [
      "Fiabilité",
      "Premiers secours",
      "Nature sociable",
      "Maîtrise du pack Office",
      "Sens de l'initiative",
      "Conduite responsable",
      "Capacités d'adaptation",
      "Respect des règles",
    ],
    languages: ["Anglais", "Espagnol"],
    languageItems: [
      { name: "Anglais", level: "Opérationnel", details: "Séjour linguistique de 3 semaines en Irlande", percent: 75 },
      { name: "Espagnol", level: "Langue maternelle", percent: 100 },
    ],
    hobbies: [
      "Aime découvrir les cultures étrangères à travers les voyages",
      "Pratique le VTT-BMX en montagne",
    ],
    experiences: [
      {
        start: "01/2022",
        end: "Actuel",
        role: "Babysitter",
        company: "Particuliers | Marseille",
        description: "- Soutien scolaire pour aider les enfants à faire leurs devoirs, en les accompagnant dans l'apprentissage des leçons et la réalisation des exercices.\n- Établissement de comptes rendus auprès des parents, présentation du déroulement de la journée, mise en avant des progrès réalisés par les enfants et remise de toute information utile.",
      },
      {
        start: "01/2019",
        end: "02/2019",
        role: "Stage de troisième",
        company: "Préfecture de l'Hérault | Montpellier",
        description: "- Tâches de secrétariat : accueil physique et téléphonique, gestion du courrier, traitement des mails, rédaction et mise en forme de courriers, démarches administratives.\n- Reporting d'activité auprès de mon responsable de stage, point sur l'avancement des missions confiées, rapport sur les problématiques rencontrées.",
      },
    ],
    education: [
      {
        start: "En cours",
        end: "",
        degree: "Terminale: Langues, littérature, histoire, philosophie, arts",
        school: "Lycée Jean-Jacques Rousseau | Montpellier",
        description: "",
      },
      {
        start: "06/2019",
        end: "",
        degree: "Diplôme National du Brevet - Mention bien",
        school: "Collège Las Cazes | Montpellier",
        description: "",
      },
    ],
  },
  // ... Conserver les autres profils existants ci-dessous
  
  W("Sarah", "MOREAU", "Responsable Ressources Humaines", "Professionnelle des ressources humaines, attentive à l'accompagnement des équipes, au recrutement et au développement des talents.", "Kinshasa, RDC",
    ["Recrutement", "Gestion de la paie", "Droit du travail", "Formation", "Communication"],
    [{ start: "Déc.", end: "Présent", role: "Responsable RH", company: "Groupe Horizon", description: "- Pilotage du recrutement et de l'intégration\n- Mise en place du plan de formation" },
     { start: "Janv.", end: "Nov.", role: "Chargée RH", company: "Cabinet Équilibre", description: "- Gestion administrative du personnel\n- Suivi des entretiens annuels" }],
    { start: "", end: "", degree: "Master Gestion des Ressources Humaines", school: "Université de Kinshasa", description: "Mention Bien" }),
  W("Alexandre", "DUBOIS", "Responsable Administratif & Juridique", "Professionnel rigoureux doté d'une solide expertise en organisation, gestion documentaire et droit des affaires.", "Lubumbashi, RDC",
    ["Gestion de projet", "Droit des affaires", "Rédaction juridique", "Négociation", "Management"],
    [{ start: "Mars", end: "Présent", role: "Responsable administratif", company: "Société Atlas", description: "- Supervision des services administratifs\n- Conformité juridique des contrats" },
     { start: "Sept.", end: "Févr.", role: "Juriste d'entreprise", company: "Groupe Industriel", description: "- Rédaction et audit des contrats commerciaux\n- Suivi des contentieux" }],
    { start: "", end: "", degree: "Master Droit et Management", school: "Université de Lubumbashi", description: "Mémoire d'excellence" }),
  W("Élodie", "BERNARD", "Cheffe de Projet Marketing", "Créative et organisée, je conçois des campagnes qui renforcent la notoriété des marques et fidélisent les clients.", "Goma, RDC",
    ["Stratégie digitale", "Gestion de projet", "Réseaux sociaux", "Rédaction", "Analyse de données"],
    [{ start: "Avr.", end: "Présent", role: "Cheffe de projet marketing", company: "Agence Lumière", description: "- Coordination des campagnes multicanales\n- Encadrement d'une équipe de cinq personnes" },
     { start: "Juin", end: "Mars", role: "Chargée de communication", company: "Maison Kivu", description: "- Animation des réseaux sociaux\n- Organisation d'événements" }],
    { start: "", end: "", degree: "Master Marketing et Communication", school: "Université de Goma", description: "Spécialité marketing digital" }),
  W("Thomas", "LAURENT", "Ingénieur Systèmes & Réseaux", "Ingénieur passionné par les infrastructures fiables, la sécurité informatique et l'amélioration continue des services.", "Kinshasa, RDC",
    ["Administration réseau", "Cybersécurité", "Linux / Windows Server", "Cloud", "Support technique"],
    [{ start: "Févr.", end: "Présent", role: "Ingénieur systèmes", company: "TechnoServ", description: "- Maintenance de l'infrastructure réseau\n- Déploiement de solutions de sauvegarde" },
     { start: "Oct.", end: "Janv.", role: "Technicien réseau", company: "NetCongo", description: "- Installation et dépannage des équipements\n- Assistance aux utilisateurs" }],
    { start: "", end: "", degree: "Ingénieur en Informatique", school: "Institut Supérieur de Technologie", description: "Option réseaux et télécommunications" }),
  W("Claire", "MUKENDI", "Comptable & Analyste Financière", "Comptable méthodique, spécialisée dans la tenue des comptes, l'analyse financière et la préparation des bilans.", "Kisangani, RDC",
    ["Comptabilité générale", "Fiscalité", "Excel avancé", "Contrôle de gestion", "Audit"],
    [{ start: "Mai", end: "Présent", role: "Comptable principale", company: "Finances & Conseils", description: "- Préparation des états financiers\n- Déclarations fiscales et sociales" },
     { start: "Juil.", end: "Avr.", role: "Assistante comptable", company: "Banque Avenir", description: "- Saisie et rapprochements bancaires\n- Suivi des fournisseurs" }],
    { start: "", end: "", degree: "Licence en Sciences Comptables", school: "Université de Kisangani", description: "Grande distinction" }),
  W("Marc", "KABAMBA", "Consultant Financier", "Consultant orienté résultats, j'accompagne les entreprises dans leurs décisions d'investissement et leur pilotage budgétaire.", "Kinshasa, RDC",
    ["Analyse financière", "Gestion budgétaire", "Modélisation", "Conseil", "Négociation"],
    [{ start: "Janv.", end: "Présent", role: "Consultant financier", company: "Cabinet Prospérité", description: "- Études de rentabilité et plans de financement\n- Accompagnement des dirigeants" },
     { start: "Août", end: "Déc.", role: "Analyste crédit", company: "Banque Centrale Commerciale", description: "- Évaluation des dossiers de crédit\n- Suivi des risques" }],
    { start: "", end: "", degree: "Master Finance d'Entreprise", school: "Université Protestante au Congo", description: "Mention Très bien" }),
];

/** CV d'exemple entièrement rempli, adapté au portrait (femme/homme) du modèle. Affichage uniquement. */
export function sampleCvFor(t: CvTemplate): CvData {
  const idx = Math.max(0, CV_MODEL_PHOTOS.indexOf(t.defaultPhoto ?? "")) % SAMPLE_PROFILES.length;
  return { photo: "", showPhoto: true, ...SAMPLE_PROFILES[idx]! };
}

const esc = (s: string) =>
  (s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

/** Paragraphs; lines starting with "-" or "•" become bullets. */
function rich(s: string, size = "9.5pt") {
  const ls = (s ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  let out = "";
  let ul: string[] = [];
  const flush = () => {
    if (ul.length) out += `<ul style="margin:2px 0 2px 16px;padding:0">${ul.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    ul = [];
  };
  for (const l of ls) {
    if (/^[-•]/.test(l)) ul.push(l.replace(/^[-•]\s*/, ""));
    else { flush(); out += `<div style="margin:1px 0;font-size:${size}">${esc(l)}</div>`; }
  }
  flush();
  return out;
}

const items = (arr: string[], prefix = "• ") =>
  arr.filter((x) => x.trim()).map((x) => `<div style="margin:3px 0">${esc(prefix)}${esc(x)}</div>`).join("");

interface Parts {
  photo: string;
  name: string;
  contacts: { label: string; value: string }[];
}

function parts(d: CvData, t?: CvTemplate): Parts {
  const contacts = [
    const ICONS = {
  phone: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  email: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  location: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  birth: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  civil: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  gender: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  license: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  link: `<svg style="display:inline-block;vertical-align:-2px;width:13px;height:13px;margin-right:5px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
};
    { label: "Adresse", value: d.address },
    { label: "E-mail", value: d.email },
    { label: "Téléphone", value: d.phone },
    { label: "Date de naissance", value: d.birth },
    { label: "Permis", value: d.license },
    { label: "Site web", value: d.website },
    { label: "Ville", value: [d.commune, d.city, d.postalCode].filter((x) => x?.trim()).join(", ") },
    ...Object.entries(d.extra ?? {}).map(([label, value]) => ({ label, value })),
  ].filter((c) => (c.value ?? "").trim());

  // Priorité : 1) Photo de l'utilisateur si renseignée ; 2) Photo modèle du CV ; 3) Silhouette neutre
  const noPhotoModel = t?.id === TEMPLATE_NO_PHOTO.id;
  const effectivePhoto = !d.showPhoto ? "" : noPhotoModel
    ? (d.photo && d.photo !== PLACEHOLDER_PHOTO ? d.photo : "")
    : d.showPhoto
    ? (d.photo && d.photo !== PLACEHOLDER_PHOTO
        ? d.photo
        : (t?.defaultPhoto || d.photo || PLACEHOLDER_PHOTO))
    : "";

  return { photo: effectivePhoto, name: `${esc(d.firstName)} ${esc(d.lastName)}`.trim(), contacts };
}

function experiences(d: CvData, t: CvTemplate, dateCol = true, roleColor = "#111") {
  return d.experiences.map((e) => dateCol
    ? `<div style="display:flex;gap:14px;margin:0 0 10px"><div style="width:78px;flex-shrink:0;font-size:8.5pt;color:#6b7280">${esc(e.start)}<br>${esc(e.end)}</div><div style="flex:1"><div style="font-weight:bold;text-transform:uppercase;font-size:9.5pt;color:${roleColor}">${esc(e.role)}${e.company ? " - " + esc(e.company) : ""}</div><div style="color:#4b5563">${rich(e.description)}</div></div></div>`
    : `<div style="margin:0 0 10px"><div style="font-size:8.5pt;color:#6b7280">${esc(formatCvPeriod(e.start, e.end))}</div><div style="font-weight:bold;font-size:10pt;color:${roleColor}">${esc(e.role)}</div><div style="font-weight:600;font-size:9.5pt;color:${t.accent}">${esc(e.company)}</div><div style="color:#4b5563">${rich(e.description)}</div></div>`).join("");
}

function education(d: CvData, t: CvTemplate, dateCol = true) {
  return d.education.map((e) => dateCol
    ? `<div style="display:flex;gap:14px;margin:0 0 8px"><div style="width:78px;flex-shrink:0;font-size:8.5pt;color:#6b7280">${esc(e.start)}<br>${esc(e.end)}</div><div style="flex:1"><div style="font-weight:bold;font-size:9.5pt">${esc(e.degree)}</div><div style="font-size:9pt;color:#4b5563;text-transform:uppercase">${esc(e.school)}</div>${rich(e.description)}</div></div>`
    : `<div style="margin:0 0 8px"><div style="font-size:8.5pt;color:#6b7280">${esc(formatCvPeriod(e.start, e.end))}</div><div style="font-weight:bold;font-size:10pt">${esc(e.degree)}</div><div style="font-weight:600;font-size:9.5pt;color:${t.accent}">${esc(e.school)}</div>${rich(e.description)}</div>`).join("");
}

function contactList(p: Parts, labelColor: string, valueColor: string, align = "left") {
  return p.contacts.map((c) => `<div style="margin:0 0 8px;text-align:${align}"><div style="font-weight:bold;font-size:9pt;color:${labelColor}">${c.label}</div><div style="font-size:9pt;color:${valueColor}">${esc(c.value)}</div></div>`).join("");
}

function sideBlocks(d: CvData, p: Parts, h: (s: string) => string, labelColor: string, valueColor: string, withContact = true) {
  return `${withContact && p.contacts.length ? h("Profil") + contactList(p, labelColor, valueColor) : ""}${d.skills.length ? h("Compétences") + items(d.skills) : ""}${d.languages.length ? h("Langues") + items(d.languages) : ""}${d.hobbies.length ? h("Loisirs") + items(d.hobbies) : ""}`;
}

export function formatCvPeriod(start: string, end: string): string {
  return [start, end].map((x) => (x ?? "").trim()).filter(Boolean).join(" \u2014 ");
}

const SHAPE_RADIUS = { square: "0", rounded: "14px", circle: "50%" } as const;

/** Applique couleur, police, forme de photo et rubriques ajoutées sans modifier le modèle d'origine. */
export function renderCvHtml(t0: CvTemplate, d: CvData): string {
  const safeColor = /^#[0-9a-f]{6}$/i.test(d.customColor || '') ? d.customColor : undefined;
  const safeFont = /^[a-z ]+$/i.test(d.customFont || '') ? d.customFont : undefined;
  const t: CvTemplate = { ...t0, primary: safeColor || t0.primary, accent: safeColor || t0.accent, font: safeFont || t0.font };
  let html = renderBase(t, d.titleAsHeading === false ? { ...d, title: '' } : d);
  if (d.photoShape) html = html.replace(/(<img src="[^"]*" alt="" style="[^"\n]*?)border-radius:[^;]*;/g, (_, prefix: string) => `${prefix}border-radius:${SHAPE_RADIUS[d.photoShape ?? 'square']};${d.photoShape === 'circle' ? 'aspect-ratio:1;height:auto;' : ''}`);
  const blocks = (d.sections ?? []).filter((x) => x.content.trim());
  if (!blocks.length && !d.signature?.trim()) return html;
  const h = (s: string) => `<div style="font-size:12pt;font-weight:bold;text-transform:uppercase;color:${t.primary};border-bottom:1.5px solid ${t.primary};padding-bottom:4px;margin:16px 0 8px">${esc(s)}</div>`;
  const extra = blocks.map((b) => h(b.title) + rich(b.content)).join("") + (d.signature?.trim() ? `<div style="margin-top:28px;text-align:right;font-style:italic">${esc(d.signature)}</div>` : "");
  return `<div style="width:794px;background:#fff">${html}<div style="font-family:'${t.font}',Arial,sans-serif;font-size:9.5pt;color:#1f2937;line-height:1.45;padding:10px 48px 40px">${extra}</div></div>`;
}

function renderBase(t: CvTemplate, d: CvData): string {
    const p = parts(d, t);
  const base = `font-family:'${t.font}',Arial,sans-serif;font-size:9.5pt;color:#1f2937;line-height:1.45;background:#fff;width:794px;min-height:1123px;box-sizing:border-box;overflow:hidden;`;
  const img = (w: number, h: number, radius = "0", extra = "") =>
    p.photo ? `<img src="${p.photo}" alt="" style="width:${w}px;height:${h}px;object-fit:cover;border-radius:${radius};display:block;${extra}">` : "";
  const exp = (h: (s: string) => string, dateCol = true, rc = "#111") => d.experiences.length ? h("Expériences professionnelles") + experiences(d, t, dateCol, rc) : "";
  const edu = (h: (s: string) => string, dateCol = true) => d.education.length ? h("Formations") + education(d, t, dateCol) : "";
  const summary = d.summary.trim() ? `<div style="color:#4b5563;margin:0 0 12px">${rich(d.summary)}</div>` : "";

  switch (t.layout) {
    case "bandeau-photo": {
      const pill = (s: string) => `<div style="background:${t.accent};color:#fff;text-align:center;font-size:12pt;letter-spacing:1px;padding:4px 10px;margin:16px 0 10px;text-transform:uppercase">${s}</div>`;
      const pillMain = (s: string) => `<div style="background:${t.accent};color:#fff;font-size:12pt;letter-spacing:1px;padding:4px 12px;margin:16px 0 10px;text-transform:uppercase">${s}</div>`;
      return `<div style="${base}position:relative"><div style="background:${t.primary};height:200px"></div><div style="position:absolute;top:36px;left:40px">${img(185, 218)}</div><div style="position:absolute;top:30px;left:310px;right:40px;color:#fff"><div style="font-size:30pt;letter-spacing:1px">${p.name.toUpperCase()}</div><div style="font-style:italic;font-family:Georgia,serif;font-size:15pt;margin-top:6px">${esc(d.title)}</div><div style="border-bottom:2px solid #fff;margin-top:14px"></div></div><div style="display:flex"><div style="width:240px;padding:${p.photo ? "70px" : "10px"} 24px 24px 26px">${sideBlocks(d, p, pill, "#111", "#6b7280")}</div><div style="flex:1;border-left:1.5px solid #9ca3af;padding:20px 32px 24px 26px">${summary}${exp(pillMain)}${edu(pillMain)}</div></div></div>`;
    }
    case "lateral-couleur": {
      const hs = (s: string) => `<div style="display:flex;align-items:center;gap:10px;margin:18px 0 8px;font-size:12pt;text-transform:uppercase;color:#fff">${s}<span style="flex:1;border-bottom:1.5px solid #fff"></span></div>`;
      const hm = (s: string) => `<div style="display:flex;align-items:center;gap:10px;margin:18px 0 8px;font-size:12pt;text-transform:uppercase;color:#374151">${s}<span style="flex:1;border-bottom:1.5px solid ${t.primary}"></span></div>`;
      return `<div style="${base}display:flex"><div style="width:290px;background:${t.primary};color:#fff;padding:30px 0 30px 30px">${p.photo ? `<div style="padding-right:30px">${img(210, 210, "50%", "border:4px solid #fff;margin:0 auto")}</div>` : ""}<div style="padding-right:0">${p.contacts.length ? hs("Contact") + p.contacts.map((c) => `<div style="margin:3px 0">• ${esc(c.value)}</div>`).join("") : ""}${d.skills.length ? hs("Compétences") + items(d.skills) : ""}${d.languages.length ? hs("Langues") + items(d.languages) : ""}${d.hobbies.length ? hs("Loisirs") + items(d.hobbies) : ""}</div></div><div style="flex:1;padding:40px 36px"><div style="font-size:28pt">${esc(d.firstName)} <b>${esc(d.lastName)}</b></div><div style="font-size:12pt;margin-top:6px;color:#374151">${esc(d.title)}</div>${d.summary ? hm("Profil") + summary : ""}${exp(hm, false)}${edu(hm, false)}</div></div>`;
    }
    case "lateral-bordeaux": {
      const color = t.primary || "#7a2838";
      const hSide = (title: string) => `
        <div style="font-size:11pt;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#ffffff;margin:22px 0 10px;padding-bottom:2px">
          ${esc(title)}
        </div>
      `;
      const hMain = (title: string) => `
        <div style="font-size:11.5pt;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${color};margin:20px 0 6px">
          ${esc(title)}
        </div>
        <div style="border-bottom:1.5px solid ${color};margin-bottom:12px"></div>
      `;

      // Langues avec jauge de niveau horizontale
      const langBlock = (d.languageItems && d.languageItems.length ? d.languageItems : d.languages.map(l => ({ name: l, level: "Opérationnel", percent: 75 }))).map(li => `
        <div style="margin:0 0 12px">
          <div style="font-weight:bold;font-size:9pt;color:#fff">${esc(li.name)}</div>
          <div style="height:4px;background:rgba(255,255,255,0.25);border-radius:2px;margin:3px 0 4px;overflow:hidden">
            <div style="height:100%;width:${li.percent ?? 75}%;background:#ffffff;border-radius:2px"></div>
          </div>
          <div style="font-size:8pt;color:#f3e8eb;font-style:italic">${esc(li.level)}</div>
          ${li.details ? `<div style="font-size:7.5pt;color:#e5d0d6;margin-top:1px">${esc(li.details)}</div>` : ''}
        </div>
      `).join("");

      return `
        <div style="${base}display:flex">
          <!-- Colonne gauche bordeaux -->
          <div style="width:280px;background:${color};color:#ffffff;padding:32px 24px;box-sizing:border-box">
            ${p.photo ? `
              <div style="text-align:center;margin-bottom:24px">
                <img src="${p.photo}" alt="" style="width:160px;height:160px;object-fit:cover;border-radius:50%;border:4px solid #ffffff;display:inline-block;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
              </div>
            ` : ""}
            
            ${d.summary.trim() ? `
              ${hSide("Profil Professionnel")}
              <div style="font-size:8.5pt;line-height:1.55;color:#ffffff;text-align:justify">
                ${rich(d.summary, "8.5pt")}
              </div>
            ` : ""}

            ${d.skills.length ? `
              ${hSide("Compétences")}
              <div style="font-size:8.5pt;color:#ffffff;line-height:1.55">
                ${d.skills.map(s => `<div style="margin:3px 0">• ${esc(s)}</div>`).join("")}
              </div>
            ` : ""}

            ${(d.languages.length || (d.languageItems && d.languageItems.length)) ? `
              ${hSide("Langues")}
              ${langBlock}
            ` : ""}
          </div>

          <!-- Colonne droite blanche -->
          <div style="flex:1;padding:34px 34px 28px;box-sizing:border-box">
            <!-- Nom et Titre -->
            <div style="margin-bottom:12px">
              <div style="font-size:32pt;font-weight:900;color:${color};line-height:1.05;letter-spacing:-0.5px">
                ${esc(d.firstName)}<br>${esc(d.lastName)}
              </div>
              <div style="font-size:11pt;letter-spacing:3px;text-transform:uppercase;color:#4b5563;font-weight:600;margin-top:8px">
                ${esc(d.title)}
              </div>
            </div>

            <!-- Coordonnées avec icônes -->
            <div style="font-size:8.5pt;color:#4b5563;margin-bottom:16px;line-height:1.7">
              ${d.phone ? `<div>${ICONS.phone} ${esc(d.phone)}</div>` : ""}
              ${d.email ? `<div>${ICONS.email} ${esc(d.email)}</div>` : ""}
              ${(d.address || d.city) ? `<div>${ICONS.location} ${esc([d.address, d.postalCode, d.city, d.commune].filter(Boolean).join(", "))}</div>` : ""}
              ${d.birth ? `<div>${ICONS.birth} ${esc(d.birth)}</div>` : ""}
              ${d.civilStatus ? `<div>${ICONS.civil} ${esc(d.civilStatus)}</div>` : ""}
              ${d.gender ? `<div>${ICONS.gender} ${esc(d.gender)}</div>` : ""}
              ${d.license ? `<div>${ICONS.license} ${esc(d.license)}</div>` : ""}
              ${d.website ? `<div>${ICONS.link} ${esc(d.website)}</div>` : ""}
            </div>

            <!-- Formation -->
            ${d.education.length ? `
              ${hMain("Formation")}
              ${d.education.map(e => `
                <div style="margin:0 0 12px">
                  <div style="font-size:8.5pt;color:#6b7280;font-weight:600">${esc(e.start || '')}</div>
                  <div style="font-weight:bold;font-size:9.5pt;color:#111">${esc(e.school)}</div>
                  <div style="font-size:9pt;color:#374151">${esc(e.degree)}</div>
                  ${e.description ? `<div style="color:#6b7280;font-size:8.5pt;margin-top:2px">${rich(e.description, "8.5pt")}</div>` : ""}
                </div>
              `).join("")}
            ` : ""}

            <!-- Parcours Professionnel -->
            ${d.experiences.length ? `
              ${hMain("Parcours Professionnel")}
              ${d.experiences.map(e => `
                <div style="margin:0 0 14px">
                  <div style="font-size:8.5pt;color:#6b7280;font-weight:600">${esc(formatCvPeriod(e.start, e.end))}</div>
                  <div style="font-weight:bold;font-size:9.5pt;color:#111">${esc(e.company)}</div>
                  <div style="font-weight:600;font-size:9pt;color:#374151;margin-bottom:2px">${esc(e.role)}</div>
                  <div style="color:#4b5563;font-size:8.5pt;line-height:1.45">${rich(e.description, "8.5pt")}</div>
                </div>
              `).join("")}
            ` : ""}

            <!-- Centres d'intérêt -->
            ${d.hobbies.length ? `
              ${hMain("Centres d'intérêt")}
              <div style="font-size:8.5pt;color:#4b5563;line-height:1.55">
                ${d.hobbies.map(h => `<div style="margin:2px 0">• ${esc(h)}</div>`).join("")}
              </div>
            ` : ""}
          </div>
        </div>
      `;
    }  
    case "lateral-gris": {
      const h = (s: string) => `<div style="font-size:12pt;margin:16px 0 8px;color:#111;text-transform:none">${s}</div>`;
      const hm = (s: string) => `<div style="font-size:12pt;margin:18px 0 10px;padding-bottom:6px;border-bottom:1.5px solid #111;text-transform:uppercase;color:${t.accent === t.primary ? "#111" : t.accent}">${s}</div>`;
      return `<div style="${base}display:flex"><div style="width:250px;background:#f1f1f1;padding:24px 22px;border-right:1px solid #9ca3af">${img(206, 210)}<div style="text-align:center;margin-top:16px;font-size:13pt;font-weight:bold;text-transform:uppercase">${p.name}</div><div style="text-align:center;font-size:9pt;text-transform:uppercase;color:${t.primary};margin-bottom:12px">${esc(d.title)}</div>${contactList(p, "#111", "#4b5563")}${d.skills.length ? h("Compétences") + items(d.skills) : ""}${d.languages.length ? h("Langues") + items(d.languages) : ""}${d.hobbies.length ? h("Loisirs") + items(d.hobbies) : ""}</div><div style="flex:1;padding:24px 30px">${d.summary ? hm("À propos de moi") + summary : ""}${exp(hm)}${edu(hm)}</div></div>`;
    }
    case "diagonal": {
      const h = (s: string) => `<div style="font-size:12pt;font-weight:bold;margin:16px 0 8px;color:#111">${s}</div>`;
      const hm = (s: string) => `<div style="font-size:12pt;font-weight:bold;margin:18px 0 8px;color:${t.primary}">${s}</div>`;
      return `<div style="${base}position:relative"><div style="position:absolute;top:0;left:0;right:0;height:150px;background:${t.primary};clip-path:polygon(0 0,100% 0,100% 30%,0 100%)"></div><div style="position:absolute;top:0;left:0;width:300px;height:90px;background:#1f2937;clip-path:polygon(0 0,100% 0,0 100%)"></div><div style="display:flex;position:relative"><div style="width:250px;background:#f3f4f6;min-height:1123px;padding:40px 22px 24px">${img(200, 240, "12px")}${sideBlocks(d, p, h, "#111", "#4b5563")}</div><div style="flex:1;padding:120px 32px 24px"><div style="font-size:26pt;font-weight:bold;color:#111">${p.name}</div><div style="font-size:12pt;color:#6b7280;margin-bottom:10px">${esc(d.title)}</div>${summary}${exp(hm, false)}${edu(hm, false)}</div></div></div>`;
    }
    case "bandeau-sombre": {
      const h = (s: string) => `<div style="font-size:12pt;font-weight:bold;margin:18px 0 8px;text-transform:uppercase;color:#111">${s}</div>`;
      return `<div style="${base}"><div style="background:${t.primary};height:60px"></div><div style="display:flex;margin-top:-40px"><div style="width:250px;padding:0 24px 24px 50px">${img(150, 180)}${sideBlocks(d, p, h, "#111", "#4b5563")}</div><div style="flex:1;padding:70px 36px 24px 20px"><div style="font-size:24pt;font-weight:bold;text-transform:uppercase">${p.name}</div><div style="font-size:12pt;margin:4px 0 12px">${esc(d.title)}</div><div style="border-bottom:1px solid #9ca3af;margin-bottom:10px"></div>${summary}${exp(h)}${edu(h)}</div></div></div>`;
    }
    case "entete-arrondi": {
      const h = (s: string) => `<div style="font-size:12pt;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid ${t.primary};text-transform:uppercase;color:${t.primary}">${s}</div>`;
      return `<div style="${base}"><div style="background:${t.primary};color:#fff;padding:24px 34px;display:flex;gap:22px;align-items:center;border-radius:0 0 24px 24px">${img(120, 120, "50%", "border:4px solid #fff")}<div style="flex:1"><div style="font-size:22pt;font-weight:bold;text-transform:uppercase">${p.name}</div><div style="font-size:14pt">${esc(d.title)}</div></div><div style="font-size:8.5pt;text-align:right">${p.contacts.map((c) => esc(c.value)).join("<br>")}</div></div><div style="padding:14px 34px;background:#ecfeff">${summary}</div><div style="display:flex;gap:28px;padding:0 34px 24px"><div style="flex:1.4">${exp(h, false)}</div><div style="flex:1">${edu(h, false)}${d.skills.length ? h("Compétences") + items(d.skills) : ""}${d.languages.length ? h("Langues") + items(d.languages) : ""}${d.hobbies.length ? h("Loisirs") + items(d.hobbies) : ""}</div></div></div>`;
    }
    case "lateral-plein": {
      const h = (s: string) => `<div style="font-size:12pt;font-weight:bold;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #fff;text-transform:uppercase;color:#fff">${s}</div>`;
      const hm = (s: string) => `<div style="font-size:11pt;font-weight:bold;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid ${t.primary};text-transform:uppercase;color:${t.primary}">${s}</div>`;
      return `<div style="${base}display:flex"><div style="width:260px;background:${t.primary};color:#fff;padding:24px 24px">${img(212, 220)}${sideBlocks(d, p, h, "#fff", "#fff")}</div><div style="flex:1;padding:24px 30px"><div style="font-size:24pt;font-weight:bold;text-transform:uppercase">${p.name}</div><div style="font-size:12pt;text-transform:uppercase;margin-bottom:10px">${esc(d.title)}</div>${summary}${exp(hm)}${edu(hm)}</div></div>`;
    }
    case "elegant": {
      const h = (s: string) => `<div style="font-size:12pt;letter-spacing:4px;margin:20px 0 8px;padding:8px 0 4px;border-top:1px solid #111;text-transform:uppercase;text-align:right">${s}</div>`;
      const hm = (s: string) => `<div style="font-size:12pt;letter-spacing:3px;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #111;text-transform:uppercase">${s}</div>`;
      return `<div style="${base}display:flex;padding:30px"><div style="width:250px;padding-right:24px;text-align:right">${img(250, 240)}${p.contacts.length ? h("Contact") + p.contacts.map((c) => `<div style="margin:4px 0">${esc(c.value)}</div>`).join("") : ""}${d.skills.length ? h("Compétences") + items(d.skills, "") : ""}${d.languages.length ? h("Langues") + items(d.languages, "") : ""}${d.hobbies.length ? h("Centres d'intérêt") + items(d.hobbies, "") : ""}</div><div style="flex:1;padding-left:10px"><div style="font-size:28pt;color:#111">${esc(d.firstName)} ${esc(d.lastName).toUpperCase()}</div><div style="letter-spacing:4px;text-transform:uppercase;margin:26px 0 6px;color:${t.accent}">${esc(d.title)}</div>${summary}${exp(hm, false)}${edu(hm, false)}</div></div>`;
    }
    case "arche": {
      const h = (s: string) => `<div style="font-family:Georgia,serif;font-size:13pt;margin:18px 0 8px;color:#111">${s}</div>`;
      const hm = (s: string) => `<div style="font-family:Georgia,serif;font-size:13pt;margin:18px 0 8px;color:#111">${s}</div>`;
      return `<div style="${base}display:flex;background:#f5f0ee"><div style="width:250px;background:${t.primary};border-radius:0 140px 0 0;padding:24px 22px">${img(200, 220, "14px")}<div style="margin-top:14px">${contactList(p, "#111", "#1f2937")}</div>${d.skills.length ? h("Compétences") + items(d.skills) : ""}${d.languages.length ? h("Langues") + items(d.languages) : ""}${d.hobbies.length ? h("Loisirs") + items(d.hobbies) : ""}</div><div style="flex:1;padding:30px 32px"><div style="font-family:Georgia,serif;font-size:28pt;text-transform:uppercase">${p.name}</div><div style="font-size:12pt;font-weight:bold;margin-bottom:10px">${esc(d.title)}</div>${summary}${exp(hm, false)}${edu(hm, false)}</div></div>`;
    }
    case "classique-filet": {
      const h = (s: string) => `<div style="font-size:12pt;font-weight:bold;margin:16px 0 6px;color:${t.primary};text-transform:uppercase;border-left:4px solid ${t.primary};padding-left:8px">${s}</div>`;
      return `<div style="${base}padding:44px 50px"><div style="display:flex;gap:20px;align-items:center;border-bottom:2px solid ${t.primary};padding-bottom:12px">${img(90, 110)}<div><div style="font-size:24pt;font-weight:bold;color:${t.primary}">${p.name}</div><div style="font-size:12pt;font-style:italic">${esc(d.title)}</div><div style="font-size:9pt;color:#4b5563">${p.contacts.map((c) => esc(c.value)).join(" · ")}</div></div></div>${d.summary ? h("Profil") + summary : ""}${exp(h)}${edu(h)}${d.skills.length ? h("Compétences") + `<div>${d.skills.map(esc).join(" · ")}</div>` : ""}${d.languages.length ? h("Langues") + `<div>${d.languages.map(esc).join(" · ")}</div>` : ""}${d.hobbies.length ? h("Loisirs") + `<div>${d.hobbies.map(esc).join(" · ")}</div>` : ""}</div>`;
    }
    default: {
      const h = (s: string) => `<div style="font-size:12pt;font-weight:bold;margin:16px 0 6px;color:${t.primary};text-transform:uppercase;letter-spacing:2px;text-align:center;border-bottom:1px solid ${t.primary};padding-bottom:3px">${s}</div>`;
      return `<div style="${base}padding:44px 56px"><div style="text-align:center">${p.photo ? img(96, 116, "4px", "margin:0 auto 8px") : ""}<div style="font-size:24pt;font-weight:bold;color:${t.primary};letter-spacing:1px">${p.name}</div><div style="font-size:12pt;font-style:italic">${esc(d.title)}</div><div style="font-size:9pt;color:#4b5563">${p.contacts.map((c) => esc(c.value)).join(" · ")}</div></div>${d.summary ? h("Profil") + summary : ""}${exp(h)}${edu(h)}${d.skills.length ? h("Compétences") + `<div style="text-align:center">${d.skills.map(esc).join(" · ")}</div>` : ""}${d.languages.length ? h("Langues") + `<div style="text-align:center">${d.languages.map(esc).join(" · ")}</div>` : ""}${d.hobbies.length ? h("Loisirs") + `<div style="text-align:center">${d.hobbies.map(esc).join(" · ")}</div>` : ""}</div>`;
    }
  }
}
