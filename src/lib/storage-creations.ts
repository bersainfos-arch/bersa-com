/**
 * BERSA - Centre Intelligent de Rédaction
 * Gestionnaire de stockage pour « Mes créations »
 * Conforme à la Partie VIII du prompt maître.
 */

export interface SavedCreation {
  id: string;
  title: string;
  category: string;
  templateId?: string;
  contentHtml?: string;
  visualData?: any;
  status: "draft" | "finished";
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  jurisdiction?: string;
  wordCount?: number;
}

const STORAGE_KEY = "bersa_user_creations_v1";

/**
 * Récupère toutes les créations de l'utilisateur
 */
export function getCreations(): SavedCreation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erreur lecture créations BERSA :", e);
    return [];
  }
}

/**
 * Enregistre ou met à jour une création
 */
export function saveCreation(creation: Omit<SavedCreation, "id" | "createdAt" | "updatedAt"> & { id?: string }): SavedCreation {
  const existing = getCreations();
  const now = new Date().toISOString();

  if (creation.id) {
    const index = existing.findIndex(c => c.id === creation.id);
    if (index >= 0) {
      const updated: SavedCreation = {
        ...existing[index],
        ...creation,
        id: creation.id,
        updatedAt: now,
      };
      existing[index] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return updated;
    }
  }

  const newCreation: SavedCreation = {
    ...creation,
    id: creation.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: now,
    updatedAt: now,
    status: creation.status || "draft",
    isFavorite: creation.isFavorite || false,
  };

  const updatedList = [newCreation, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  return newCreation;
}

/**
 * Supprime une création par son identifiant
 */
export function deleteCreation(id: string): void {
  const existing = getCreations();
  const filtered = existing.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Bascule le statut favori d'une création
 */
export function toggleFavoriteCreation(id: string): boolean {
  const existing = getCreations();
  const item = existing.find(c => c.id === id);
  if (!item) return false;
  item.isFavorite = !item.isFavorite;
  item.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return item.isFavorite;
}

