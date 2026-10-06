import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil — BERSA" },
      { name: "description", content: "Connectez-vous pour suivre vos commandes et formations BERSA." },
      { property: "og:title", content: "Mon profil — BERSA" },
      { property: "og:description", content: "Suivi de vos commandes et inscriptions." },
    ],
  }),
  component: Page,
});

type Order = { id: string; item: string; kind: string; modality: string | null; status: string; created_at: string };

function AuthForm() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/profil" } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up") toast.success("Vérifiez votre e-mail pour confirmer votre compte.");
    return undefined;
  }
  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/profil" });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  }
  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
      <h2 className="text-2xl font-bold">{mode === "in" ? t("signIn") : t("signUp")}</h2>
      <Button variant="outline" className="w-full" onClick={google}>{t("google")}</Button>
      <form onSubmit={submit} className="space-y-3">
        <Input name="email" type="email" placeholder={t("email")} required />
        <Input name="password" type="password" placeholder={t("password")} required minLength={6} />
        <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? t("signIn") : t("signUp")}</Button>
      </form>
      <button className="w-full text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? t("signUp") : t("signIn")}
      </button>
    </div>
  );
}

function Page() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("id,item,kind,modality,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);
  return (
    <AppShell>
      <PageHeader title={t("profile")} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {loading ? null : !user ? (
          <AuthForm />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border bg-card p-4">
              <span className="font-semibold">{user.email}</span>
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>{t("signOut")}</Button>
            </div>
            <h2 className="text-2xl font-bold">{t("myOrders")}</h2>
            {orders.length === 0 && <p className="text-muted-foreground">—</p>}
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <div>
                  <div className="font-semibold">{o.item}</div>
                  <div className="text-xs text-muted-foreground">{o.kind}{o.modality ? ` · ${o.modality}` : ""} · {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
