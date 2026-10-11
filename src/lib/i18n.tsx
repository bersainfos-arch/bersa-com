import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "en";

const dict = {
  home: { fr: "Accueil", en: "Home" },
  ai: { fr: "Assistant", en: "Assistant" },
  writing: { fr: "Rédaction", en: "Writing" },
  academy: { fr: "Formations", en: "Academy" },
  library: { fr: "Bibliothèque", en: "Library" },
  admin: { fr: "Gestion", en: "Manager" },
  profile: { fr: "Profil", en: "Profile" },
  slogan: { fr: "Notre devoir est d'acquérir le savoir", en: "Our duty is to acquire knowledge" },
  heroText: {
    fr: "Rédaction académique, juridique et administrative, formations pratiques et bibliothèque intelligente — au service des étudiants, chercheurs et entrepreneurs.",
    en: "Academic, legal and administrative writing, practical training and a smart library — serving students, researchers and entrepreneurs.",
  },
  ctaOrder: { fr: "Commander un document", en: "Order a document" },
  domains: { fr: "Nos domaines", en: "Our fields" },
  seePrice: { fr: "Voir le tarif", en: "See price" },
  order: { fr: "Commander", en: "Order" },
  enroll: { fr: "S'inscrire", en: "Enroll" },
  online: { fr: "En ligne", en: "Online" },
  onsite: { fr: "En présentiel", en: "On-site" },
  fullName: { fr: "Nom complet", en: "Full name" },
  phone: { fr: "Téléphone / WhatsApp", en: "Phone / WhatsApp" },
  email: { fr: "E-mail", en: "Email" },
  details: { fr: "Détails de votre demande", en: "Request details" },
  attachment: { fr: "Lien vers vos fichiers (Drive, WeTransfer…)", en: "Link to your files (Drive, WeTransfer…)" },
  send: { fr: "Envoyer", en: "Send" },
  loginToOrder: { fr: "Connectez-vous pour commander", en: "Sign in to order" },
  sent: { fr: "Demande envoyée ! Nous vous contactons très vite.", en: "Request sent! We'll contact you soon." },
  askAi: { fr: "Assistant BERSA", en: "BERSA Assistant" },
  askPlaceholder: { fr: "Posez votre question…", en: "Ask your question…" },
  myOrders: { fr: "Mes commandes et formations", en: "My orders and courses" },
  signIn: { fr: "Se connecter", en: "Sign in" },
  signUp: { fr: "Créer un compte", en: "Create account" },
  signOut: { fr: "Se déconnecter", en: "Sign out" },
  password: { fr: "Mot de passe", en: "Password" },
  google: { fr: "Continuer avec Google", en: "Continue with Google" },
  free: { fr: "Accès libre", en: "Free access" },
} as const;

export type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "fr",
  setLang: () => {},
  t: (k) => dict[k].fr,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const s = localStorage.getItem("bersa-lang");
    if (s === "en" || s === "fr") setLangState(s);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("bersa-lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
