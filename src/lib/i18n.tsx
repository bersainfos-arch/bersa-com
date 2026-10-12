import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isLang, languageStorageKey, preferredLanguage, type Lang } from "./languages";
import { activateUiLanguage, translateUi } from "./translate-ui";

export type { Lang } from "./languages";

const dict = {
  home: { fr: "Accueil", en: "Home" },
  ai: { fr: "Assistant", en: "Assistant" },
  docs: { fr: "Documents", en: "Documents" },
  writing: { fr: "Rédaction", en: "Writing" },
  academy: { fr: "Formations", en: "Academy" },
  library: { fr: "Bibliothèque", en: "Library" },
  admin: { fr: "Gestion", en: "Manager" },
  profile: { fr: "Profil", en: "Profile" },
  plans: { fr: "Abonnements", en: "Plans" },
  jobs: { fr: "Opportunités", en: "Opportunities" },
  dashboard: { fr: "Tableau de bord", en: "Dashboard" },
  slogan: { fr: "Le berceau du savoir, au service de votre plume", en: "The cradle of knowledge, serving your pen" },
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
  const userId = useRef<string | undefined>(undefined);
  const revision = useRef(0);
  const loaders = import.meta.glob<{ default: Record<string, string> }>("./locales/*.json");
  const apply = async (language: Lang) => {
    const ticket = ++revision.current;
    const loader = loaders[`./locales/${language}.json`];
    if (!loader) return;
    try {
      const module = await loader();
      if (ticket !== revision.current) return;
      activateUiLanguage(language, module.default);
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" || language === "ur" ? "rtl" : "ltr";
      setLangState(language);
    } catch { toast.error("Impossible de charger cette langue. Réessayez."); }
  };
  useEffect(() => {
    let active = true;
    const restore = (user: { id: string; user_metadata: Record<string, unknown> } | null) => {
      if (!active) return;
      userId.current = user?.id;
      const local = localStorage.getItem(languageStorageKey(user?.id));
      void apply(preferredLanguage(user?.user_metadata['preferred_language'], local));
    };
    void apply(preferredLanguage(undefined, localStorage.getItem(languageStorageKey())));
    void supabase.auth.getSession().then(({ data }) => restore(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Avoid invoking auth requests inside the synchronous auth callback.
      queueMicrotask(() => restore(session?.user ?? null));
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  const setLang = (l: Lang) => {
    if (!isLang(l)) return;
    localStorage.setItem(languageStorageKey(userId.current), l);
    void apply(l);
    if (userId.current) void supabase.auth.updateUser({ data: { preferred_language: l } }).then(({ error }) => {
      if (error) toast.error(translateUi("Langue conservée sur cet appareil ; synchronisation du compte impossible.") as string);
    });
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => translateUi(dict[k].fr) as string }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
