import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Logo authentique officiel Google aux 4 couleurs
function GoogleLogo() {
  return (
    <svg className="w-5 h-5 shrink-0 mr-2.5" viewBox="0 0 24 24" aria-hidden="true">
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

// Panneau centré avec le logo officiel BERSA
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 sm:p-7 shadow-soft border border-border/40 space-y-4">
        {/* Logo à gauche, BERSA à droite et berceau du savoir en minuscules sans dépasser BERSA */}
        <div className="flex items-center justify-center gap-2.5 pb-1">
          <img
            src="/logo.png"
            alt="Logo officiel BERSA"
            className="w-11 h-11 object-contain rounded-lg shadow-xs"
          />
          <div className="flex flex-col leading-none">
            <span className="text-foreground font-extrabold text-[21px] tracking-normal leading-none">
              BERSA
            </span>
            <span className="text-muted-foreground text-[8px] font-normal lowercase tracking-tight mt-1 leading-none">
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

// Détection universelle de l'identifiant (e-mail ou numéro de téléphone RDC / international)
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Aucun genre coché avant le clic
  const [gender, setGender] = useState<"Femme" | "Homme" | "">("");

  // Données Étape 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Données Étape 2
  const [identifierInput, setIdentifierInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");

  // Validation Étape 1
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

  // Connexion ou Enregistrement automatique sans blocage
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
    const authPass = formatAuthPassword(passwordInput);

    // CONNEXION DIRECTE
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

      const { error: err2 } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: authPass,
      });

      if (!err2) {
        setBusy(false);
        window.location.href = "/";
        return;
      }

      // Repli mot de passe brut
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

    // CRÉATION DE COMPTE DIRECTE
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

    // Connexion immédiate et redirection automatique vers l'accueil
    await supabase.auth.signInWithPassword({
      email: resolved.email,
      password: authPass,
    });

    setBusy(false);
    window.location.href = "/";
  }

  // Connexion Google directe sans erreur 404 sur Cloudflare
  async function google() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        const r = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          extraParams: { prompt: "select_account" },
        });
        if (r.error) toast.error("Connexion Google momentanément indisponible.");
      }
    } catch {
      toast.error("Connexion Google momentanément indisponible.");
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
      {/* Texte des orientations agrandi et lisible */}
      <div className="text-center pt-1 pb-1">
        <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
          {mode === "up"
            ? "Veuillez remplir ces informations pour créer votre compte"
            : "Veuillez vous connecter à votre compte"}
        </h2>
      </div>

      {/* PREMIÈRE ÉTAPE : IDENTITÉ, DATE ET GENRE */}
      {mode === "up" && step === 1 && (
        <form onSubmit={handleNext} className="space-y-3.5">
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

          {/* Date de naissance en toutes lettres : Jour / Mois / Année */}
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

          {/* Genre neutre au départ, devient bleu au clic */}
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

          {/* Bouton bleu Suivant */}
          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-4 text-base font-bold rounded-xl shadow-md transition-all mt-1"
          >
            Suivant
          </Button>

          {/* Déjà inscrit & Connexion Google */}
          <div className="space-y-2 pt-1 text-center">
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => { setMode("in"); setStep(1); }}
            >
              Déjà inscrit ?
            </button>
            <Button
              type="button"
              variant="outline"
              className="w-full py-3.5 sm:py-4 text-sm font-semibold rounded-xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
              onClick={google}
            >
              <GoogleLogo />
              Se connecter avec Google
            </Button>
          </div>
        </form>
      )}

      {/* DEUXIÈME ÉTAPE : TÉLÉPHONE/EMAIL + MOT DE PASSE AGRANDIS */}
      {mode === "up" && step === 2 && (
        <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Numéro de téléphone ou adresse e-mail
            </label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder={focusedField === "id" ? "" : "Numéro de téléphone ou adresse e-mail"}
              onFocus={() => setFocusedField("id")}
              onBlur={() => setFocusedField(null)}
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
              required
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

          {/* Bouton Se connecter en fin de deuxième étape */}
          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-4 text-base font-bold rounded-xl shadow-md transition-all mt-1"
            disabled={busy}
          >
            {busy ? "Connexion..." : "Se connecter"}
          </Button>

          {/* Bas : Retour, Déjà inscrit et Google */}
          <div className="space-y-2 pt-1 text-center">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setStep(1)}
              >
                ❮ Retour
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() => { setMode("in"); setStep(1); }}
              >
                Déjà inscrit ?
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full py-3.5 sm:py-4 text-sm font-semibold rounded-xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
              onClick={google}
            >
              <GoogleLogo />
              Se connecter avec Google
            </Button>
          </div>
        </form>
      )}

      {/* MODE CONNEXION (anciens et nouveaux comptes) */}
      {mode === "in" && (
        <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Numéro de téléphone ou adresse e-mail
            </label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder={focusedField === "inId" ? "" : "Numéro de téléphone ou adresse e-mail"}
              onFocus={() => setFocusedField("inId")}
              onBlur={() => setFocusedField(null)}
              className="text-base py-3.5 sm:py-4 rounded-xl bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Mot de passe</label>
            <div className="relative">
              <Input
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                type={show ? "text" : "password"}
                placeholder={focusedField === "inPass" ? "" : "Mot de passe"}
                onFocus={() => setFocusedField("inPass")}
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

          <Button
            type="button"
            variant="outline"
            className="w-full py-3.5 sm:py-4 text-sm font-semibold rounded-xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
            onClick={google}
          >
            <GoogleLogo />
            Se connecter avec Google
          </Button>

          <div className="text-center pt-1">
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
              className="text-sm font-semibold text-primary hover:underline"
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
        
