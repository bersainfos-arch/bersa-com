import type { CvData } from "./cv-templates";

export const CV_STEP_COUNT = 9;
export function validStagePeriod(start: string, end: string): boolean {
  return /^\d{4}$/.test(start) && (/^\d{4}$/.test(end) ? Number(end) >= Number(start) : end === "En cours");
}
export function cvStepError(data: CvData, step: number): string {
  if (step === 2 && (!data.firstName.trim() || !data.lastName.trim())) return "Renseignez votre prénom et votre nom.";
  if (step === 3 && !data.phone.trim() && !data.email.trim()) return "Renseignez un téléphone ou une adresse e-mail.";
  if (step === 3 && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Vérifiez votre adresse e-mail.";
  if (step === 8 && data.sections?.some(section => section.title.toLowerCase() === "stages" && !validStagePeriod(section.start || "", section.end || ""))) return "Indiquez les années de début et de fin du stage dans le bon ordre.";
  return "";
}
export function canFinalizeCv(data: CvData, completedSteps: number): boolean {
  return completedSteps >= CV_STEP_COUNT && ![2, 3, 8].some(step => cvStepError(data, step));
}