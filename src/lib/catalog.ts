export const WHATSAPP = "243818147637";
export const waLink = (phone: string, text = "") =>
  `https://wa.me/${phone.replace(/[^\d]/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export type Service = { name: string; nameEn: string; price: string; priceNum: number | null; desc: string };
export const serviceGroups: { title: string; titleEn: string; items: Service[] }[] = [
  {
    title: "Universitaires",
    titleEn: "Academic",
    items: [
      { name: "Mémoires universitaires et documents proches", nameEn: "University dissertations", price: "70 $", priceNum: 70, desc: "Licence, master, TFC — rédaction et encadrement." },
      { name: "Thèses de doctorat", nameEn: "Doctoral theses", price: "400 $", priceNum: 400, desc: "Accompagnement complet, méthodologie et rédaction." },
      { name: "Articles scientifiques et communications", nameEn: "Scientific articles", price: "80 $", priceNum: 80, desc: "Articles, communications et rectifications." },
      { name: "Rapports de stage et TFE", nameEn: "Internship reports", price: "Prix abordable", priceNum: null, desc: "Rapports structurés et soignés." },
    ],
  },
  {
    title: "Administratifs",
    titleEn: "Administrative",
    items: [
      { name: "Correspondances administratives officielles", nameEn: "Official correspondence", price: "25 $", priceNum: 25, desc: "Lettres, demandes, notes officielles." },
      { name: "CV professionnels", nameEn: "Professional CVs", price: "Prix abordable", priceNum: null, desc: "CV et lettres de motivation percutants." },
    ],
  },
  {
    title: "Juridiques OHADA",
    titleEn: "Legal (OHADA)",
    items: [
      { name: "Actes juridiques usuels", nameEn: "Common legal acts", price: "30 $", priceNum: 30, desc: "Contrats, procurations, attestations." },
      { name: "Statuts de société conformes OHADA", nameEn: "OHADA company bylaws", price: "250 $", priceNum: 250, desc: "SARL, SA, SAS — conformes à l'Acte uniforme." },
    ],
  },
  {
    title: "Entrepreneuriat",
    titleEn: "Entrepreneurship",
    items: [
      { name: "Business Plans", nameEn: "Business plans", price: "Prix abordable", priceNum: null, desc: "Plans d'affaires pour financements et projets." },
    ],
  },
];

export const courses = [
  { name: "Méthodologie de la recherche scientifique", nameEn: "Research methodology" },
  { name: "Rédaction administrative et juridique", nameEn: "Administrative & legal writing" },
  { name: "Intelligence artificielle appliquée", nameEn: "Applied artificial intelligence" },
  { name: "Création et gestion d'entreprise (OHADA)", nameEn: "Starting a business (OHADA)" },
  { name: "Bureautique et outils numériques", nameEn: "Office & digital tools" },
  { name: "Prise de parole et soutenance", nameEn: "Public speaking & defense" },
];

export const domains = [
  { fr: "Droit", en: "Law" },
  { fr: "Économie", en: "Economics" },
  { fr: "Intelligence artificielle", en: "Artificial intelligence" },
  { fr: "Ingénierie", en: "Engineering" },
  { fr: "Santé", en: "Health" },
  { fr: "Sciences", en: "Sciences" },
];

export const books = [
  { title: "Introduction au droit OHADA", domain: "Droit", price: "10 $" },
  { title: "Droit des contrats", domain: "Droit", price: null },
  { title: "Principes de microéconomie", domain: "Économie", price: "8 $" },
  { title: "Finance d'entreprise", domain: "Économie", price: "12 $" },
  { title: "IA : fondamentaux et usages", domain: "Intelligence artificielle", price: "15 $" },
  { title: "Apprentissage automatique pratique", domain: "Intelligence artificielle", price: null },
  { title: "Résistance des matériaux", domain: "Ingénierie", price: "10 $" },
  { title: "Santé publique en Afrique", domain: "Santé", price: null },
  { title: "Méthodologie scientifique", domain: "Sciences", price: "5 $" },
];
