import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

type Props = {
  trigger: ReactNode;
  item: string;
  kind: "redaction" | "formation" | "livre";
  price?: number | null;
  modality?: string;
};

export function OrderDialog({ trigger, item, kind, price, modality }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const full_name = String(f.get("full_name") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    if (!full_name || !phone) return toast.error("Nom et téléphone requis");
    setBusy(true);
    const { error } = await supabase.from("orders").insert({
      kind,
      item,
      modality: modality ?? null,
      price_usd: price ?? null,
      full_name: full_name.slice(0, 120),
      phone: phone.slice(0, 40),
      email: String(f.get("email") || "").slice(0, 200) || null,
      details: String(f.get("details") || "").slice(0, 3000) || null,
      attachment_link: String(f.get("attachment_link") || "").slice(0, 500) || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("sent"));
    setOpen(false);
    return undefined;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{item}</DialogTitle>
          {modality && <p className="text-sm text-muted-foreground">{modality}</p>}
        </DialogHeader>
        {!user ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-muted-foreground">{t("loginToOrder")}</p>
            <Button asChild>
              <Link to="/profil">{t("signIn")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input name="full_name" placeholder={t("fullName")} required maxLength={120} />
            <Input name="phone" placeholder={t("phone")} required maxLength={40} />
            <Input name="email" type="email" placeholder={t("email")} defaultValue={user.email ?? ""} />
            {kind === "redaction" && (
              <>
                <Textarea name="details" placeholder={t("details")} rows={4} maxLength={3000} />
                <Input name="attachment_link" placeholder={t("attachment")} maxLength={500} />
              </>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {t("send")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
