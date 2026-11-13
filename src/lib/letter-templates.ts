// Modèles de lettres administratives : la forme est fixe, seules les données changent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LetterData = any;
export interface LetterField { key: string; label: string; sample: string; multi?: boolean }
export interface LetterTemplate { id: string; label: string; fields: LetterField[]; render: (d: LetterData) => string; html: string }

const esc = (s: string = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const br = (s: string = "") => esc(s).replace(/\n/g, "<br>");
const IND = "&emsp;".repeat(6);
const paras = (s: string = "") => s.split(/\n+/).map(x => x.trim()).filter(Boolean).map(x => `<p style="text-align: justify">${IND}${esc(x)}</p>`).join("");
const head = (left: string, right: string) =>
  `<table style="width:100%;border:none"><tbody><tr><td style="border:none;vertical-align:top;width:58%"><p>${left}</p></td><td style="border:none;vertical-align:top"><p style="text-align: right">${right}</p></td></tr></tbody></table>`;

type Def = Omit<LetterTemplate, "html">;
const DEFS: Def[] = [
  {
    id: "lettre-motivation", label: "Lettre de motivation",
    fields: [
      { key: "nom", label: "Nom complet", sample: "DJOMA MUKENDI Dieudonné" },
      { key: "adresse", label: "Adresse", sample: "Av. de la Paix n°12, Q. Matonge, Kalamu, Kinshasa" },
      { key: "tel", label: "Téléphone", sample: "+243 81 000 0000" },
      { key: "email", label: "E-mail", sample: "dieudonne.djoma@exemple.com" },
      { key: "ville", label: "Ville", sample: "Kinshasa" },
      { key: "date", label: "Date", sample: "13 novembre 2026" },
      { key: "poste", label: "Poste visé", sample: "Assistant administratif" },
      { key: "dest", label: "Destinataire", sample: "Monsieur le Directeur Général de la Société XYZ" },
      { key: "salut", label: "Formule d’appel", sample: "Monsieur le Directeur," },
      { key: "corps", label: "Corps de la lettre (un paragraphe par ligne)", multi: true, sample:
        "Titulaire d’une licence en Sciences commerciales et administratives de l’Université de Kinshasa, je vous soumets ma candidature au poste d’assistant administratif au sein de votre société.\nMa formation et mes stages m’ont permis de développer la rigueur, le sens de l’organisation et la maîtrise des outils bureautiques, qualités essentielles à la bonne gestion administrative.\nDynamique, méthodique et désireux d’apprendre, je suis prêt à m’investir pleinement dans les missions qui me seront confiées.\nJe serais honoré de pouvoir vous présenter plus amplement ma motivation au cours d’un entretien." },
      { key: "politesse", label: "Formule de politesse", sample: "Je vous prie d’agréer, Monsieur le Directeur, l’expression de ma considération distinguée." },
    ],
    render: d =>
      head(`<strong>${esc(d.nom)}</strong><br>Adresse : ${esc(d.adresse)}<br>Tél. : ${esc(d.tel)}<br>E-mail : ${esc(d.email)}`, `<em>${esc(d.ville)}, le ${esc(d.date)}</em>`) +
      head(`<strong><u>Objet :</u></strong> Candidature au poste de ${esc(d.poste)}`, `<strong>À ${br(d.dest)}</strong><br><strong>À ${esc(d.ville)}</strong>`) +
      `<p></p><p style="text-align: center">${esc(d.salut)}</p>` + paras(d.corps) + paras(d.politesse) +
      `<p></p><p style="text-align: right"><strong>${esc(d.nom)}</strong></p>`,
  },
  {
    id: "demande-emploi", label: "Lettre de demande d’emploi",
    fields: [
      { key: "nom", label: "Nom complet", sample: "KABONGO ILUNGA Francis" },
      { key: "adresse", label: "Adresse", sample: "Av. Lumumba n°45, Q. Kingabwa, Limete" },
      { key: "tel", label: "Téléphone", sample: "+243 82 000 0000" },
      { key: "email", label: "E-mail", sample: "francis.kabongo@exemple.com" },
      { key: "ville", label: "Ville", sample: "Kinshasa" },
      { key: "date", label: "Date", sample: "13 / 11 / 2026" },
      { key: "fonction", label: "Fonction demandée", sample: "enseignant de mathématiques" },
      { key: "dest", label: "Destinataire", sample: "Monsieur le Préfet des études du Lycée Bosangani" },
      { key: "salut", label: "Formule d’appel", sample: "Monsieur le Préfet," },
      { key: "corps", label: "Corps de la lettre (un paragraphe par ligne)", multi: true, sample:
        "J’ai l’honneur de venir très respectueusement auprès de votre haute autorité solliciter un emploi au sein de votre établissement, en qualité d’enseignant de mathématiques.\nEn effet, titulaire d’un diplôme de licence en Mathématiques de l’Université Pédagogique Nationale, je désire mettre mes connaissances et mes qualités personnelles au service de votre établissement.\nÀ cet effet, je me tiens à votre disposition pour assurer les cours d’algèbre, de géométrie et de statistique dans les classes des humanités.\nDans l’espoir d’une suite favorable à ma présente demande, je reste disponible pour tout entretien ou toute évaluation complémentaire que vous jugerez utile." },
      { key: "politesse", label: "Formule de politesse", sample: "Je vous prie d’agréer, Monsieur le Préfet, l’expression de ma très haute considération." },
    ],
    render: d =>
      head(`Nom : <strong>${esc(d.nom)}</strong><br>Adresse : ${esc(d.adresse)}<br>Tél. : ${esc(d.tel)}<br>E-mail : ${esc(d.email)}`, `${esc(d.ville)}, le ${esc(d.date)}`) +
      head(`<strong><u>Objet</u></strong> : Demande d’emploi en qualité de ${esc(d.fonction)}.`, `À <strong>${br(d.dest)}</strong>`) +
      `<p></p><p style="text-align: center">${esc(d.salut)}</p>` + paras(d.corps) + paras(d.politesse) +
      `<p></p><p style="text-align: right"><strong>${esc(d.nom)}</strong></p>`,
  },
  {
    id: "note-service", label: "Lettre officielle — Note de service",
    fields: [
      { key: "timbre", label: "Timbre / institution", multi: true, sample: "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO\nENSEIGNEMENT SUPÉRIEUR ET UNIVERSITAIRE\nINSTITUT SUPÉRIEUR DE COMMERCE\nN° 045/ISC/DG/2026" },
      { key: "exp", label: "Fonction de l’expéditeur", sample: "LE DIRECTEUR GÉNÉRAL" },
      { key: "dest", label: "Destinataire", multi: true, sample: "Monsieur le Doyen de la Faculté de Gestion\nde l’Université de Kinshasa" },
      { key: "objet", label: "Objet", sample: "Réponse à votre demande de partenariat académique" },
      { key: "salut", label: "Formule d’appel", sample: "Monsieur le Doyen," },
      { key: "corps", label: "Corps (un paragraphe par ligne)", multi: true, sample:
        "Accusant réception de votre lettre du 2 novembre relative à l’organisation conjointe de stages pour les étudiants finalistes,\nFaisant suite à votre demande,\nJ’ai l’honneur de vous signifier notre accord de principe pour la signature d’une convention de partenariat dès le prochain semestre.\nNos services techniques prendront contact avec les vôtres afin d’en arrêter les modalités pratiques." },
      { key: "politesse", label: "Formule de politesse", sample: "Veuillez agréer, Monsieur le Doyen, l’assurance de ma considération distinguée." },
    ],
    render: d =>
      `<p style="text-align: center"><strong>${br(d.timbre)}</strong></p><p style="text-align: center"><strong><u>NOTE DE SERVICE</u></strong></p>` +
      `<p style="text-align: center"><strong>${esc(d.exp)}</strong></p><p style="text-align: center"><strong>A</strong></p>` +
      `<p style="text-align: right"><strong>${br(d.dest)}</strong></p>` +
      `<p><strong><u>Objet</u></strong> : ${esc(d.objet)}</p><p><strong>${esc(d.salut)}</strong></p>` +
      String(d.corps ?? "").split(/\n+/).filter((x: string) => x.trim()).map((x: string) => `<p style="text-align: justify">${esc(x.trim())}</p>`).join("") +
      `<p style="text-align: justify">${esc(d.politesse)}</p><p></p><p style="text-align: center"><strong>${esc(d.exp)}</strong></p>`,
  },
];

export const sampleData = (t: Pick<LetterTemplate, "fields">) => Object.fromEntries(t.fields.map(f => [f.key, f.sample]));
export const emptyData = (t: Pick<LetterTemplate, "fields">) => Object.fromEntries(t.fields.map(f => [f.key, ""]));
export const LETTER_TEMPLATES: LetterTemplate[] = DEFS.map(d => ({ ...d, html: d.render(sampleData(d)) }));

/** Feuille A4 d'aperçu (794 px) — le contenu exporté reste le HTML brut. */
export const letterSheet = (html: string) =>
  `<div style="width:794px;min-height:1123px;background:#fff;color:#111;padding:76px 72px;box-sizing:border-box;font-family:'Times New Roman',serif;font-size:16px;line-height:1.6">${html}</div>`;

export function letterPrompt(t: LetterTemplate) {
  return `Rédige une « ${t.label} » en complétant le modèle ouvert sur le papier. Conserve exactement sa forme (en-tête, objet, destinataire, formules, signature). Données : ${t.fields.map(f => `${f.label} : …`).join(" ; ")}.`;
}

/** Champs que l’Assistant peut réécrire ; tout le reste (identité, adresses, dates…) reste verrouillé. */
export const IMPROVABLE = ["salut", "corps", "politesse"] as const;
export function improvePrompt(t: LetterTemplate, d: Record<string, string>) {
  const ctx = t.fields.filter(f => !(IMPROVABLE as readonly string[]).includes(f.key)).map(f => `${f.label} : ${d[f.key]}`).join("\n");
  return `Améliore uniquement la formule d’appel, le corps et la formule de politesse de cette « ${t.label} » : style administratif soutenu, clair, convaincant, sans faute. N’invente aucune donnée personnelle et ne modifie aucune information ci-dessous.\n${ctx}\n\nTexte actuel :\n[APPEL]\n${d["salut"]}\n[CORPS]\n${d["corps"]}\n[POLITESSE]\n${d["politesse"]}\n\nRéponds STRICTEMENT dans ce format, sans titre ni commentaire :\n[APPEL]\n...\n[CORPS]\nun paragraphe par ligne\n[POLITESSE]\n...`;
}
export function parseImproved(text: string): Partial<Record<string, string>> | null {
  const m = text.replace(/\*/g, "").match(/\[APPEL\]([\s\S]*?)\[CORPS\]([\s\S]*?)\[POLITESSE\]([\s\S]*)/);
  if (!m) return null;
  const [salut, corps, politesse] = [m[1]!, m[2]!, m[3]!].map(x => x.trim());
  return salut && corps && politesse ? { salut, corps, politesse } : null;
}
