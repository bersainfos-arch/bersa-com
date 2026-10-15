export interface DocTypeConfig {
  id: "article" | "memoire" | "these" | "ouvrage";
  label: "Article scientifique" | "Mémoire de fin d'études" | "Thèse de doctorat" | "Ouvrage / Livre";
  charsMin: number;
  charsMax: number;
  description: string;
}

export const DOC_TYPES: Record<string, DocTypeConfig> = {
  article: {
    id: "article",
    label: "Article scientifique",
    charsMin: 30000,
    charsMax: 50000,
    description: "Format publication universitaire (15 à 25 pages), IMRAD, appareil critique resserré.",
  },
  memoire: {
    id: "memoire",
    label: "Mémoire de fin d'études",
    charsMin: 70000,
    charsMax: 80000,
    description: "Mémoire universitaire (40 à 60 pages), structure Chapitres/Sections/§ équilibrée.",
  },
  these: {
    id: "these",
    label: "Thèse de doctorat",
    charsMin: 100000,
    charsMax: 300000,
    description: "Thèse doctorale complète (100 à 250 pages), profondeur théorique et méthodologique.",
  },
  ouvrage: {
    id: "ouvrage",
    label: "Ouvrage / Livre",
    charsMin: 200000,
    charsMax: 400000,
    description: "Manuel ou essai de recherche, découpage thématique en chapitres autonomes.",
  },
};

export interface ChapterProgress {
  chapterIndex: number;
  title: string;
  content: string;
  charCount: number;
  completed: boolean;
}

export interface LongDocState {
  docId: string;
  docType: "article" | "memoire" | "these" | "ouvrage";
  title: string;
  targetChars: number;
  plan: string;
  chapters: ChapterProgress[];
  currentChapterIndex: number;
  updatedAt: string;
}

// Sauvegarde locale dans le navigateur pour garantir la reprise après interruption
const STORAGE_KEY = "bersa-long-doc-draft";

export function saveLongDocDraft(state: LongDocState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore en cas de quota plein
  }
}

export function loadLongDocDraft(): LongDocState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LongDocState) : null;
  } catch {
    return null;
  }
}

export function clearLongDocDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Assemblage final des chapitres sans doublons
export function assembleDocument(state: LongDocState): string {
  const parts: string[] = [];
  if (state.title) parts.push(state.title.toUpperCase(), "\n");
  for (const ch of state.chapters) {
    if (ch.content.trim()) {
      parts.push(`\n\n${ch.title}\n\n${ch.content.trim()}`);
    }
  }
  return parts.join("").trim();
}
