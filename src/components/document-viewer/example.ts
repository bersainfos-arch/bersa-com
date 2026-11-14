import type { DocumentBlock } from "./layout";

/** Explicit demonstration only; never inserted into an existing user document. */
export const exampleDocument: DocumentBlock[] = [
  { id: "introduction", type: "title", text: "0. INTRODUCTION GÉNÉRALE" },
  { id: "objectif", type: "paragraph", text: "La rédaction permet de donner une forme claire à ses idées. Un document bien construit relie une question précise, des arguments vérifiables et une conclusion cohérente. Avant de rédiger, il est utile de définir son objectif et de déterminer à qui le texte s’adresse." },
  { id: "objectif-note", type: "note", referenceId: "objectif", text: "Exemple de note : préciser ici la référence utilisée pour étayer un argument." },
  ...Array.from({ length: 14 }, (_, index): DocumentBlock => ({ id: `paragraphe-${index}`, type: "paragraph", text: "Chaque paragraphe développe une idée principale. La première phrase annonce cette idée ; les phrases suivantes l’expliquent, l’illustrent et la mettent en relation avec le sujet du document. Une transition permet ensuite de passer à l’argument suivant. La relecture porte à la fois sur la précision du vocabulaire, la cohérence de l’ensemble et la présentation des références. Il importe de conserver un raisonnement personnel et de distinguer les citations des observations de l’auteur." })),
  { id: "conclusion", type: "title", text: "1. CONCLUSION" },
  { id: "bilan", type: "paragraph", text: "La qualité d’un texte repose sur sa clarté et sur la solidité de ses arguments. Cette page sert uniquement d’exemple pour tester l’affichage, la pagination, la recherche et les gestes tactiles." },
];