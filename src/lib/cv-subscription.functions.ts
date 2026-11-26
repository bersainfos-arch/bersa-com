import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Active rows can only be approved by the existing administrator payment flow. */
export const hasCvSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("subscriptions")
      .select("id").eq("user_id", context.userId).eq("status", "active")
      .in("plan_code", ["standard", "premium", "pro", "ultra_pro"])
      .gt("amount", 0).not("started_at", "is", null)
      .gt("expires_at", new Date().toISOString()).limit(1);
    if (error) throw new Error("Vérification de l’abonnement indisponible.");
    return Boolean(data?.length);
  });