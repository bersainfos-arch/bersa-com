import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { currencies, convertedAmount } from "@/lib/community";
export function PaymentCurrency({ usd, onChange }: { usd: number; onChange: (currency: string, amount: number | null) => void }) {
 const [currency,setCurrency] = useState("USD"); const [rates,setRates] = useState<Record<string,number>>({});
 useEffect(() => { supabase.from("exchange_rates").select("*").then(({data}) => setRates(Object.fromEntries((data??[]).map(r => [r.currency,Number(r.units_per_usd)])))); }, []);
 const amount = convertedAmount(usd,currency,rates[currency]);
 return <label className="grid gap-1 text-sm">Devise de paiement<select aria-label="Devise de paiement" value={currency} className="rounded border bg-background p-2" onChange={e => { setCurrency(e.target.value); onChange(e.target.value,convertedAmount(usd,e.target.value,rates[e.target.value])); }}>{currencies.map(c => <option key={c}>{c}</option>)}</select><span>{amount === null ? "Taux non renseigné par BERSA — paiement indisponible dans cette devise." : `${amount.toLocaleString()} ${currency}`}</span></label>;
}