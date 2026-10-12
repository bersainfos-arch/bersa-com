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
import { MOBILE_MONEY } from "@/lib/catalog";
import { PaymentCurrency } from "@/components/PaymentCurrency";

type Props = {
  trigger: ReactNode;
  item: string;
  kind: "redaction" | "formation" | "livre";
  price?: number | null;
  modality?: string;
  bookId?: string;
};

export function OrderDialog({ trigger, item, kind, price, modality, bookId }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paymentCurrency,setPaymentCurrency]=useState("USD"); const [paymentAmount,setPaymentAmount]=useState<number|null>(price??0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const full_name = String(f.get("full_name") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    if (!full_name || !phone) return toast.error("Nom et téléphone requis");
    const payment_method = String(f.get("payment_method") || "") || null;
    const payment_ref = String(f.get("payment_ref") || "").trim().slice(0, 80) || null;
    if (price && !payment_ref) return toast.error("Indiquez la référence de votre paiement Mobile Money");
    if(price&&paymentAmount===null)return toast.error("Cette devise n’a pas de taux de paiement validé.");
    setBusy(true);
    const { error } = await supabase.from("orders").insert({
      kind,
      book_id: bookId ?? null,
      item,
      modality: modality ?? null,
      price_usd: price ?? null,
      full_name: full_name.slice(0, 120),
      phone: phone.slice(0, 40),
      email: String(f.get("email") || "").slice(0, 200) || null,
      details: String(f.get("details") || "").slice(0, 3000) || null,
      attachment_link: String(f.get("attachment_link") || "").slice(0, 500) || null,
      payment_method: price ? payment_method : null,
      payment_ref: price ? payment_ref : null,
      payment_currency:paymentCurrency,payment_amount:paymentAmount,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(kind === "livre" ? "Demande enregistrée — paiement en attente de vérification. Le téléchargement sera disponible après confirmation." : t("sent"));
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
            {price ? (
              <div className="space-y-2 rounded-xl border border-gold bg-accent p-3 text-sm">
                <div className="font-semibold">Paiement Mobile Money : {price} $</div>
                <PaymentCurrency usd={price} onChange={(currency,amount)=>{setPaymentCurrency(currency);setPaymentAmount(amount);}}/>
                {!["USD","CDF"].includes(paymentCurrency)&&<p>Demandez les coordonnées de paiement pour cette devise à bersainfos@gmail.com avant de payer.</p>}
                <p className="text-muted-foreground">Envoyez le montant à l'un de ces numéros, puis indiquez la référence de la transaction reçue par SMS.</p>
                <label className="flex items-center gap-2"><input type="radio" name="payment_method" value="M-Pesa" defaultChecked /> M-Pesa : <b>{MOBILE_MONEY.mpesa}</b></label>
                <label className="flex items-center gap-2"><input type="radio" name="payment_method" value="Airtel Money" /> Airtel Money : <b>{MOBILE_MONEY.airtel}</b></label>
                <Input name="payment_ref" placeholder="Référence de la transaction" required maxLength={80} />
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy || (!!price && paymentAmount===null)}>
              {t("send")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
