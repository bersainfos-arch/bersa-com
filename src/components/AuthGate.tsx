import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Vrai logo officiel Google aux 4 couleurs
function GoogleLogo() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

// Panneau centré avec l'en-tête officiel présent sur toutes les étapes
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4 py-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 sm:p-8 shadow-soft border border-border/40 space-y-4">
        {/* En-tête : logo à gauche, BERSA à droite et Berceau du savoir avec B majuscule */}
        <div className="flex items-center justify-center gap-2.5 pb-1">
          <img
            src="/logo.png"
            alt="Logo officiel BERSA"
            className="w-12 h-12 object-contain rounded-xl shadow-xs"
          />
          <div className="flex flex-col leading-none">
            <span className="text-foreground font-extrabold text-[22px] tracking-normal leading-none">
              BERSA
            </span>
            <span className="text-muted-foreground text-[8px] font-semibold mt-1 leading-none tracking-tight">
              Berceau du savoir
            </span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// Sécurisation transparente du mot de passe dès 4 caractères
function formatAuthPassword(pass: string): string {
  if (pass.length >= 6) return pass;
  return `${pass}__bersa`;
}

// Normalisation universelle du numéro de téléphone
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "243" + digits.slice(1);
  if (digits.length === 9 && (digits.startsWith("8") || digits.startsWith("9"))) {
    return "243" + digits;
  }
  return digits;
}

function SignForm() {
  // Navigation entre les vues : "menu" (Étape 1), "step2", "step3", "signin"
  const [view, setView] = useState<"menu" | "step2" | "step3" | "signin">("menu");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Étape 2 : Identité
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<"Femme" | "Homme" | "">("");

  // Étape 3 : Coordonnées et sécurité
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");

  // Mode connexion (anciens utilisateurs)
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Passage de l'Étape 2 à l'Étape 3
  function handleStep2Next(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez renseigner votre prénom et votre nom de famille.");
      return;
    }
    const d = Number(day), m = Number(month), y = Number(year);
    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > new Date().getFullYear()) {
      toast.error("Veuillez indiquer une date de naissance valide (Jour / Mois / Année).");
      return;
    }
    if (!gender) {
      toast.error("Veuillez sélectionner votre genre (Femme ou Homme).");
      return;
    }
    setView("step3");
  }

  // Enregistrement final (Étape 3) -> Accès direct à l'accueil
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const phoneDigits = normalizePhone(phoneInput);

    if (phoneDigits.length < 8) {
      toast.error("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    if (passwordInput.length < 4) {
      toast.error("Le mot de passe doit comporter au moins 4 lettres ou chiffres.");
      return;
    }

    if (passwordInput !== confirmInput) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setBusy(true);
    const authPass = formatAuthPassword(passwordInput);

    // E-mail facultatif : si fourni on l'utilise, sinon e-mail technique lié au numéro
    const trimmedEmail = emailInput.trim().toLowerCase();
    const primaryAuthEmail = trimmedEmail ? trimmedEmail : `tel_${phoneDigits}@bersa.cd`;

    const birthDateISO = `${year.padStart(4, "20")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const meta = {
      first_name: firstName.trim().slice(0, 80),
      last_name: lastName.trim().slice(0, 80),
      birth_date: birthDateISO,
      gender,
      phone_private: `+${phoneDigits}`,
    };

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: primaryAuthEmail,
      password: authPass,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      // Si déjà inscrit, connexion automatique
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: primaryAuthEmail,
        password: authPass,
      });
      setBusy(false);
      if (signInErr) {
        toast.error(signUpError.message);
      } else {
        window.location.href = "/";
      }
      return;
    }

    if (signUpData.user) {
      await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        first_name: firstName.trim().slice(0, 80),
        last_name: lastName.trim().slice(0, 80),
        email: trimmedEmail || null,
        birth_date: birthDateISO,
      });
    }

    // Connexion immédiate sans confirmation bloquante
    await supabase.auth.signInWithPassword({
      email: primaryAuthEmail,
      password: authPass,
    });

    setBusy(false);
    window.location.href = "/";
  }

  // Connexion des anciens utilisateurs
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      toast.error("Veuillez renseigner votre identifiant et mot de passe.");
      return;
    }

    setBusy(true);
    const authPass = formatAuthPassword(loginPassword);
    const raw = loginIdentifier.trim().toLowerCase();

    // 1. Essai direct (e-mail ou identifiant saisi)
    const { error: err1 } = await supabase.auth.signInWithPassword({
      email: raw,
      password: authPass,
    });

    if (!err1) {
      setBusy(false);
      window.location.href = "/";
      return;
    }

    // 2. Essai via numéro de téléphone normalisé
    const phoneNorm = normalizePhone(raw);
    const { error: err2 } = await supabase.auth.signInWithPassword({
      email: `tel_${phoneNorm}@bersa.cd`,
      password: authPass,
    });

    if (!err2) {
      setBusy(false);
      window.location.href = "/";
      return;
    }

    // 3. Repli mot de passe d'origine
    const { error: err3 } = await supabase.auth.signInWithPassword({
      email: `tel_${phoneNorm}@bersa.cd`,
      password: loginPassword,
    });

    setBusy(false);
    if (err3) {
      toast.error("Identifiant ou mot de passe incorrect.");
    } else {
      window.location.href = "/";
    }
  }

  // Managed Google flow also establishes the existing account session.
    async function google() {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          extraParams: { prompt: "select_account" },
        });
        if (result.error) toast.error("Connexion Google indisponible. Veuillez réessayer.");
      }
    } catch {
      toast.error("Connexion Google indisponible. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
    }

  async function forgot() {
    const raw = window.prompt("Votre adresse e-mail pour réinitialiser votre mot de passe :")?.trim();
    if (!raw) return;
    const { error } = await supabase.auth.resetPasswordForEmail(raw, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Un lien de réinitialisation vous a été envoyé.");
            }
    return (
    <>
      {/* ========================================================
          PREMIÈRE ÉTAPE : 3 GRANDS BOUTONS CLAIRS SANS SUIVANT
          ======================================================== */}
      {view === "menu" && (
        <div className="space-y-4 pt-1 pb-1">
          <div className="text-center pb-1">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Bienvenue sur BERSA
            </h2>
          </div>

          {/* 1. Grand bouton bleu principal : Créer votre compte */}
          <Button
            type="button"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-4 sm:py-5 text-base sm:text-lg font-bold rounded-2xl shadow-md transition-all flex items-center justify-center"
            onClick={() => setView("step2")}
          >
            Créer votre compte
          </Button>

          {/* 2. Grand bouton : S'inscrire avec Google */}
          <Button
            type="button"
            variant="outline"
            className="google-sign-in w-full h-12 px-3 gap-2.5 text-sm font-medium rounded-2xl flex items-center justify-center"
            disabled={busy}
            onClick={google}
          >
            <GoogleLogo />
            S'inscrire avec Google
          </Button>

          {/* 3. Grand bouton : Déjà inscrit ? Se connecter */}
          <Button
            type="button"
            variant="outline"
            className="w-full py-4 sm:py-4.5 text-base font-semibold rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all flex items-center justify-center"
            onClick={() => setView("signin")}
          >
            Déjà inscrit ? Se connecter
          </Button>
        </div>
      )}

      {/* ========================================================
          DEUXIÈME ÉTAPE : IDENTITÉ (SANS BOUTON GOOGLE NI DÉJÀ INSCRIT)
          ======================================================== */}
      {view === "step2" && (
        <form onSubmit={handleStep2Next} className="space-y-3.5 pt-1">
          <div className="text-center pb-0.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              Veuillez remplir ces informations pour créer votre compte
            </h2>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Prénom</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={focusedField === "firstName" ? "" : "Prénom"}
              onFocus={() => setFocusedField("firstName")}
              onBlur={() => setFocusedField(null)}
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
              required
              maxLength={80}
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Nom de famille</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={focusedField === "lastName" ? "" : "Nom de famille"}
              onFocus={() => setFocusedField("lastName")}
              onBlur={() => setFocusedField(null)}
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
              required
              maxLength={80}
              autoComplete="family-name"
            />
          </div>

          {/* Date de naissance : Jour / Mois / Année */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Date de naissance</label>
            <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
              <Input
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder={focusedField === "day" ? "" : "Jour"}
                onFocus={() => setFocusedField("day")}
                onBlur={() => setFocusedField(null)}
                inputMode="numeric"
                maxLength={2}
                className="text-center text-base py-3.5 sm:py-4 font-medium rounded-xl bg-background"
                required
              />
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder={focusedField === "month" ? "" : "Mois"}
                onFocus={() => setFocusedField("month")}
                onBlur={() => setFocusedField(null)}
                inputMode="numeric"
                maxLength={2}
                className="text-center text-base py-3.5 sm:py-4 font-medium rounded-xl bg-background"
                required
              />
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={focusedField === "year" ? "" : "Année"}
                onFocus={() => setFocusedField("year")}
                onBlur={() => setFocusedField(null)}
                inputMode="numeric"
                maxLength={4}
                className="text-center text-base py-3.5 sm:py-4 font-medium rounded-xl bg-background"
                required
              />
            </div>
          </div>

          {/* Genre neutre avant le clic, devient bleu dès qu'on clique */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Genre</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={gender === "Femme" ? "default" : "outline"}
                onClick={() => setGender("Femme")}
                className={`py-3.5 sm:py-4 text-base font-semibold rounded-xl transition-all ${
                  gender === "Femme"
                    ? "bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white shadow-sm border-transparent"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Femme
              </Button>
              <Button
                type="button"
                variant={gender === "Homme" ? "default" : "outline"}
                onClick={() => setGender("Homme")}
                className={`py-3.5 sm:py-4 text-base font-semibold rounded-xl transition-all ${
                  gender === "Homme"
                    ? "bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white shadow-sm border-transparent"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Homme
              </Button>
            </div>
          </div>

          {/* Bouton Suivant bleu */}
          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-4 text-base font-bold rounded-xl shadow-md transition-all mt-1"
          >
            Suivant
          </Button>

          {/* Bouton Retour vers le menu */}
          <div className="text-center pt-1">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
              onClick={() => setView("menu")}
            >
              ❮ Retour
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          TROISIÈME ÉTAPE : COORDONNÉES ET ENREGISTREMENT DIRECT
          ======================================================== */}
      {view === "step3" && (
        <form onSubmit={handleRegister} className="space-y-3.5 pt-1">
          <div className="text-center pb-0.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              Coordonnées et sécurité
            </h2>
          </div>

          {/* Numéro de téléphone OBLIGATOIRE */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Numéro de téléphone
            </label>
            <Input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={focusedField === "phone" ? "" : "Numéro de téléphone"}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              type="tel"
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
              required
            />
          </div>

          {/* Adresse e-mail FACULTATIVE (sans mentionner facultatif) */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Adresse e-mail
            </label>
            <Input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={focusedField === "email" ? "" : "Adresse e-mail"}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              type="email"
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Mot de passe</label>
            <div className="relative">
              <Input
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                type={show ? "text" : "password"}
                placeholder={focusedField === "pass" ? "" : "Mot de passe"}
                onFocus={() => setFocusedField("pass")}
                onBlur={() => setFocusedField(null)}
                className="text-base py-3.5 sm:py-4 pr-20 rounded-xl bg-background"
                required
                minLength={4}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShow(!show)}
                className="absolute right-1 top-2 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                {show ? "Masquer" : "Afficher"}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Confirmer le mot de passe
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              type={show ? "text" : "password"}
              placeholder={focusedField === "cpass" ? "" : "Confirmer le mot de passe"}
              onFocus={() => setFocusedField("cpass")}
              onBlur={() => setFocusedField(null)}
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
              required
              minLength={4}
            />
          </div>

          {/* Bouton Enregistrer vos informations */}
          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-4 text-base font-bold rounded-xl shadow-md transition-all mt-1"
            disabled={busy}
          >
            {busy ? "Enregistrement..." : "Enregistrer vos informations"}
          </Button>

          {/* Retour à l'étape 2 */}
          <div className="text-center pt-1">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
              onClick={() => setView("step2")}
            >
              ❮ Retour
            </button>
          </div>
        </form>
      )}

      {/* ========================================================
          MODE DÉJÀ INSCRIT : CONNEXION DES UTILISATEURS EXISTANTS
          ======================================================== */}
      {view === "signin" && (
        <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
          <div className="text-center pb-0.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              Veuillez vous connecter à votre compte
            </h2>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Numéro de téléphone ou adresse e-mail
            </label>
            <Input
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder={focusedField === "loginId" ? "" : "Numéro de téléphone ou adresse e-mail"}
              onFocus={() => setFocusedField("loginId")}
              onBlur={() => setFocusedField(null)}
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Mot de passe</label>
            <div className="relative">
              <Input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                type={show ? "text" : "password"}
                placeholder={focusedField === "loginPass" ? "" : "Mot de passe"}
                onFocus={() => setFocusedField("loginPass")}
                onBlur={() => setFocusedField(null)}
                className="text-base py-3.5 sm:py-4 pr-20 rounded-xl bg-background"
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShow(!show)}
                className="absolute right-1 top-2 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                {show ? "Masquer" : "Afficher"}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-4 text-base font-bold rounded-xl shadow-md transition-all mt-1"
            disabled={busy}
          >
            {busy ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="flex items-center justify-between pt-1 px-1">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => setView("menu")}
            >
              ❮ Retour
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={forgot}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-royal-gradient">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Frame>
        <SignForm />
      </Frame>
    );
  }

  return <>{children}</>;
              }
                  
