import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/bersa-logo.png.asset.json";
import { OpeningPresentation } from "@/components/OpeningPresentation";
import { authIdentifier } from "@/lib/auth-identifier";
import { LanguageSelector } from "@/components/LanguageSelector";

function Frame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4 py-10">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 shadow-soft">
        <div className="flex flex-col items-center text-center">
          <img src={logo.url} alt="Logo BERSA" className="h-20 w-20 rounded-2xl shadow-md" />
          <h1 className="mt-3 text-3xl font-bold">BERSA</h1>
          <p className="font-display text-lg text-primary">Berceau du Savoir</p>
          <p className="font-display italic text-muted-foreground">« {t("slogan")} »</p>
        </div>
        <LanguageSelector />
        {children}
      </div>
    </div>
  );
}

function normalizeBirthDate(raw: string): string | null {
  const clean = raw.trim();
  if (!clean) return null;
  // Format ISO : AAAA-MM-JJ
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  // Format francophone : JJ/MM/AAAA ou JJ-MM-AAAA
  const match = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const day = (match[1] ?? "").padStart(2, "0");
    const month = (match[2] ?? "").padStart(2, "0");
    const year = match[3] ?? "";
    return `${year}-${month}-${day}`;
  }
  return clean;
}

function SignForm() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [code, setCode] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const identifier = authIdentifier(String(f.get("email")));
    if (!identifier) {
      toast.error("Saisissez un e-mail valide ou votre numéro de téléphone.");
      return;
    }
    const password = String(f.get("password"));
    if (password.length < 4) {
      toast.error("Le mot de passe doit comporter au moins 4 caractères.");
      return;
    }

    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ ...identifier, password });
      setBusy(false);
      if (error) toast.error("Identifiant ou mot de passe incorrect.");
      return;
    }

    if (password !== String(f.get("confirm"))) {
      setBusy(false);
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    const birthDateParsed = normalizeBirthDate(String(f.get("birth_date") ?? ""));
    const meta = {
      first_name: String(f.get("first_name")).trim().slice(0, 80),
      last_name: String(f.get("last_name")).trim().slice(0, 80),
      birth_date: birthDateParsed,
    };

    const { error } = await supabase.auth.signUp({
      ...identifier,
      password,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else if ("phone" in identifier) {
      setPendingPhone(identifier.phone);
      toast.success("Confirmez le code reçu par SMS.");
    } else {
      toast.success("Compte créé avec succès ! Connectez-vous.");
      setMode("in");
    }
  }

  async function forgot() {
    const email = window.prompt("Votre adresse e-mail pour réinitialiser votre mot de passe :")?.trim();
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Un lien de réinitialisation sécurisé vous a été envoyé par e-mail.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Connexion Google indisponible.");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: pendingPhone, token: code, type: "sms" });
    setBusy(false);
    if (error) toast.error(error.message);
    else setPendingPhone("");
  }

  if (pendingPhone) {
    return (
      <form onSubmit={verify} className="space-y-3">
        <Input aria-label="Code SMS" placeholder="Code SMS" value={code} onChange={(e) => setCode(e.target.value)} required />
        <Button type="submit" disabled={busy} className="w-full">Vérifier</Button>
        <Button variant="ghost" onClick={() => setPendingPhone("")} className="w-full">Retour</Button>
      </form>
    );
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Input name="first_name" placeholder="Prénom" required maxLength={80} />
              <Input name="last_name" placeholder="Nom" required maxLength={80} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date de naissance (saisie manuelle libre)</label>
              <Input
                name="birth_date"
                type="text"
                placeholder="Ex. 15/05/1998 ou 1998-05-15"
                aria-label="Date de naissance"
                required
              />
            </div>
          </>
        )}

        <Input
          name="email"
          type="text"
          autoComplete="username"
          aria-label="E-mail ou numéro de téléphone"
          placeholder="E-mail ou numéro de téléphone"
          required
        />

        <div className="relative">
          <Input
            name="password"
            type={show ? "text" : "password"}
            placeholder={t("password")}
            required
            minLength={4}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShow(!show)}
            className="absolute right-0 top-0 text-xs text-muted-foreground"
          >
            {show ? "Masquer" : "Afficher"}
          </Button>
        </div>

        {mode === "up" && (
          <>
            {passwordInput.length > 0 && passwordInput.length < 6 && (
              <p className="text-[11px] text-amber-600">
                Mot de passe valide (min. 4 car.), mais 6 caractères ou plus sont recommandés pour plus de sécurité.
              </p>
            )}
            <Input
              name="confirm"
              type={show ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              required
              minLength={4}
            />
          </>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? t("signIn") : t("signUp")}
        </Button>
      </form>

      <Button variant="outline" className="w-full" onClick={google}>
        {t("google")}
      </Button>

      {mode === "in" && (
        <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={forgot}>
          Mot de passe oublié ?
        </Button>
      )}

      <Button
        variant="link"
        className="w-full text-xs text-primary"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
      >
        {mode === "in" ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
      </Button>
    </>
  );
}

function CompleteProfile({ user, onDone }: { user: User; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const m = user.user_metadata ?? {};

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: String(f.get("first_name")).trim().slice(0, 80),
      last_name: String(f.get("last_name")).trim().slice(0, 80),
      email: user.email ?? null,
      birth_date: m["birth_date"] || null,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else onDone();
  }

  const [first, ...rest] = String(m["full_name"] ?? m["name"] ?? "").split(" ");

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-center text-sm text-muted-foreground">Complétez votre profil pour continuer.</p>
      <div className="grid grid-cols-2 gap-2">
        <Input name="first_name" placeholder="Prénom" required defaultValue={m["first_name"] ?? first} />
        <Input name="last_name" placeholder="Nom" required defaultValue={m["last_name"] ?? rest.join(" ")} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>Continuer</Button>
    </form>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [postLoginIntroDone, setPostLoginIntroDone] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasProfile(null);
      return;
    }
    (async () => {
      const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (data) {
        setHasProfile(true);
        return;
      }
      const m = user.user_metadata ?? {};
      if (m["first_name"] && m["last_name"]) {
        const { error } = await supabase.from("profiles").insert({
          id: user.id,
          first_name: m["first_name"],
          last_name: m["last_name"],
          email: user.email ?? null,
          birth_date: m["birth_date"] || null,
        });
        setHasProfile(!error);
        return;
      }
      setHasProfile(false);
    })();
  }, [user]);

  // Chargement uniquement si non connecté et en phase d'init
  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-royal-gradient">
        <img src={logo.url} alt="BERSA" className="h-16 w-16 animate-pulse rounded-xl" />
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

  if (hasProfile === false) {
    return (
      <Frame>
        <CompleteProfile user={user} onDone={() => setHasProfile(true)} />
      </Frame>
    );
  }

  const sessionKey = `bersa_intro_seen_${user.id}`;
  const alreadySeen = typeof window !== "undefined" && sessionStorage.getItem(sessionKey) === "true";

  if (!postLoginIntroDone && !alreadySeen) {
    return (
      <OpeningPresentation
        onDone={() => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(sessionKey, "true");
          }
          setPostLoginIntroDone(true);
        }}
      />
    );
  }

  // Aucun écran intermédiaire avec logo lors des transitions entre onglets
  return <>{children}</>;
}
