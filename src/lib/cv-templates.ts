export type CvLayout = "classic" | "sidebar" | "banner" | "minimal" | "split";

export interface CvTemplate {
  id: string;
  name: string;
  category: string;
  layout: CvLayout;
  primary: string;
  accent: string;
  font: string;
  premium: boolean;
}

export interface CvData {
  fullName: string;
  title: string;
  email: string;
  location: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
}

export const CV_CATEGORIES = [
  "Classiques", "Modernes", "Exécutifs", "Juridiques", "Universitaires", "Créatifs",
  "Techniques", "Santé", "Enseignement", "Finance", "Administratifs", "Premier emploi",
];

const LAYOUTS: CvLayout[] = ["classic", "sidebar", "banner", "minimal", "split"];
const PALETTES: [string, string][] = [
  ["#1e3a8a", "#c9a227"], ["#0f172a", "#2563eb"], ["#14532d", "#84cc16"], ["#7f1d1d", "#f59e0b"],
  ["#312e81", "#22d3ee"], ["#334155", "#0ea5e9"], ["#3f3f46", "#e11d48"], ["#134e4a", "#14b8a6"],
  ["#1c1917", "#d97706"], ["#082f49", "#38bdf8"],
];
const FONTS = ["Times New Roman", "Georgia", "Arial", "Calibri", "Garamond"];
const NAMES = ["Horizon", "Prestige", "Élan", "Atlas", "Clarté", "Lumière", "Sommet", "Vertex", "Équilibre", "Signature"];

export const CV_TEMPLATES: CvTemplate[] = CV_CATEGORIES.flatMap((category, c) =>
  NAMES.map((n, i) => ({
    id: `cv-${c + 1}-${i + 1}`,
    name: `${n} ${category.split(" ")[0]}`,
    category,
    layout: LAYOUTS[(i + c) % LAYOUTS.length],
    primary: PALETTES[(i + c * 3) % PALETTES.length][0],
    accent: PALETTES[(i + c * 3) % PALETTES.length][1],
    font: FONTS[(i + c) % FONTS.length],
    premium: i >= 5,
  })),
);

export const SAMPLE_CV: CvData = {
  fullName: "Votre Nom Complet",
  title: "Intitulé du poste visé",
  email: "vous@exemple.com",
  location: "Ville, Pays",
  summary: "Professionnel(le) rigoureux(se) et motivé(e), avec une solide capacité d'analyse et un sens aigu des résultats.",
  experience: "Poste — Entreprise (période)\nRéalisation principale mesurable\nResponsabilité clé",
  education: "Diplôme — Établissement (période)",
  skills: "Communication, Gestion de projet, Bureautique, Travail en équipe",
  languages: "Français (courant), Anglais (intermédiaire)",
};

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
const lines = (s: string) => esc(s).split("\n").filter(Boolean).map((l) => `<div style="margin:2px 0">${l}</div>`).join("");
const list = (s: string) => esc(s).split(",").map((x) => x.trim()).filter(Boolean).map((x) => `<li>${x}</li>`).join("");

export function renderCvHtml(t: CvTemplate, d: CvData): string {
  const h = (label: string) => `<h3 style="color:${t.primary};border-bottom:2px solid ${t.accent};font-size:13pt;margin:14px 0 6px;padding-bottom:2px;text-transform:uppercase;letter-spacing:1px">${label}</h3>`;
  const contact = `${esc(d.email)} · ${esc(d.location)}`;
  const main = `${h("Profil")}<p style="margin:0">${esc(d.summary)}</p>${h("Expérience")}${lines(d.experience)}${h("Formation")}${lines(d.education)}`;
  const side = `${h("Compétences")}<ul style="margin:0;padding-left:16px">${list(d.skills)}</ul>${h("Langues")}<ul style="margin:0;padding-left:16px">${list(d.languages)}</ul>`;
  const base = `font-family:'${t.font}',serif;font-size:11pt;color:#1f2937;line-height:1.45;background:#fff;`;
  const name = (color: string) => `<h1 style="margin:0;font-size:24pt;color:${color}">${esc(d.fullName)}</h1><div style="font-size:13pt;color:${t.accent};font-weight:bold">${esc(d.title)}</div>`;
  switch (t.layout) {
    case "sidebar":
      return `<div style="${base}display:flex;min-height:100%"><div style="width:34%;background:${t.primary};color:#fff;padding:24px">${name("#fff")}<p style="font-size:9.5pt">${contact}</p><div style="color:#fff">${side.replaceAll(`color:${t.primary}`, "color:#fff")}</div></div><div style="flex:1;padding:24px">${main}</div></div>`;
    case "banner":
      return `<div style="${base}"><div style="background:${t.primary};padding:26px">${name("#fff")}<div style="color:#fff;font-size:9.5pt">${contact}</div></div><div style="padding:24px">${main}${side}</div></div>`;
    case "split":
      return `<div style="${base}padding:28px">${name(t.primary)}<div style="font-size:9.5pt">${contact}</div><div style="display:flex;gap:24px"><div style="flex:2">${main}</div><div style="flex:1">${side}</div></div></div>`;
    case "minimal":
      return `<div style="${base}padding:36px;text-align:left"><div style="border-left:6px solid ${t.accent};padding-left:14px">${name(t.primary)}<div style="font-size:9.5pt">${contact}</div></div>${main}${side}</div>`;
    default:
      return `<div style="${base}padding:32px"><div style="text-align:center">${name(t.primary)}<div style="font-size:9.5pt">${contact}</div></div>${main}${side}</div>`;
  }
}
