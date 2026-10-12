import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { domains } from "@/lib/catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PublicationSlideshow } from "@/components/PublicationSlideshow";
import { signedCommunity, uploadCommunity } from "@/lib/community";
import {
  Briefcase,
  CalendarClock,
  ExternalLink,
  FileCheck2,
  MapPin,
  Plus,
  Search,
  Send,
} from "lucide-react";

export const Route = createFileRoute("/opportunites")({
  head: () => ({
    meta: [
      { title: "Opportunités — BERSA", description: "Emplois, stages, bourses et appels d'offres publiés et vérifiés par BERSA." },
      { property: "og:title", content: "Opportunités — BERSA" },
      { property: "og:description", content: "Emplois, stages, bourses et appels d'offres publiés et vérifiés par BERSA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }, { property: "og:image", content: "/icon-512.png" }, { property: "og:url", content: "https://bersa.org/opportunites" },
    ],
  }),
  component: Opportunites,
});

type Opp = {
  id: string;
  user_id: string;
  organisation: string;
  contact_email: string;
  title: string;
  kind: string;
  domain: string;
  description: string;
  location: string | null;
  qualifications: string | null;
  documents: string | null;
  conditions: string | null;
  external_link: string | null;
  deadline: string | null;
  status: string;
  created_at: string;
  cover_path?: string | null;
};

type AppRow = {
  id: string;
  opportunity_id: string;
  full_name: string;
  email: string;
  message: string;
  attachment_link: string | null;
  status: string;
  created_at: string;
  opportunities?: { title: string } | null;
};

const KINDS = [
  { v: "emploi", fr: "Emploi", en: "Job" },
  { v: "stage", fr: "Stage", en: "Internship" },
  { v: "bourse", fr: "Bourse", en: "Scholarship" },
  { v: "appel", fr: "Appel d'offres", en: "Call for proposals" },
  { v: "autre", fr: "Autre", en: "Other" },
];

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const emptyForm = {
  organisation: "",
  contact_email: "",
  title: "",
  kind: "emploi",
  domain: "general",
  location: "",
  deadline: "",
  description: "",
  qualifications: "",
  documents: "",
  conditions: "",
  external_link: "",
};

function Opportunites() {
  const [rows, setRows] = useState<Opp[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kindF, setKindF] = useState("tous");
  const [domainF, setDomainF] = useState("tous");
  const [publishOpen, setPublishOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [applyTo, setApplyTo] = useState<Opp | null>(null);
  const [apply, setApply] = useState({ full_name: "", email: "", message: "", attachment_link: "" });
  const [busy, setBusy] = useState(false);
  const [cover,setCover]=useState<File|null>(null); const [images,setImages]=useState<Record<string,string>>({});

  async function load() {
    setLoading(true);
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
      supabase
        .from("applications")
        .select("*, opportunities(title)")
        .order("created_at", { ascending: false }),
    ]);
    setRows((r ?? []) as unknown as Opp[]);
    const imgs:Record<string,string>={}; await Promise.all((r??[]).filter(x=>x.cover_path).map(async x=>{if(x.cover_path){try{imgs[x.id]=await signedCommunity(x.cover_path);}catch{}}})); setImages(imgs);
    setApps((a ?? []) as unknown as AppRow[]);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    void load();
  }, []);

  useEffect(() => {
    if (userId) setApply((p) => ({ ...p, full_name: p.full_name, email: p.email }));
  }, [userId]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.status !== "active" && r.user_id !== userId) return false;
      if (kindF !== "tous" && r.kind !== kindF) return false;
      if (domainF !== "tous" && r.domain !== domainF) return false;
      if (term && !`${r.title} ${r.organisation} ${r.description}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, q, kindF, domainF, userId]);

  const mine = rows.filter((r) => r.user_id === userId);
  const myApps = apps;

  async function publish() {
    if (!userId) {
      toast.error("Connectez-vous pour publier une opportunité.");
      return;
    }
    if (!form.organisation.trim() || !form.title.trim()) {
      toast.error("Organisation et titre de l'offre requis.");
      return;
    }
    if (!emailOk(form.contact_email)) {
      toast.error("Adresse e-mail de contact invalide.");
      return;
    }
    setBusy(true);
    let coverPath:string|null=null;
    try{if(cover)coverPath=await uploadCommunity(userId,cover);}catch(e){setBusy(false);toast.error(e instanceof Error?e.message:"Affiche impossible");return;}
    const { error } = await supabase.from("opportunities").insert({
      cover_path:coverPath,
      user_id: userId,
      organisation: form.organisation.trim(),
      contact_email: form.contact_email.trim(),
      title: form.title.trim(),
      kind: form.kind,
      domain: form.domain,
      description: form.description,
      location: form.location.trim() || null,
      qualifications: form.qualifications.trim() || null,
      documents: form.documents.trim() || null,
      conditions: form.conditions.trim() || null,
      external_link: form.external_link.trim() || null,
      deadline: form.deadline || null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    setPublishOpen(false);
    setForm(emptyForm);
    toast.success("Opportunité envoyée", { description: "Elle sera publiée après vérification." });
    void load();
  }

  async function applyNow() {
    if (!userId || !applyTo) {
      toast.error("Connectez-vous pour postuler.");
      return;
    }
    if (!apply.full_name.trim()) {
      toast.error("Nom complet requis.");
      return;
    }
    if (!emailOk(apply.email)) {
      toast.error("Adresse e-mail invalide.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("applications").insert({
      opportunity_id: applyTo.id,
      user_id: userId,
      full_name: apply.full_name.trim(),
      email: apply.email.trim(),
      message: apply.message,
      attachment_link: apply.attachment_link.trim() || null,
      status: "recue",
    });
    setBusy(false);
    if (error) {
      toast.error("Candidature non enregistrée", { description: error.message });
      return;
    }
    setApplyTo(null);
    setApply({ full_name: "", email: "", message: "", attachment_link: "" });
    toast.success("Candidature enregistrée", { description: "Vous retrouverez son suivi dans « Mes candidatures »." });
    void load();
  }

  const field = (k: keyof typeof emptyForm) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value })),
  });

  return (
    <AppShell>
      <PageHeader
        title="Opportunités et emplois"
        subtitle="Emplois, stages, bourses et appels d'offres publiés par des organisations, vérifiés avant mise en ligne."
      />
      <PublicationSlideshow label="Dernières opportunités" items={rows.filter(r=>r.status==="active").map(r=>({id:r.id,title:r.title,subtitle:r.organisation,image:images[r.id],created_at:r.created_at}))}/>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un titre, une organisation…"
              className="pl-9"
            />
          </div>
          <Select value={kindF} onValueChange={setKindF}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les types</SelectItem>
              {KINDS.map((k) => (
                <SelectItem key={k.v} value={k.v}>
                  {k.fr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={domainF} onValueChange={setDomainF}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les domaines</SelectItem>
              <SelectItem value="general">Général</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.fr} value={d.fr}>
                  {d.fr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setPublishOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Publier
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : visible.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aucune opportunité ne correspond à votre recherche.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((r) => {
              const kind = KINDS.find((k) => k.v === r.kind);
              return (
                <Card key={r.id} className="flex flex-col">
                  <CardHeader className="gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{kind?.fr ?? r.kind}</Badge>
                      <Badge variant="secondary">{r.domain}</Badge>
                      {r.status === "pending" && <Badge className="bg-amber text-amber-foreground">En attente</Badge>}
                    </div>
                    <CardTitle className="text-xl">{r.title}</CardTitle>
                    <p className="text-sm font-semibold text-primary">{r.organisation}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                    {r.location && (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {r.location}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      {r.deadline ? `Limite : ${fmtDate(r.deadline)}` : "Sans limite de date"}
                    </p>
                    <p className="line-clamp-4 whitespace-pre-line">{r.description}</p>
                    {r.qualifications && (
                      <p className="whitespace-pre-line text-muted-foreground">
                        <span className="font-semibold text-foreground">Profil : </span>
                        {r.qualifications}
                      </p>
                    )}
                    {r.documents && (
                      <p className="whitespace-pre-line text-muted-foreground">
                        <span className="font-semibold text-foreground">Documents : </span>
                        {r.documents}
                      </p>
                    )}
                    {r.conditions && (
                      <p className="whitespace-pre-line text-muted-foreground">
                        <span className="font-semibold text-foreground">Conditions : </span>
                        {r.conditions}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={() => setApplyTo(r)}>
                        <Send className="mr-1 h-4 w-4" /> Postuler
                      </Button>
                      {r.external_link && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={r.external_link} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1 h-4 w-4" /> En savoir plus
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck2 className="h-5 w-5 text-gold" /> Mes candidatures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myApps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune candidature enregistrée.</p>
              ) : (
                myApps.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      {a.opportunities?.title ?? "Opportunité"}
                      <span className="ml-2 text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
                    </span>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {a.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-gold" /> Mes publications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mine.length === 0 ? (
                <p className="text-sm text-muted-foreground">Vous n'avez pas encore publié d'opportunité.</p>
              ) : (
                mine.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="truncate">{r.title}</span>
                    <Badge
                      variant="outline"
                      className={
                        r.status === "active"
                          ? "shrink-0 border-emerald text-emerald"
                          : r.status === "refused"
                            ? "shrink-0 border-red text-red"
                            : "shrink-0 border-amber text-amber"
                      }
                    >
                      {r.status === "active" ? "Publiée" : r.status === "refused" ? "Refusée" : "En attente"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publier une opportunité</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label className="grid gap-1 text-sm sm:col-span-2">Affiche facultative<Input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setCover(e.target.files?.[0]??null)}/></Label>
            <Label className="grid gap-1 text-sm">
              Organisation *
              <Input {...field("organisation")} placeholder="Nom de l'organisation" />
            </Label>
            <Label className="grid gap-1 text-sm">
              E-mail de contact *
              <Input {...field("contact_email")} type="email" placeholder="contact@organisation.org" />
            </Label>
            <Label className="grid gap-1 text-sm sm:col-span-2">
              Titre de l'offre *
              <Input {...field("title")} placeholder="Ex. Chargé de projet éducatif" />
            </Label>
            <Label className="grid gap-1 text-sm">
              Type
              <Select value={form.kind} onValueChange={(v) => setForm((p) => ({ ...p, kind: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.v} value={k.v}>
                      {k.fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
            <Label className="grid gap-1 text-sm">
              Domaine
              <Select value={form.domain} onValueChange={(v) => setForm((p) => ({ ...p, domain: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  {domains.map((d) => (
                    <SelectItem key={d.fr} value={d.fr}>
                      {d.fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
            <Label className="grid gap-1 text-sm">
              Lieu
              <Input {...field("location")} placeholder="Ville, pays ou « en ligne »" />
            </Label>
            <Label className="grid gap-1 text-sm">
              Date limite
              <Input {...field("deadline")} type="date" />
            </Label>
            <Label className="grid gap-1 text-sm sm:col-span-2">
              Description de l'offre
              <Textarea {...field("description")} rows={4} placeholder="Missions, contexte, présentation…" />
            </Label>
            <Label className="grid gap-1 text-sm">
              Profil recherché
              <Textarea {...field("qualifications")} rows={3} placeholder="Diplômes, compétences, expérience…" />
            </Label>
            <Label className="grid gap-1 text-sm">
              Documents à fournir
              <Textarea {...field("documents")} rows={3} placeholder="CV, lettre, copies…" />
            </Label>
            <Label className="grid gap-1 text-sm sm:col-span-2">
              Conditions
              <Textarea {...field("conditions")} rows={2} placeholder="Rémunération, durée, exigences…" />
            </Label>
            <Label className="grid gap-1 text-sm sm:col-span-2">
              Lien externe
              <Input {...field("external_link")} placeholder="https://…" />
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            L'opportunité est enregistrée en attente de vérification puis publiée par un administrateur.
          </p>
          <Button onClick={publish} disabled={busy}>
            {busy ? "Envoi…" : "Envoyer pour vérification"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!applyTo} onOpenChange={(o) => !o && setApplyTo(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Postuler — {applyTo?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Label className="grid gap-1 text-sm">
              Nom complet *
              <Input
                value={apply.full_name}
                onChange={(e) => setApply((p) => ({ ...p, full_name: e.target.value }))}
              />
            </Label>
            <Label className="grid gap-1 text-sm">
              E-mail *
              <Input
                type="email"
                value={apply.email}
                onChange={(e) => setApply((p) => ({ ...p, email: e.target.value }))}
              />
            </Label>
            <Label className="grid gap-1 text-sm">
              Message de motivation
              <Textarea
                rows={4}
                value={apply.message}
                onChange={(e) => setApply((p) => ({ ...p, message: e.target.value }))}
              />
            </Label>
            <Label className="grid gap-1 text-sm">
              Lien vers vos documents (Drive, WeTransfer…)
              <Input
                value={apply.attachment_link}
                onChange={(e) => setApply((p) => ({ ...p, attachment_link: e.target.value }))}
                placeholder="https://…"
              />
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Votre candidature est enregistrée et transmise à {applyTo?.organisation}.
          </p>
          <Button onClick={applyNow} disabled={busy}>
            {busy ? "Envoi…" : "Envoyer ma candidature"}
          </Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
