import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Vrai logo officiel Google aux 4 couleurs authentiques
function GoogleLogo() {
  return (
    <svg className="w-5 h-5 shrink-0 mr-2.5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// Panneau blanc allongé avec logo officiel centré et marque BERSA
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4 py-8">
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-card p-6 sm:p-8 shadow-soft border border-border/40">
        {/* Logo au milieu et texte BERSA Berceau du Savoir bien proportionné */}
        <div className="flex flex-col items-center text-center pb-1">
          <img
            src="/logo.png"
            alt="Logo officiel BERSA"
            className="w-14 h-14 object-contain rounded-2xl shadow-xs"
          />
          <div className="flex flex-col items-center leading-none mt-2">
            <span className="text-foreground font-extrabold text-[22px] tracking-normal">
              BERSA
            </span>
            <span className="text-muted-foreground text-[9px] font-semibold tracking-wider uppercase mt-0.5">
              Berceau du savoir
            </span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// Convertit un e-mail ou un numéro de téléphone sans aucun refus
function resolveAuthIdentifier(value: string) {
  const text = value.trim();
  if (!text) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return { email: text.toLowerCase(), isPhone: false, display: text };
  }
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 7) {
    const normalized = digits.startsWith("0") ? `243${digits.slice(1)}` : digits;
    return { email: `tel_${normalized}@bersa.cd`, isPhone: true, display: `+${normalized}` };
  }
  return null;
}

function SignForm() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  // Aucun genre coché par défaut
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

  // Message d'information à la création
  const [welcomeInfo, setWelcomeInfo] = useState<{ pass: string } | null>(null);

  // Redirection automatique après 5 secondes vers l'accueil
  useEffect(() => {
    if (!welcomeInfo) return;
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 5000);
    return () => clearTimeout(timer);
  }, [welcomeInfo]);

  // Passage à la deuxième étape
  function handleNext(e: React.FormEvent) {
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
    setStep(2);
  }

  // Soumission finale
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resolved = resolveAuthIdentifier(identifierInput);

    if (!resolved) {
      toast.error("Veuillez saisir un numéro de téléphone ou une adresse e-mail valide.");
      return;
    }

    if (passwordInput.length < 4) {
      toast.error("Le mot de passe doit comporter au moins 4 lettres ou chiffres.");
      return;
    }

    setBusy(true);

    // CONNEXION ANCIENS ET NOUVEAUX UTILISATEURS SANS COMPLICATION
    if (mode === "in") {
      const { error: directErr } = await supabase.auth.signInWithPassword({
        email: identifierInput.trim().toLowerCase(),
        password: passwordInput,
      });

      if (!directErr) {
        setBusy(false);
        window.location.href = "/";
        return;
      }

      const { error: phoneErr } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: passwordInput,
      });

      setBusy(false);
      if (phoneErr) {
        toast.error("Identifiant ou mot de passe incorrect.");
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
      password: passwordInput,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password: passwordInput,
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

    // Connexion immédiate sans confirmation bloquante
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

  // Notification d'information avec redirection automatique
  if (welcomeInfo) {
    return (
      <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
        <div className="rounded-2xl border border-primary/20 bg-muted/30 p-5 text-left text-sm space-y-3 shadow-xs">
          <p className="font-semibold text-base text-foreground">
            Votre compte BERSA vient d'être Créé avec succès.
          </p>
          <p className="text-base text-primary font-bold">
            Voici votre mot de passe : {welcomeInfo.pass}
          </p>
          <p className="text-xs text-muted-foreground italic">
            Gardez le jalousement.
          </p>
          <hr className="my-2 border-border/60" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pour plus d'informations, contactez-nous à travers notre adresse mail :{" "}
            <a href="mailto:bersainfos@gmail.com" className="font-semibold text-primary underline">
              bersainfos@gmail.com
            </a>
          </p>
          <p className="text-xs font-semibold text-foreground pt-1">
            Bersa, Berceau du Savoir
          </p>
        </div>
        <Button
          className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-6 text-base font-bold rounded-2xl shadow-md transition-all"
          onClick={() => { window.location.href = "/"; }}
        >
          Accéder directement à l'accueil
        </Button>
      </div>
    );
    }
        return (
    <>
      {/* Texte indicatif agrandi avec un peu d'espace */}
      <div className="text-center pt-1 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
          {mode === "up"
            ? "Veuillez remplir ces informations pour créer votre compte"
            : "Veuillez vous connecter à votre compte"}
        </h2>
      </div>

      {/* PREMIÈRE ÉTAPE : S'ARRÊTE SUR LE GENRE AVEC LE BOUTON SUIVANT BLEU */}
      {mode === "up" && step === 1 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Prénom</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="text-base py-5 rounded-xl bg-background"
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
              placeholder="Nom de famille"
              className="text-base py-5 rounded-xl bg-background"
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
                placeholder="Jour"
                inputMode="numeric"
                maxLength={2}
                className="text-center text-sm sm:text-base py-5 font-medium rounded-xl bg-background"
                required
              />
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="Mois"
                inputMode="numeric"
                maxLength={2}
                className="text-center text-sm sm:text-base py-5 font-medium rounded-xl bg-background"
                required
              />
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Année"
                inputMode="numeric"
                maxLength={4}
                className="text-center text-sm sm:text-base py-5 font-medium rounded-xl bg-background"
                required
              />
            </div>
          </div>

          {/* Genre neutre au début, devient bleu dès qu'on clique */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Genre</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={gender === "Femme" ? "default" : "outline"}
                onClick={() => setGender("Femme")}
                className={`py-5 text-base font-semibold rounded-xl transition-all ${
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
                className={`py-5 text-base font-semibold rounded-xl transition-all ${
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
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-6 text-base font-bold rounded-2xl shadow-md transition-all mt-2"
          >
            Suivant
          </Button>

          {/* En bas : Déjà inscrit ? et Se connecter avec Google */}
          <div className="space-y-2 pt-2 text-center">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => { setMode("in"); setStep(1); }}
            >
              Déjà inscrit ?
            </button>
            <Button
              type="button"
              variant="outline"
              className="w-full py-5 text-sm font-semibold rounded-2xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
              onClick={google}
            >
              <GoogleLogo />
              Se connecter avec Google
            </Button>
          </div>
        </form>
      )}

      {/* DEUXIÈME ÉTAPE : TÉLÉPHONE/EMAIL + MOT DE PASSE */}
      {mode === "up" && step === 2 && (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Numéro de téléphone ou adresse e-mail
            </label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder="Numéro de téléphone ou adresse e-mail"
              className="text-base py-5 rounded-xl bg-background"
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
                placeholder="Mot de passe"
                className="text-base py-5 pr-20 rounded-xl bg-background"
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
            <label className="text-sm font-semibold text-foreground">
              Confirmer le mot de passe
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              className="text-base py-5 rounded-xl bg-background"
              required
              minLength={4}
            />
          </div>

          {/* Bouton bleu S'enregistrer */}
          <Button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-6 text-base font-bold rounded-2xl shadow-md transition-all mt-2"
            disabled={busy}
          >
            {busy ? "Enregistrement..." : "S'enregistrer"}
          </Button>

          {/* En bas : Retour, Déjà inscrit ? et Se connecter avec Google */}
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
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => { setMode("in"); setStep(1); }}
              >
                Déjà inscrit ?
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full py-5 text-sm font-semibold rounded-2xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
              onClick={google}
            >
              <GoogleLogo />
              Se connecter avec Google
            </Button>
          </div>
        </form>
      )}

      {/* MODE CONNEXION (Pour tous les anciens et nouveaux utilisateurs) */}
      {mode === "in" && (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              Numéro de téléphone ou adresse e-mail
            </label>
            <Input
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              placeholder="Numéro de téléphone ou adresse e-mail"
              className="text-base py-5 rounded-xl bg-background"
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
                placeholder="Mot de passe"
                className="text-base py-5 pr-20 rounded-xl bg-background"
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
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-6 text-base font-bold rounded-2xl shadow-md transition-all mt-2"
            disabled={busy}
          >
            {busy ? "Connexion..." : "Se connecter"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full py-5 text-sm font-semibold rounded-2xl border-border/80 hover:bg-muted/60 transition-all flex items-center justify-center"
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
