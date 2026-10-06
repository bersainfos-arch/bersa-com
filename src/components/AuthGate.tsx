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
    const meta = {
      first_name: String(f.get("first_name")).trim().slice(0, 80),
      last_name: String(f.get("last_name")).trim().slice(0, 80),
      phone: String(f.get("phone")).trim().slice(0, 40),
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
            <Input name="phone" type="tel" placeholder={t("phone")} required maxLength={40} />
          </>
        )}
        <Input name="email" type="email" placeholder={t("email")} required />
        <Input name="password" type="password" placeholder={t("password")} required minLength={6} />
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? t("signIn") : t("signUp")}
        </Button>
      </form>
      <Button variant="outline" className="w-full" onClick={google}>{t("google")}</Button>
      <button className="w-full text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
      </button>
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
      phone: String(f.get("phone")).trim().slice(0, 40),
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
      <Input name="phone" type="tel" placeholder="Téléphone / WhatsApp" required defaultValue={m["phone"] ?? ""} />
      <Button type="submit" className="w-full" disabled={busy}>Continuer</Button>
    </form>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return setHasProfile(null);
    (async () => {
      const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (data) return setHasProfile(true);
      const m = user.user_metadata ?? {};
      if (m["first_name"] && m["last_name"] && m["phone"]) {
        const { error } = await supabase.from("profiles").insert({
          id: user.id, first_name: m["first_name"], last_name: m["last_name"], phone: m["phone"], email: user.email ?? null,
        });
        return setHasProfile(!error);
      }
      setHasProfile(false);
    })();
  }, [user]);

  if (loading || (user && hasProfile === null)) {
    return <div className="flex min-h-screen items-center justify-center bg-royal-gradient"><img src={logo.url} alt="BERSA" className="h-16 w-16 animate-pulse rounded-xl" /></div>;
  }
  if (!user) return <Frame><SignForm /></Frame>;
  if (!hasProfile) return <Frame><CompleteProfile user={user} onDone={() => setHasProfile(true)} /></Frame>;
  return <>{children}</>;
}
