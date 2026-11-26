// One completed version is free in all formats; another enrichment needs a paid plan.
import type { CvData } from "./cv-templates";
export const CV_FREE_KEY = "bersa-cv-free-owner";

export function cvExportIdentity(data: CvData): string {
  const content = JSON.stringify([
    data.firstName, data.lastName, data.title, data.summary,
    data.phone, data.email, data.address, data.experiences,
    data.education, data.skills, data.languages, data.languageItems, data.sections
  ]);
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) {
    hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
  }
  return `cv-v2-${(hash >>> 0).toString(16)}`;
}

export function cvSaveAllowed(freeOwner: string | null, cvId: string, hasPaidPlan: boolean): boolean {
  if (hasPaidPlan) return true;
  return !freeOwner || freeOwner === cvId;
}
