import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { courseAccess, currencies, signedCommunity, uploadCommunity } from "@/lib/community";
import { MOBILE_MONEY } from "@/lib/catalog";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type Enrollment = Database["public"]["Tables"]["course_enrollments"]["Row"];

export function CourseCatalog() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [publish, setPublish] = useState(false);
  const [choice, setChoice] = useState<Course | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    const [c, e] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("course_enrollments").select("*").eq("user_id", user?.id ?? ""),
    ]);
    setRows(c.data ?? []);
    setEnrollments(e.data ?? []);
    const imgs: Record<string, string> = {};
    await Promise.all(
      (c.data ?? []).filter((r) => r.cover_path).map(async (r) => {
        if (!r.cover_path) return;
        try { imgs[r.id] = await signedCommunity(r.cover_path); } catch {}
      })
    );
    setImages(imgs);
  }

  useEffect(() => { if (user) void load(); }, [user]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    const file = f.get("file");
    const cover = f.get("cover");
    if (!(file instanceof File) || !file.size) { toast.error("Ajoutez le support de formation."); return; }
    setBusy(true);
    let id: string | null = null;
    const uploaded: string[] = [];
    try {
      const filePath = await uploadCommunity(user.id, file);
      uploaded.push(filePath);
      let coverPath: string | null = null;
      if (cover instanceof File && cover.size) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(cover.type)) throw new Error("Affiche : JPEG, PNG ou WebP.");
        coverPath = await uploadCommunity(user.id, cover);
        uploaded.push(coverPath);
      }
      const { data, error } = await supabase.from("courses").insert({
        title: String(f.get("title")),
        description: String(f.get("description")),
        domain: String(f.get("domain")),
        price: Number(f.get("price")),
        currency: String(f.get("currency")),
        cover_path: coverPath,
        status: "pending",
      }).select("id").single();
      if (error || !data) throw error ?? new Error("Publication impossible");
      id = data.id;
      const resource = await supabase.from("course_resources").insert({ course_id: id, file_path: filePath });
      if (resource.error) throw resource.error;
      setPublish(false);
      toast.success("Formation soumise pour vérification.");
      await load();
    } catch (err) {
      if (!id && uploaded.length) await supabase.storage.from("community").remove(uploaded);
      toast.error(err instanceof Error ? err.message : "Publication impossible.");
    } finally { setBusy(false); }
  }

  async function enroll(c: Course, method?: string, reference?: string) {
    setBusy(true);
    const { error } = await supabase.from("course_enrollments").insert({
      course_id: c.id,
      amount: c.price,
      currency: c.currency,
      payment_method: method ?? null,
      payment_reference: reference ?? null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setChoice(null);
    toast.success(c.price === 0 ? "Inscription gratuite confirmée." : "Paiement en attente de validation.");
    await load();
  }

  async function download(c: Course) {
    try {
      const { data, error } = await supabase.from("course_resources").select("file_path").eq("course_id", c.id).single();
      if (error || !data) throw error ?? new Error("Accès indisponible");
      const url = await signedCommunity(data.file_path);
      window.open(url, "_blank", "noopener");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Téléchargement indisponible."); }
  }

  const published = rows.filter((c) => c.status === "published");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          aria-label="Rechercher une formation"
          placeholder="Rechercher une formation…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md rounded-xl bg-white"
        />
        <Button onClick={() => setPublish(true)} className="rounded-xl bg-[#0a192f] hover:bg-[#1e3a8a] text-white">
          + Publier une formation
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {published
          .filter((c) => `${c.title} ${c.domain}`.toLowerCase().includes(query.toLowerCase()))
          .map((c) => {
            const en = enrollments.find((e) => e.course_id === c.id);
            const access = en && courseAccess(en.status);
            return (
              <article key={c.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md">
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#0a192f] to-[#1e3a8a]">
                  {images[c.id] ? 
                 <img src={images[c.id]} alt={c.title} className="h-full w-full object-contain bg-slate-900/10" />

                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-white">
                      <span className="text-2xl">🎓</span>
                      <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-300">Formation BERSA</span>
                      <span className="line-clamp-2 px-2 text-xs font-medium text-slate-200">{c.domain}</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-xs">
                    {c.price === 0 ? "Gratuit" : `${c.price} ${c.currency}`}
                  </span>
                </div>
                <div className="p-4">
                  <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">{c.domain}</span>
                  <h2 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 leading-snug">{c.title}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-relaxed">{c.description}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {access || c.user_id === user?.id ? (
                      <>
                        <Button className="w-full bg-[#0a192f] text-white hover:bg-[#1e3a8a]" onClick={() => void download(c)}>
                          Suivre / Télécharger
                        </Button>
                        <a href="/redaction" className="inline-flex w-full items-center justify-center rounded-md border border-amber-500 bg-amber-50 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">
                          ✍️ Pratiquer dans l'Atelier Word A4
                        </a>
                      </>
                    ) : en ? (
                      <p className="text-center text-xs font-medium text-amber-700">
                        {en.status === "pending" ? "Paiement en cours de vérification" : "Inscription refusée"}
                      </p>
                    ) : (
                      <Button className="w-full bg-[#0a192f] text-white hover:bg-[#1e3a8a]" disabled={busy} onClick={() => (c.price === 0 ? void enroll(c) : setChoice(c))}>
                        S'inscrire à la formation
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
      </div>

      {!published.length && <p className="py-10 text-center text-sm text-slate-500">Aucune formation publiée pour le moment.</p>}

      <h2 className="mt-8 font-serif text-xl font-bold text-slate-900">Mes formations publiées</h2>
      <div className="mt-3 space-y-2">
        {rows.filter((c) => c.user_id === user?.id).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs">
            <span className="font-semibold text-slate-800">{c.title}</span>
            <span className={`rounded px-2 py-0.5 font-bold ${c.status === "published" ? "bg-emerald-50 text-emerald-700" : c.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
              {c.status === "pending" ? "En attente" : c.status === "published" ? "Publié" : "Refusé"}
            </span>
          </div>
        ))}
      </div>

      <Dialog open={publish} onOpenChange={setPublish}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Publier une formation</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <Input name="title" aria-label="Titre de la formation" placeholder="Titre" required maxLength={200} />
            <Input name="domain" aria-label="Domaine" placeholder="Domaine" required />
            <Textarea name="description" aria-label="Présentation et exigences" placeholder="Programme et exigences" required maxLength={10000} />
            <div className="flex gap-2">
              <Input name="price" aria-label="Prix" type="number" min="0" step="0.01" defaultValue="0" required />
              <select name="currency" aria-label="Devise" className="rounded border bg-background px-2 text-xs">
                {currencies.map((c) => (<option key={c}>{c}</option>))}
              </select>
            </div>
            <label className="block text-xs font-medium text-slate-700">Support de cours (PDF, DOCX...)<Input name="file" type="file" required className="mt-1" /></label>
            <label className="block text-xs font-medium text-slate-700">Affiche de formation (optionnelle)<Input name="cover" type="file" accept="image/png,image/jpeg,image/webp" className="mt-1" /></label>
            <Button disabled={busy} className="w-full bg-[#0a192f] text-white hover:bg-[#1e3a8a]">Soumettre pour vérification</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!choice} onOpenChange={(open) => { if (!open) setChoice(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{choice?.title}</DialogTitle></DialogHeader>
          {choice && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void enroll(choice, String(f.get("method")), String(f.get("reference"))); }}>
              <p className="text-sm font-semibold text-slate-900">{choice.price} {choice.currency}</p>
              <p className="text-xs text-slate-600">L'accès sera validé après confirmation de la réception du montant.</p>
              {["USD", "CDF"].includes(choice.currency) ? (
                <>
                  <p className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-900 font-medium">M-Pesa : {MOBILE_MONEY.mpesa} · Airtel Money : {MOBILE_MONEY.airtel}</p>
                  <select name="method" className="w-full rounded-md border bg-background p-2 text-xs"><option>M-Pesa</option><option>Airtel Money</option></select>
                  <Input name="reference" aria-label="Référence de paiement" placeholder="Référence de paiement Mobile Money" required maxLength={80} />
                  <Button disabled={busy} className="w-full bg-[#0a192f] text-white hover:bg-[#1e3a8a]">Envoyer la demande</Button>
                </>
              ) : (
                <p className="text-xs text-slate-600">Contactez bersainfos@gmail.com pour obtenir un moyen de paiement dans cette devise.</p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
                                                         }       
