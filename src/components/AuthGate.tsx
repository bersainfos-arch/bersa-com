import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Cadre épuré : aucun logo, aucun titre BERSA, aucun slogan, aucun sélecteur de langue
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4 py-8">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-6 shadow-soft">
        {children}
      </div>
    </div>
  );
}

// Convertit un e-mail ou numéro de téléphone (RDC ou international) sans nécessiter de SMS bloquant
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
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [gender, setGender] = useState<"Femme" | "Homme">("Femme");
  const [welcomeInfo, setWelcomeInfo] = useState<{ pass: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rawIdentifier = String(f.get("identifier") ?? "").trim();
    const resolved = resolveAuthIdentifier(rawIdentifier);

    if (!resolved) {
      toast.error("Veuillez saisir une adresse e-mail valide ou votre numéro de téléphone.");
      return;
    }

    const password = String(f.get("password") ?? "");
    if (password.length < 4) {
      toast.error("Le mot de passe doit comporter au moins 4 lettres ou chiffres.");
      return;
    }

    setBusy(true);

    // MODE SE CONNECTER
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      });
      setBusy(false);
      if (error) {
        toast.error("Identifiant ou mot de passe incorrect.");
      }
      return;
    }

    // MODE CRÉER VOTRE COMPTE
    const confirm = String(f.get("confirm") ?? "");
    if (password !== confirm) {
      setBusy(false);
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    const firstName = String(f.get("first_name") ?? "").trim().slice(0, 80);
    const lastName = String(f.get("last_name") ?? "").trim().slice(0, 80);
    const birthDate = String(f.get("birth_date") ?? "").trim();

    if (!firstName || !lastName || !birthDate) {
      setBusy(false);
      toast.error("Tous les champs sont à remplir.");
      return;
    }

    const meta = {
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      gender,
      phone_private: resolved.isPhone ? resolved.display : null,
    };

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: resolved.email,
      password,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      // Si le compte existe déjà, tenter directement la connexion
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      });
      setBusy(false);
      if (signInErr) {
        toast.error(signUpError.message);
      }
      return;
    }

    // Mise à jour immédiate du profil utilisateur
    if (signUpData.user) {
      await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: resolved.isPhone ? null : resolved.email,
        birth_date: birthDate,
      });
    }

    // Connexion immédiate pour entrer dans l'application sans blocage
    await supabase.auth.signInWithPassword({
      email: resolved.email,
      password,
    });

    setBusy(false);
    setWelcomeInfo({ pass: password });
  }

  async function forgot() {
    const raw = window.prompt("Votre adresse e-mail ou numéro de téléphone :")?.trim();
    if (!raw) return;
    const resolved = resolveAuthIdentifier(raw);
    if (!resolved || resolved.isPhone) {
      toast.info("Veuillez nous contacter à bersainfos@gmail.com pour récupérer l'accès.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resolved.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Un lien de réinitialisation vous a été envoyé par e-mail.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Connexion Google indisponible.");
  }
    // Message d'information reçu dès la création du compte
  if (welcomeInfo) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-bold text-primary">Compte BERSA créé avec succès</h3>
        <div className="rounded-xl border bg-muted/30 p-4 text-left text-sm space-y-2">
          <p className="font-medium">Votre compte BERSA vient d'être créé avec succès.</p>
          <p className="text-primary font-semibold">Voici votre mot de passe : {welcomeInfo.pass}</p>
          <p className="text-muted-foreground text-xs italic">Gardez le jalousement.</p>
          <hr className="my-2" />
          <p className="text-xs text-muted-foreground">
            Pour plus d'informations, contactez-nous à travers notre adresse mail :{" "}
            <a href="mailto:bersainfos@gmail.com" className="font-semibold text-primary underline">
              bersainfos@gmail.com
            </a>
          </p>
          <p className="text-xs font-medium">Cordialement !</p>
        </div>
        <Button className="w-full" onClick={() => window.location.reload()}>
          Accéder directement à l'application
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-2">
        <h2 className="text-base font-semibold text-foreground">
          {mode === "up"
            ? "Veuillez remplir ces informations pour créer votre compte"
            : "Veuillez vous connecter à votre compte"}
        </h2>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && (
          <>
            <Input
              name="first_name"
              placeholder="Prénom"
              required
              maxLength={80}
              autoComplete="given-name"
            />
            <Input
              name="last_name"
              placeholder="Nom de famille"
              required
              maxLength={80}
              autoComplete="family-name"
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date de naissance</label>
              <Input
                name="birth_date"
                type="date"
                placeholder="Date de naissance"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Genre</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={gender === "Femme" ? "default" : "outline"}
                  onClick={() => setGender("Femme")}
                  className="w-full"
                >
                  Femme
                </Button>
                <Button
                  type="button"
                  variant={gender === "Homme" ? "default" : "outline"}
                  onClick={() => setGender("Homme")}
                  className="w-full"
                >
                  Homme
                </Button>
              </div>
            </div>
          </>
        )}

        <Input
          name="identifier"
          type="text"
          placeholder="Numéro de téléphone ou adresse e-mail"
          required
        />

        <div className="relative">
          <Input
            name="password"
            type={show ? "text" : "password"}
            placeholder="Mot de passe"
            required
            minLength={4}
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
          <Input
            name="confirm"
            type={show ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            required
            minLength={4}
          />
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? "Se connecter" : "Créer votre compte"}
        </Button>
      </form>

      <Button variant="outline" className="w-full" onClick={google}>
        {mode === "in" ? "Se connecter avec Google" : "S'inscrire avec Google"}
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
  
