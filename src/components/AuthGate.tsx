import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Cadre épuré centré au milieu de l'écran avec texte et champs agrandis
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4 py-8">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-card p-6 sm:p-8 shadow-soft border border-border/40">
        {children}
      </div>
    </div>
  );
}

// Convertit un e-mail ou un numéro de téléphone en identifiant sécurisé
function resolveAuthIdentifier(value: string) {
  const text = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return { email: text.toLowerCase(), isPhone: false, display: text };
  }
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 8) {
    const normalized = digits.startsWith("0") ? `243${digits.slice(1)}` : digits;
    return { email: `tel_${normalized}@bersa.cd`, isPhone: true, display: `+${normalized}` };
  }
  return null;
}

function SignForm() {
  const [mode, setMode] = useState<"in" | "up">("up");
  // 1 = Identité, Date et Genre | 2 = Identifiants et Mot de passe
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [gender, setGender] = useState<"Femme" | "Homme">("Femme");

  // Données de la première partie
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Données de la deuxième partie
  const [identifierInput, setIdentifierInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");

  // Message d'information reçu dès la création du compte
  const [welcomeInfo, setWelcomeInfo] = useState<{ pass: string } | null>(null);

  // Passage à la partie suivante
  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez renseigner votre prénom et nom de famille.");
      return;
    }
    const d = Number(day), m = Number(month), y = Number(year);
    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > new Date().getFullYear()) {
      toast.error("Veuillez indiquer une date de naissance valide (JJ / MM / AA).");
      return;
    }
    setStep(2);
  }

  // Soumission finale (Connexion ou Inscription)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resolved = resolveAuthIdentifier(identifierInput);

    if (!resolved) {
      toast.error("Veuillez saisir une adresse e-mail valide ou votre numéro de téléphone.");
      return;
    }

    if (passwordInput.length < 4) {
      toast.error("Le mot de passe doit comporter au moins 4 lettres ou chiffres.");
      return;
    }

    setBusy(true);

    // CONNEXION DES ANCIENS ET NOUVEAUX UTILISATEURS SANS COMPLICATION
    if (mode === "in") {
      // 1. Essai prioritaire direct avec l'adresse e-mail ou l'identifiant saisi
      const { error: directError } = await supabase.auth.signInWithPassword({
        email: identifierInput.trim().toLowerCase(),
        password: passwordInput,
      });

      if (!directError) {
        setBusy(false);
        return;
      }

      // 2. Repli si connexion avec numéro de téléphone
      const { error: phoneError } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: passwordInput,
      });

      setBusy(false);
      if (phoneError) {
        toast.error("Identifiant ou mot de passe incorrect.");
      }
      return;
    }

    // CRÉATION DE COMPTE
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
      password: passwordInput,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      // Si le compte existe déjà, connexion directe
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: passwordInput,
      });
      setBusy(false);
      if (signInErr) {
        toast.error(signUpError.message);
      }
      return;
    }

    // Création immédiate du profil
    if (signUpData.user) {
      await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        first_name: firstName.trim().slice(0, 80),
        last_name: lastName.trim().slice(0, 80),
        email: resolved.isPhone ? null : resolved.email,
        birth_date: birthDateISO,
      });
    }

    // Connexion immédiate sans demander de code
    await supabase.auth.signInWithPassword({
      email: resolved.email,
      password: passwordInput,
    });

    setBusy(false);
    setWelcomeInfo({ pass: passwordInput });
  }

  async function forgot() {
    const raw = window.prompt("Votre adresse e-mail pour réinitialiser le mot de passe :")?.trim();
    if (!raw) return;
    const { error } = await supabase.auth.resetPasswordForEmail(raw, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Un lien de réinitialisation vous a été envoyé par e-mail.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Connexion Google indisponible.");
  }

  // Écran d'information immédiat avec mot de passe
  if (welcomeInfo) {
    return (
      <div className="space-y-5 text-center">
        <h3 className="text-xl font-bold text-primary">Votre compte BERSA vient d'être créé avec succès.</h3>
        <div className="rounded-xl border bg-muted/40 p-4 text-left text-sm space-y-3">
          <p className="text-base font-semibold text-foreground">
            Voici votre mot de passe : <span className="text-primary font-bold">{welcomeInfo.pass}</span>
          </p>
          <p className="text-muted-foreground text-sm italic">Gardez le jalousement.</p>
          <hr className="my-2 border-border/60" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pour plus d'informations, contactez-nous à travers notre adresse mail :{" "}
            <a href="mailto:bersainfos@gmail.com" className="font-bold text-primary underline">
              bersainfos@gmail.com
            </a>
          </p>
          <p className="text-xs font-semibold text-foreground">Cordialement !</p>
        </div>
        <Button className="w-full py-6 text-base font-bold rounded-xl shadow-md" onClick={() => window.location.reload()}>
          Accéder directement à l'application
        </Button>
      </div>
    );
    }
    return (
    <>
      {/* Titre agrandi et centré au milieu de l'écran */}
      <div className="text-center mb-4 space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
          {mode === "up"
            ? "Veuillez remplir ces informations pour créer votre compte"
            : "Veuillez vous connecter à votre compte"}
        </h2>
      </div>

      {/* PREMIÈRE PARTIE : S'ARRÊTE SUR LE GENRE AVEC LE BOUTON BLEU SUIVANT */}
      {mode === "up" && step === 1 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Prénom</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="text-base py-5 rounded-xl"
              required
              maxLength={80}
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Nom de famille</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom de famille"
              className="text-base py-5 rounded-xl"
              required
              maxLength={80}
              autoComplete="family-name"
            />
          </div>

          {/* Date de naissance format JJ / MM / AA */}
          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Date de naissance</label>
            <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
              <Input
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="JJ"
                inputMode="numeric"
                maxLength={2}
                className="text-center text-base py-5 font-semibold rounded-xl"
                required
              />
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="MM"
                inputMode="numeric"
                maxLength={2}
                className="text-center text-base py-5 font-semibold rounded-xl"
                required
              />
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="AAAA"
                inputMode="numeric"
                maxLength={4}
                className="text-center text-base py-5 font-semibold rounded-xl"
                required
              />
            </div>
          </div>

          {/* Genre Femme / Homme */}
          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Genre</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={gender === "Femme" ? "default" : "outline"}
                onClick={() => setGender("Femme")}
                className={`py-5 text-base font-semibold rounded-xl ${gender === "Femme" ? "bg-primary text-primary-foreground shadow" : ""}`}
              >
                Femme
              </Button>
              <Button
                type="button"
                variant={gender === "Homme" ? "default" : "outline"}
                onClick={() => setGender("Homme")}
                className={`py-5 text-base font-semibold rounded-xl ${gender === "Homme" ? "bg-primary text-primary-foreground shadow" : ""}`}
              >
                Homme
              </Button>
            </div>
          </div>

          {/* Bouton bleu Suivant en bas */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-bold rounded-xl shadow-md transition-all mt-2"
          >
            Suivant
          </Button>

          {/* Message en bas Déjà inscrit ? S'enregistrer */}
          <div className="text-center pt-2">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => { setMode("in"); setStep(1); }}
            >
              Déjà inscrit ? S'enregistrer
            </button>
          </div>
        </form>
      )}

      {/* DEUXIÈME PARTIE : TÉLÉPHONE/EMAIL + MOT DE PASSE */}
      {mode === "up" && step === 2 && (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Numéro de téléphone ou adresse e-mail</label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder="Numéro de téléphone ou adresse e-mail"
              className="text-base py-5 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Mot de passe</label>
            <div className="relative">
              <Input
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                type={show ? "text" : "password"}
                placeholder="Mot de passe"
                className="text-base py-5 pr-20 rounded-xl"
                required
                minLength={4}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShow(!show)}
                className="absolute right-1 top-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {show ? "Masquer" : "Afficher"}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Confirmer le mot de passe</label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              className="text-base py-5 rounded-xl"
              required
              minLength={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-bold rounded-xl shadow-md"
            disabled={busy}
          >
            {busy ? "Création en cours..." : "Créer votre compte"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full py-5 text-sm font-semibold rounded-xl"
            onClick={google}
          >
            S'inscrire avec Google
          </Button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => setStep(1)}
            >
              ❮ Retour
            </button>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => { setMode("in"); setStep(1); }}
            >
              Déjà inscrit ? S'enregistrer
            </button>
          </div>
        </form>
      )}

      {/* MODE CONNEXION (Pour tous les anciens et nouveaux utilisateurs) */}
      {mode === "in" && (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Numéro de téléphone ou adresse e-mail</label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder="Numéro de téléphone ou adresse e-mail"
              className="text-base py-5 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm sm:text-base font-semibold text-foreground">Mot de passe</label>
            <div className="relative">
              <Input
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                type={show ? "text" : "password"}
                placeholder="Mot de passe"
                className="text-base py-5 pr-20 rounded-xl"
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShow(!show)}
                className="absolute right-1 top-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {show ? "Masquer" : "Afficher"}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-bold rounded-xl shadow-md"
            disabled={busy}
          >
            {busy ? "Connexion en cours..." : "Se connecter"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full py-5 text-sm font-semibold rounded-xl"
            onClick={google}
          >
            Se connecter avec Google
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={forgot}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
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
    
