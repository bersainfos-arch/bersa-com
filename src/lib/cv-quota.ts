// One CV may be saved for free (any number of formats); a different CV needs an active paid plan.
export const CV_FREE_KEY = "bersa-cv-free-owner";

export function cvSaveAllowed(freeOwner: string | null, cvId: string, hasPaidPlan: boolean): boolean {
  if (hasPaidPlan) return true;
  return !freeOwner || freeOwner === cvId;
}
