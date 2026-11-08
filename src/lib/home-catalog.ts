export const TEMPLATE_DOMAINS = ["Folio CV", "Lettres administratives", "Business", "Actes juridiques", "Affiches", "Couverture", "Rapports et mémoires", "Factures et devis", "Attestations et certificats", "Procès-verbaux"] as const;
export function templateDomain(title: string) {
  if (/\bcv\b|curriculum/i.test(title)) return TEMPLATE_DOMAINS[0];
  if (/lettre|courrier/i.test(title)) return TEMPLATE_DOMAINS[1];
  if (/business|affaire/i.test(title)) return TEMPLATE_DOMAINS[2];
  if (/juridique|contrat|requête/i.test(title)) return TEMPLATE_DOMAINS[3];
  if (/affiche|flyer/i.test(title)) return TEMPLATE_DOMAINS[4];
  if (/couverture|garde/i.test(title)) return TEMPLATE_DOMAINS[5];
  if (/facture|devis/i.test(title)) return TEMPLATE_DOMAINS[7];
  if (/attestation|certificat/i.test(title)) return TEMPLATE_DOMAINS[8];
  if (/procès|compte.rendu/i.test(title)) return TEMPLATE_DOMAINS[9];
  return TEMPLATE_DOMAINS[6];
}
export function homeCards<T>(items: T[]) { return items.slice(0, 4); }