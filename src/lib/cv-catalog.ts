import { CV_TEMPLATES } from "./cv-templates";

export const CV_SLIDE_INTERVAL = 5000;
export const HOME_CV_TEMPLATES = CV_TEMPLATES.filter(t => Boolean(t.defaultPhoto)).slice(0, 6);