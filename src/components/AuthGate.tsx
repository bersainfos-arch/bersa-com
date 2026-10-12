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
import { INTRO_STEP_MS, openingPhase } from "@/lib/opening";

function Frame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4 py-10">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 shadow-soft">
        <div className="flex flex-col items-center text-center">
          <img src={logo.url} alt="Logo BERSA" className="h-20 w-20 rounded-2xl" />
          <h1 className="mt-3 text-3xl font-bold">BERSA</h1>
          <p className="font-display italic text-muted-foreground">« {t("slogan")} »</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function SignForm() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) toast.error("E-mail ou mot de passe incorrect.");
      return;
    }
    if (password !== String(f.get("confirm"))) { setBusy(false); toast.error("Les mots de passe ne correspondent pas."); return; }
    const meta = {
      first_name: String(f.get("first_name")).trim().slice(0, 80),
      last_name: String(f.get("last_name")).trim().slice(0, 80),
    };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Compte créé ! Confirmez votre e-mail pour vous connecter.");
  }
  async function forgot() {
    const email = window.prompt("Votre adresse e-mail :")?.trim();
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    if (error) toast.error(error.message);
    else toast.success("Un lien vous a été envoyé par e-mail.");
  }
  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Connexion Google impossible.");
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
          </>
        )}
        <Input name="email" type="email" placeholder={t("email")} required />
        <div className="relative">
          <Input name="password" type={show ? "text" : "password"} placeholder={t("password")} required minLength={6} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-2 text-xs text-muted-foreground">{show ? "Masquer" : "Afficher"}</button>
        </div>
        {mode === "up" && <Input name="confirm" type={show ? "text" : "password"} placeholder="Confirmer le mot de passe" required minLength={6} />}
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? t("signIn") : t("signUp")}
        </Button>
      </form>
      <Button variant="outline" className="w-full" onClick={google}>{t("google")}</Button>
      {mode === "in" && (
        <button className="w-full text-sm text-muted-foreground underline" onClick={forgot}>Mot de passe oublié ?</button>
      )}
      <button className="w-full text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
      </button>
    </>
  );
}

function IntroSplash({ onDone }: { onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const second = setTimeout(() => setElapsed(INTRO_STEP_MS), INTRO_STEP_MS);
    const finish = setTimeout(onDone, INTRO_STEP_MS * 2);
    return () => { clearTimeout(second); clearTimeout(finish); };
  }, [onDone]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal px-6 text-center text-royal-foreground">
      <p className="max-w-3xl font-display text-3xl leading-relaxed md:text-5xl" aria-live="polite">
        {openingPhase(elapsed) === "slogan" ? "Le berceau du savoir au service de votre plume." : "Transformez vos idées en résultats."}
      </p>
    </div>
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
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (!user) return setHasProfile(null);
    (async () => {
      const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (data) return setHasProfile(true);
      const m = user.user_metadata ?? {};
      if (m["first_name"] && m["last_name"]) {
        const { error } = await supabase.from("profiles").insert({
          id: user.id, first_name: m["first_name"], last_name: m["last_name"], email: user.email ?? null,
        });
        return setHasProfile(!error);
      }
      setHasProfile(false);
    })();
  }, [user]);

  if (loading || (user && hasProfile === null)) {
    return <div className="flex min-h-screen items-center justify-center bg-royal-gradient"><img src={logo.url} alt="BERSA" className="h-16 w-16 animate-pulse rounded-xl" /></div>;
  }
  if (!user) {
    if (!introDone) return <IntroSplash onDone={() => setIntroDone(true)} />;
    return <Frame><SignForm /></Frame>;
  }
  if (!hasProfile) return <Frame><CompleteProfile user={user} onDone={() => setHasProfile(true)} /></Frame>;
  return <>{children}</>;
}
