import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, PenLine, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CvPreview } from "@/components/CvPreview";
import { LETTER_TEMPLATES, emptyData, letterSheet, sampleData, type LetterTemplate } from "@/lib/letter-templates";

export const Route = createFileRoute("/lettres")({
  head: () => ({ meta: [
    { title: "Lettres administratives éditables | BERSA" },
    { name: "description", content: "Lettre de motivation, demande d’emploi et note de service : remplissez vos données, générez et modifiez sur l’Atelier." },
    { property: "og:title", content: "Lettres administratives BERSA" },
    { property: "og:description", content: "Modèles de lettres officielles à remplir et générer en un clic." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Lettres,
});

const inputCls = "mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground";

function Lettres() {
  const navigate = useNavigate();
  const [tpl, setTpl] = useState<LetterTemplate | null>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const samples = useMemo(() => LETTER_TEMPLATES.map(t => letterSheet(t.html)), []);

  const open = (t: LetterTemplate) => { setTpl(t); setData(emptyData(t)); setGenerated(null); window.scrollTo(0, 0); };
  const generate = () => {
    if (!tpl) return;
    const filled = Object.fromEntries(tpl.fields.map(f => [f.key, data[f.key]?.trim() || f.sample]));
    setGenerated(tpl.render(filled));
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const toAtelier = () => {
    if (!generated || !tpl) return;
    sessionStorage.setItem("bersa-document-html", generated);
    sessionStorage.setItem("bersa-document-title", tpl.label);
    toast.success("Lettre ouverte dans l’Atelier");
    navigate({ to: "/redaction" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-4">
        {!tpl ? (<>
          <h1 className="font-serif text-2xl font-bold text-foreground">Lettres administratives</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choisissez un modèle, remplissez vos données puis générez.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LETTER_TEMPLATES.map((t, i) => (
              <button key={t.id} onClick={() => open(t)} className="overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="pointer-events-none border-b bg-white"><CvPreview html={samples[i] ?? ""} /></div>
                <p className="p-2 text-xs font-semibold text-foreground">{t.label}</p>
              </button>
            ))}
          </div>
        </>) : (<>
          <button onClick={() => setTpl(null)} className="flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />Tous les modèles</button>
          <h1 className="mt-2 font-serif text-xl font-bold text-foreground">{tpl.label}</h1>
          <div className="mt-3 space-y-2 rounded-lg border bg-card p-3">
            {tpl.fields.map(f => (
              <label key={f.key} className="block text-xs font-medium text-muted-foreground">{f.label}
                {f.multi
                  ? <textarea rows={f.key === "corps" ? 7 : 3} className={inputCls} placeholder={f.sample} value={data[f.key] ?? ""} onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))} />
                  : <input className={inputCls} placeholder={f.sample} value={data[f.key] ?? ""} onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))} />}
              </label>
            ))}
            <p className="text-[11px] text-muted-foreground">Une case laissée vide reprend l’exemple affiché en gris.</p>
            <div className="flex gap-2 pt-1">
              <Button onClick={generate} className="flex-1"><Sparkles className="size-4" />Générer</Button>
              <Button variant="outline" onClick={() => setData(sampleData(tpl))}>Voir l’exemple</Button>
            </div>
          </div>
          {generated && (
            <div ref={resultRef} className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-foreground">Lettre générée</h2>
                <Button size="sm" onClick={toAtelier}><PenLine className="size-4" />Modifier sur l’Atelier</Button>
              </div>
              <div className="overflow-hidden rounded-md border bg-white shadow-md"><CvPreview html={letterSheet(generated)} /></div>
            </div>
          )}
        </>)}
      </div>
    </AppShell>
  );
}
