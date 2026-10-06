import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/bersa-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Définir mon mot de passe — BERSA" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte BERSA." },
      { property: "og:title", content: "Définir mon mot de passe — BERSA" },
      { property: "og:description", content: "Réinitialisation du mot de passe BERSA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) { toast.error("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mot de passe enregistré !");
    navigate({ to: "/", replace: true });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal-gradient px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 shadow-soft">
        <div className="flex flex-col items-center text-center">
          <img src={logo.url} alt="Logo BERSA" className="h-16 w-16 rounded-xl" />
          <h1 className="mt-3 text-2xl font-bold">Définir mon mot de passe</h1>
        </div>
        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">Ouvrez cette page depuis le lien reçu par e-mail.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input name="password" type="password" placeholder="Nouveau mot de passe" required minLength={6} />
            <Input name="confirm" type="password" placeholder="Confirmer le mot de passe" required minLength={6} />
            <Button type="submit" className="w-full" disabled={busy}>Enregistrer</Button>
          </form>
        )}
      </div>
    </div>
  );
}
