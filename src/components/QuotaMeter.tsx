import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type DailyQuota = { used: number; limit: number };

/** Reads today's AI usage and the daily limit that applies to the signed-in user. */
export function useDailyQuota() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<DailyQuota | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setQuota(null);
      return;
    }
    let alive = true;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ count }, { data }] = await Promise.all([
        supabase
          .from("ai_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("quota_period", today),
        supabase.rpc("current_daily_limit", { _user: user.id }),
      ]);
      if (!alive) return;
      setQuota({ used: count ?? 0, limit: Number(data ?? 20) });
    })();
    return () => {
      alive = false;
    };
  }, [user, key]);

  return { quota, setQuota, refresh: () => setKey((k) => k + 1) };
}

function nextUtcMidnight(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0));
}

function countdown(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "bientôt";
  const total = Math.floor(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

/** Permanent indicator: conversations used, remaining, and when the quota renews. */
export function QuotaMeter({ quota }: { quota: DailyQuota | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!quota) return null;

  const remaining = Math.max(0, quota.limit - quota.used);
  const pct = quota.limit > 0 ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 100;
  const renewal = nextUtcMidnight();
  const when = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(renewal);
  const full = pct >= 100;
  const low = !full && remaining <= Math.max(3, Math.ceil(quota.limit * 0.2));

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold">Quota du jour</span>
        <span className={full ? "font-semibold text-destructive" : low ? "font-semibold text-amber-600" : "text-muted-foreground"}>
          {quota.used} / {quota.limit} utilisées · reste {remaining}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${full ? "bg-destructive" : low ? "bg-amber-500" : "bg-gold"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {full ? "Limite atteinte — " : ""}Renouvellement le {when} (UTC), dans {countdown(renewal)}.
      </p>
    </div>
  );
}
