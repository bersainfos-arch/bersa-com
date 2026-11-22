import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Logo officiel Google aux 4 couleurs authentiques
function GoogleLogo() {
  return (
    <svg className="w-4 h-4 shrink-0 mr-2" viewBox="0 0 24 24" aria-hidden="true">
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

// Panneau compact blanc avec logo identique à l'accueil
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-3 py-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 sm:p-6 shadow-soft border border-border/40 space-y-3">
        {/* En-tête : logo à gauche, BERSA Berceau du Savoir à droite comme sur l'accueil */}
        <div className="flex items-center justify-center gap-2 pb-0.5">
          <img
            src="/logo.png"
            alt="Logo officiel BERSA"
            className="w-10 h-10 object-contain rounded-lg shadow-xs"
          />
          <div className="flex w-[68px] flex-col leading-tight">
            <span className="text-foreground font-extrabold text-[19px] tracking-normal">
              BERSA
            </span>
            <span className="text-muted-foreground text-[7.5px] font-semibold -mt-0.5 whitespace-nowrap uppercase">
              Berceau du savoir
            </span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// Adaptation automatique des mots de passe courts pour le serveur
function internalPassword(pass: string): string {
  if (pass.length >= 6) return pass;
  return `${pass}__bersa`;
}

// Résolution universelle du téléphone ou de l'e-mail
function resolveAuthIdentifier(value: string) {
  const text = value.trim();
  if (!text) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return { email: text.toLowerCase(), isPhone: false, display: text };
  }
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 7) {
    let normalized = digits;
    if (normalized.startsWith("0")) {
      normalized = "243" + normalized.slice(1);
    } else if (normalized.length === 9 && (normalized.startsWith("8") || normalized.startsWith("9"))) {
      normalized = "243" + normalized;
    }
    return {
      email: `tel_${normalized}@bersa.cd`,
      isPhone: true,
      display: `+${normalized}`,
    };
  }
  return null;
}

function SignForm() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Aucun genre coché par défaut
  const [gender, setGender] = useState<"Femme" | "Homme" | "">("");

  // Étape 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Étape 2
  const [identifierInput, setIdentifierInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");

  // Étape 1 -> Étape 2
  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez renseigner votre prénom et nom de famille.");
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
    setStep(2);
  }

  // Connexion ou Enregistrement direct
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resolved = resolveAuthIdentifier(identifierInput);

    if (!resolved) {
      toast.error("Veuillez saisir votre numéro de téléphone ou votre adresse e-mail.");
      return;
    }

    if (passwordInput.length < 4) {
      toast.error("Le mot de passe doit comporter au moins 4 lettres ou chiffres.");
      return;
    }

    setBusy(true);
    const authPass = internalPassword(passwordInput);

    // MODE CONNEXION DIRECTE
    if (mode === "in") {
      const { error: err1 } = await supabase.auth.signInWithPassword({
        email: identifierInput.trim().toLowerCase(),
        password: authPass,
      });

      if (!err1) {
        setBusy(false);
        window.location.href = "/";
        return;
      }

      // Repli mot de passe direct ou compte téléphone
      const { error: err2 } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: authPass,
      });

      if (!err2) {
        setBusy(false);
        window.location.href = "/";
        return;
      }

      const { error: err3 } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: passwordInput,
      });

      setBusy(false);
      if (err3) {
        toast.error("Numéro/e-mail ou mot de passe incorrect.");
      } else {
        window.location.href = "/";
      }
      return;
    }

    // MODE CRÉATION DE COMPTE
    if (passwordInput !== confirmInput) {
      setBusy(false);
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    const birthDateISO = `${year.padStart(4, "20")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const meta = {
      first_name: firstName.trim().slice(0, 80),
      last_name: lastName.trim().slice(0, 80),
      birth_date: birthDateISO,
      gender,
      phone_private: resolved.isPhone ? resolved.display : null,
    };

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: resolved.email,
      password: authPass,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: resolved.email,
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
        email: resolved.isPhone ? null : resolved.email,
        birth_date: birthDateISO,
      });
    }

    // Connexion immédiate et redirection automatique sur l'accueil
    await supabase.auth.signInWithPassword({
      email: resolved.email,
      password: authPass,
    });

    setBusy(false);
    window.location.href = "/";
  }

  // Connexion Google sans erreur 404 avec sélection du compte
  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (r.error) {
      toast.error("Connexion Google momentanément indisponible.");
    }
  }

  async function forgot() {
    const raw = window.prompt("Votre adresse e-mail pour réinitialiser le mot de passe :")?.trim();
    if (!raw) return;
    const { error } = await supabase.auth.resetPasswordForEmail(raw, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Un lien vous a été envoyé par e-mail.");
        }
      return (
    <>
      {/* Texte indicatif compact */}
      <div className="text-center pt-0.5 pb-1">
        <h2 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
          {mode === "up"
            ? "Veuillez remplir ces informations pour créer votre compte"
            : "Veuillez vous connecter à votre compte"}
        </h2>
      </div>

      {/* PREMIÈRE ÉTAPE : IDENTITÉ, DATE ET GENRE */}
      {mode === "up" && step === 1 && (
        <form onSubmit={handleNext} className="space-y-2.5">
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">Prénom</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={focused === "firstName" ? "" : "Prénom"}
              onFocus={() => setFocused("firstName")}
              onBlur={() => setFocused(null)}
              className="text-sm py-2.5 rounded-xl bg-background"
              required
              maxLength={80}
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">Nom de famille</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={focused === "lastName" ? "" : "Nom de famille"}
              onFocus={() => setFocused("lastName")}
              onBlur={() => setFocused(null)}
              className="text-sm py-2.5 rounded-xl bg-background"
              required
              maxLength={80}
              autoComplete="family-name"
            />
          </div>

          {/* Date de naissance en toutes lettres : Jour / Mois / Année */}
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">Date de naissance</label>
            <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-1.5">
              <Input
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder={focused === "day" ? "" : "Jour"}
                onFocus={() => setFocused("day")}
                onBlur={() => setFocused(null)}
                inputMode="numeric"
                maxLength={2}
                className="text-center text-xs sm:text-sm py-2.5 font-medium rounded-xl bg-background"
                required
              />
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder={focused === "month" ? "" : "Mois"}
                onFocus={() => setFocused("month")}
                onBlur={() => setFocused(null)}
                inputMode="numeric"
                maxLength={2}
                className="text-center text-xs sm:text-sm py-2.5 font-medium rounded-xl bg-background"
                required
              />
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={focused === "year" ? "" : "Année"}
                onFocus={() => setFocused("year")}
                onBlur={() => setFocused(null)}
                inputMode="numeric"
                maxLength={4}
                className="text-center text-xs sm:text-sm py-2.5 font-medium rounded-xl bg-background"
                required
              />
            </div>
          </div>

          {/* Genre neutre au début, devient bleu au clic */}
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">Genre</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={gender === "Femme" ? "default" : "outline"}
                onClick={() => setGender("Femme")}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  gender === "Femme"
                    ? "bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white shadow-xs border-transparent"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Femme
              </Button>
              <Button
                type="button"
                variant={gender === "Homme" ? "default" : "outline"}
                onClick={() => setGender("Homme")}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  gender === "Homme"
                    ? "bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white shadow-xs border-transparent"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Homme
              </Button>
            </div>
          </div>

          {/* Bouton bleu Suivant */}
          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-3 text-sm font-bold rounded-xl shadow-xs transition-all mt-1"
          >
            Suivant
          </Button>

          {/* Déjà inscrit & Google */}
          <div className="space-y-1.5 pt-1 text-center">
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => { setMode("in"); setStep(1); }}
            >
              Déjà inscrit ?
            </button>
            <Button
              type="button"
              variant="outline"
              className="w-full py-2.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
              onClick={google}
            >
              <GoogleLogo />
              Se connecter avec Google
            </Button>
          </div>
        </form>
      )}

      {/* DEUXIÈME ÉTAPE : TÉLÉPHONE/EMAIL + MOT DE PASSE SERRÉS */}
      {mode === "up" && step === 2 && (
        <form onSubmit={submit} className="space-y-2.5">
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">
              Numéro de téléphone ou adresse e-mail
            </label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder={focused === "id" ? "" : "Numéro de téléphone ou adresse e-mail"}
              onFocus={() => setFocused("id")}
              onBlur={() => setFocused(null)}
              className="text-sm py-2.5 rounded-xl bg-background"
              required
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">Mot de passe</label>
            <div className="relative">
              <Input
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                type={show ? "text" : "password"}
                placeholder={focused === "pass" ? "" : "Mot de passe"}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
                className="text-sm py-2.5 pr-16 rounded-xl bg-background"
                required
                minLength={4}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShow(!show)}
                className="absolute right-1 top-1 h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
              >
                {show ? "Masquer" : "Afficher"}
              </Button>
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">
              Confirmer le mot de passe
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              type={show ? "text" : "password"}
              placeholder={focused === "cpass" ? "" : "Confirmer le mot de passe"}
              onFocus={() => setFocused("cpass")}
              onBlur={() => setFocused(null)}
              className="text-sm py-2.5 rounded-xl bg-background"
              required
              minLength={4}
            />
          </div>

          {/* Bouton de validation directe */}
          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-3 text-sm font-bold rounded-xl shadow-xs transition-all mt-1"
            disabled={busy}
          >
            {busy ? "Connexion..." : "Se connecter"}
          </Button>

          {/* Bas : Retour, Déjà inscrit et Google */}
          <div className="space-y-1.5 pt-0.5 text-center">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setStep(1)}
              >
                ❮ Retour
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => { setMode("in"); setStep(1); }}
              >
                Déjà inscrit ?
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full py-2.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
              onClick={google}
            >
              <GoogleLogo />
              Se connecter avec Google
            </Button>
          </div>
        </form>
      )}

      {/* MODE CONNEXION UNIVERSELLE (anciens & nouveaux comptes) */}
      {mode === "in" && (
        <form onSubmit={submit} className="space-y-2.5">
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">
              Numéro de téléphone ou adresse e-mail
            </label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder={focused === "inId" ? "" : "Numéro de téléphone ou adresse e-mail"}
              onFocus={() => setFocused("inId")}
              onBlur={() => setFocused(null)}
              className="text-sm py-2.5 rounded-xl bg-background"
              required
            />
          </div>

          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">Mot de passe</label>
            <div className="relative">
              <Input
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                type={show ? "text" : "password"}
                placeholder={focused === "inPass" ? "" : "Mot de passe"}
                onFocus={() => setFocused("inPass")}
                onBlur={() => setFocused(null)}
                className="text-sm py-2.5 pr-16 rounded-xl bg-background"
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShow(!show)}
                className="absolute right-1 top-1 h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
              >
                {show ? "Masquer" : "Afficher"}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-3 text-sm font-bold rounded-xl shadow-xs transition-all mt-1"
            disabled={busy}
          >
            {busy ? "Connexion..." : "Se connecter"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full py-2.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
            onClick={google}
          >
            <GoogleLogo />
            Se connecter avec Google
          </Button>

          <div className="text-center pt-0.5">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={forgot}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => { setMode("up"); setStep(1); }}
            >
              Pas encore de compte ? S'enregistrer
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
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
                                                                             
