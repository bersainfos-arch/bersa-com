export type CategoryKey =
  | "blanche"
  | "personnalises"
  | "cv"
  | "affiches"
  | "flyers"
  | "invitations"
  | "juridique"
  | "administratif"
  | "autres";

export type AcademicLevel =
  | "secondaire"
  | "graduat_licence"
  | "master"
  | "doctorat"
  | "professionnel"
  | "autre";

export type DocumentLength =
  | "court" // ~3 000 mots
  | "moyen" // ~7 000 mots
  | "long" // ~15 000 mots
  | "tres_long" // ~30 000 mots
  | "personnalise";

export type JurisdictionCode = "RDC" | "FR" | "BE" | "AUTRE";

export interface DocumentSection {
  id: string;
  title: string;
  required?: boolean;
}

export interface ModelItem {
  id: string;
  category: CategoryKey;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  badge?: string;
  colorScheme: string;
  isGraphic?: boolean;
  defaultFormat?: "A4" | "A5" | "carre" | "portrait" | "paysage";
  sections?: DocumentSection[];
  jurisdictionAware?: boolean;
}

export interface GenerationFormData {
  modelId: string;
  category: CategoryKey;
  title: string;
  subject: string;
  academicLevel?: AcademicLevel;
  language: string;
  length: DocumentLength;
  customPages?: number;
  instructions: string;
  attachments: { name: string; type: string; content: string }[];
  scope: "complet" | "sections";
  selectedSections: string[];
  jurisdiction?: JurisdictionCode;
}

export interface SavedCreation {
  id: string;
  modelId: string;
  category: CategoryKey;
  title: string;
  previewText: string;
  createdAt: string;
  updatedAt: string;
  status: "brouillon" | "termine";
  isFavorite?: boolean;
  htmlContent?: string;
  graphicData?: Record<string, unknown>;
}

