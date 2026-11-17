import { useState } from "react";
import { Crop, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CvData, CvTemplate } from "@/lib/cv-templates";
import { toast } from "sonner";

const fields = ["Lieu de naissance", "Sexe", "Nationalité", "État civil", "LinkedIn"];
const sections = ["Cours", "Stages", "Activités", "Références", "Qualités", "Certificats", "Réalisations", "Bas de page", "Rubrique personnalisée"];
const fonts = ["Arial", "Calibri", "Times New Roman", "Georgia", "Garamond", "Verdana", "Trebuchet MS"];
const input = "mt-1 w-full rounded-md border bg-muted p-2 text-sm text-foreground";

export function CvPersonalization({ data, template, onChange }: { data: CvData; template: CvTemplate; onChange: (patch: Partial<CvData>) => void }) {
  const [visible, setVisible] = useState<string[]>([]);
  const [crop, setCrop] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const source = data.photo || template.defaultPhoto;
  const applyCrop = async () => {
    if (!source) return;
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const side = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
      const canvas = document.createElement("canvas"); canvas.width = 600; canvas.height = 600;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.drawImage(image, (image.naturalWidth - side) * x / 100, (image.naturalHeight - side) * y / 100, side, side, 0, 0, 600, 600);
      onChange({ photo: canvas.toDataURL("image/jpeg", 0.9) }); setCrop(false);
    } catch { toast.error("Impossible de rogner cette photo. Insérez une photo de votre appareil."); }
  };
  return <section className="space-y-3 border-b pb-4" aria-label="Personnalisation du CV">
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs">Police du CV<select aria-label="Police du CV" className={input} value={data.customFont || template.font} onChange={e => onChange({ customFont: e.target.value })}>{fonts.map(f => <option key={f}>{f}</option>)}</select></label>
      <label className="text-xs">Couleur du CV<input aria-label="Couleur du CV" type="color" className="mt-1 block h-10 w-full cursor-pointer rounded-md border bg-muted" value={data.customColor || template.primary} onChange={e => onChange({ customColor: e.target.value })} /></label>
    </div>
    <div className="flex flex-wrap items-center gap-1">
      {([['square', 'Carré'], ['rounded', 'Arrondi'], ['circle', 'Cercle']] as const).map(([value, label]) => <Button key={value} size="sm" variant={data.photoShape === value ? "default" : "outline"} onClick={() => onChange({ photoShape: value })}>{label}</Button>)}
      <Button size="sm" variant="outline" disabled={!source} onClick={() => { setCrop(!crop); setZoom(1); setX(50); setY(50); }}><Crop className="h-4 w-4" /> Rogner</Button>
      <Button size="icon" variant="ghost" title="Rétablir la couleur, la police et la forme du modèle" aria-label="Rétablir le style du modèle" onClick={() => onChange({ customColor: template.primary, customFont: template.font, photoShape: template.layout === "lateral-couleur" || template.layout === "entete-arrondi" ? "circle" : "square" })}><RefreshCw className="h-4 w-4" /></Button>
    </div>
    {crop && source && <div className="space-y-2">
      <svg viewBox="0 0 600 600" className={`mx-auto h-48 w-48 overflow-hidden border ${data.photoShape === 'circle' ? 'rounded-full' : ''}`} aria-label="Zone de rognage">
        <CropImage source={source} zoom={zoom} x={x} y={y} />
      </svg>
      {([['Zoom photo', zoom, 1, 3, setZoom], ['Position horizontale', x, 0, 100, setX], ['Position verticale', y, 0, 100, setY]] as const).map(([label, value, min, max, change]) => <label key={label} className="block text-xs">{label}<input className="block w-full" aria-label={label} type="range" min={min} max={max} step={0.01} value={value} onChange={e => change(Number(e.target.value))} /></label>)}
      <Button size="sm" onClick={applyCrop}>Appliquer le rognage</Button>
    </div>}
    <div className="flex flex-wrap gap-1">{fields.map(label => <Button key={label} size="sm" variant="outline" onClick={() => setVisible(v => v.includes(label) ? v.filter(x => x !== label) : [...v, label])}><Plus className="h-3 w-3" />{label}</Button>)}<Button size="sm" variant="outline" onClick={() => { const name = window.prompt("Nom du champ personnalisé"); if (name?.trim()) setVisible(v => [...new Set([...v, name.trim()])]); }}><Plus className="h-3 w-3" />Champ personnalisé</Button></div>
    {[...new Set([...visible, ...Object.keys(data.extra || {})])].map(label => <label key={label} className="block text-xs">{label}<input className={input} value={data.extra?.[label] || ''} onChange={e => onChange({ extra: { ...data.extra, [label]: e.target.value } })} /></label>)}
  </section>;
}

function CropImage({ source, zoom, x, y }: { source: string; zoom: number; x: number; y: number }) {
  const [size, setSize] = useState({ w: 600, h: 600 });
  const scale = 600 * zoom / Math.min(size.w, size.h);
  const w = size.w * scale, h = size.h * scale;
  return <image href={source} width={w} height={h} x={-(w - 600) * x / 100} y={-(h - 600) * y / 100} preserveAspectRatio="none" onLoad={() => { const img = new Image(); img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight }); img.src = source; }} />;
}

export function CvExtraSections({ data, onChange }: { data: CvData; onChange: (patch: Partial<CvData>) => void }) {
  return <section className="space-y-3 border-t pt-3">
    <h2 className="text-lg font-semibold">Rubriques supplémentaires</h2>
    <div className="flex flex-wrap gap-1">{sections.map(title => <Button key={title} size="sm" variant="outline" onClick={() => onChange({ sections: [...(data.sections || []), { key: crypto.randomUUID(), title, content: '' }] })}><Plus className="h-3 w-3" />{title}</Button>)}</div>
    {(data.sections || []).map(section => <div key={section.key} className="space-y-1"><label className="block text-xs">Titre de rubrique<input className={input} value={section.title} onChange={e => onChange({ sections: (data.sections || []).map(s => s.key === section.key ? { ...s, title: e.target.value } : s) })} /></label><label className="block text-xs">Contenu<textarea className={input} rows={3} value={section.content} onChange={e => onChange({ sections: (data.sections || []).map(s => s.key === section.key ? { ...s, content: e.target.value } : s) })} /></label><Button size="sm" variant="ghost" onClick={() => onChange({ sections: (data.sections || []).filter(s => s.key !== section.key) })}>Supprimer la rubrique</Button></div>)}
    <label className="block text-xs">Signature<input className={input} value={data.signature || ''} onChange={e => onChange({ signature: e.target.value })} /></label>
  </section>;
}