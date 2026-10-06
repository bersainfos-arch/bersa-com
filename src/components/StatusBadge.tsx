export const STATUSES = [
  { v: "en_attente", label: "En attente" },
  { v: "en_cours", label: "En cours" },
  { v: "termine", label: "Terminé" },
];

export function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find((x) => x.v === status);
  const cls =
    status === "termine" ? "bg-success text-primary-foreground" : status === "en_cours" ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground";
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{s?.label ?? status}</span>;
}
