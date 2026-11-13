// Modèles de lettres administratives : la forme est fixe, seules les données [entre crochets] changent.
export interface LetterTemplate { id: string; label: string; html: string; fields: string[] }

const IND = "&emsp;".repeat(14);
const p = (t: string) => `<p style="text-align: justify">${IND}${t}</p>`;
const head = (left: string, right: string) =>
  `<table><tbody><tr><td><p>${left}</p></td><td><p style="text-align: right">${right}</p></td></tr></tbody></table>`;

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "lettre-motivation",
    label: "Lettre de motivation",
    fields: ["Nom complet", "Adresse", "Téléphone", "E-mail", "Ville", "Date", "Poste visé", "Destinataire", "Diplôme et université", "Qualités"],
    html:
      head(`<strong>[NOM POSTNOM Prénom]</strong><br>Adresse : [Avenue, n°, quartier, commune, ville]<br>Tél. : [Numéro]<br>E-mail : [adresse e-mail]`, `<em>[Ville], le [date]</em>`) +
      head(`<strong><u>Objet :</u></strong> Candidature au poste de [intitulé du poste]`, `À l’attention de [la Direction des Ressources humaines de …]`) +
      `<p></p><p style="text-align: center">Madame, Monsieur,</p>` +
      p(`Titulaire d’un diplôme de [diplôme] de [université], je vous soumets ma candidature au poste de [intitulé du poste] au sein de [organisation].`) +
      p(`Ma formation m’a permis de développer [compétences et qualités], qualités essentielles à [missions du poste].`) +
      p(`[Dynamique, méthodique et désireux d’apprendre], je suis prêt à m’investir pleinement dans les missions qui me seront confiées.`) +
      p(`Je serais honoré de pouvoir vous présenter plus amplement ma motivation au cours d’un entretien.`) +
      p(`Je vous prie d’agréer, Madame, Monsieur, l’expression de ma considération distinguée.`) +
      `<p style="text-align: right"><strong>[NOM POSTNOM Prénom]</strong></p>`,
  },
  {
    id: "demande-emploi",
    label: "Lettre de demande d’emploi",
    fields: ["Nom complet", "Adresse", "Téléphone", "E-mail", "Ville", "Date", "Fonction demandée", "Destinataire", "Diplôme", "Cours ou tâches proposés"],
    html:
      head(`Nom : [NOM POSTNOM PRÉNOM]<br>Adresse : [Avenue, n°, quartier, commune]<br>Tél. : [Numéro]<br>E-mail : [adresse e-mail]`, `[Ville], le [jj / mm / aaaa]`) +
      head(`<strong><u>Objet</u></strong> : Demande d’emploi en qualité de [fonction].`, `À [Madame, Monsieur le (la) Préfet(e) / Directeur(trice)]`) +
      `<p></p><p style="text-align: center">[Monsieur le Préfet],</p>` +
      p(`J’ai l’honneur de venir très respectueusement auprès de votre haute autorité solliciter un emploi au sein de votre établissement, en qualité de [fonction].`) +
      p(`En effet, titulaire d’un diplôme de [diplôme] de [université], je désire mettre mes connaissances et mes qualités personnelles au service de votre établissement.`) +
      p(`À cet effet, je me tiens à votre disposition pour assurer [cours ou tâches proposés].`) +
      p(`Dans l’espoir d’une suite favorable à ma présente demande, je reste disponible pour tout entretien ou toute évaluation complémentaire que vous jugerez utile.`) +
      p(`Je vous prie d’agréer, [Monsieur le Préfet], l’expression de ma très haute considération.`) +
      `<p style="text-align: right"><strong>[NOM POSTNOM Prénom]</strong></p>`,
  },
  {
    id: "note-service",
    label: "Lettre officielle — Note de service",
    fields: ["Timbre / institution", "Fonction de l’expéditeur", "Destinataire", "Objet", "Faits et demande", "Décision"],
    html:
      `<p>[Timbres de l’institution]</p>` +
      `<p style="text-align: center"><strong>[LE DIRECTEUR GÉNÉRAL]</strong></p>` +
      `<p style="text-align: center"><strong>A</strong></p>` +
      `<p style="text-align: right"><strong>[Monsieur le Doyen de la Faculté de …<br>de l’Université …]</strong></p>` +
      `<p><strong>Objet</strong> : [objet de la correspondance]</p>` +
      `<p><strong>[Monsieur le Doyen],</strong></p>` +
      `<p style="text-align: justify">[Rappel de la correspondance reçue et de la demande.]</p>` +
      `<p style="text-align: justify">Faisant suite à votre demande,</p>` +
      `<p style="text-align: justify">J’ai l’honneur de vous signifier [décision et motif].</p>` +
      `<p style="text-align: justify">[Perspective ou suite envisagée.]</p>` +
      `<p style="text-align: justify">Veuillez agréer, <strong>[Monsieur le Doyen]</strong>, l’assurance de ma considération distinguée.</p>` +
      `<p style="text-align: center"><strong>[LE DIRECTEUR GÉNÉRAL]</strong></p>`,
  },
];

export function letterPrompt(t: LetterTemplate) {
  return `Rédige une « ${t.label} » en complétant le modèle ouvert sur le papier. Conserve exactement sa forme (en-tête, objet, destinataire, formules, signature). Données : ${t.fields.map(f => `${f} : …`).join(" ; ")}.`;
}
