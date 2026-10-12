export const INTRO_STEP_MS = 2000;

export function openingPhase(elapsedMs: number) {
  if (elapsedMs < INTRO_STEP_MS) return "slogan";
  if (elapsedMs < INTRO_STEP_MS * 2) return "signature";
  return "signup";
}