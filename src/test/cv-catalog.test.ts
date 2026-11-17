import { describe, expect, it } from 'vitest';
import { CV_TEMPLATES, TEMPLATE_NO_PHOTO, EMPTY_CV, renderCvHtml, formatCvPeriod } from '../lib/cv-templates';
import { HOME_CV_TEMPLATES, CV_SLIDE_INTERVAL } from '../lib/cv-catalog';

describe('CV catalog rules', () => {
  it('places the no-photo model seventh', () => expect(CV_TEMPLATES[6]?.id).toBe(TEMPLATE_NO_PHOTO.id));
  it('retains all 120 original models and their photos', () => {
    const originals = CV_TEMPLATES.filter(t => t.id !== TEMPLATE_NO_PHOTO.id);
    expect(originals).toHaveLength(120);
    expect(originals.every(t => t.defaultPhoto?.startsWith('/cv-photos/photo-'))).toBe(true);
  });
  it('only shows photo models at home', () => { expect(HOME_CV_TEMPLATES).toHaveLength(6); expect(HOME_CV_TEMPLATES.every(t => Boolean(t.defaultPhoto))).toBe(true); });
  it('changes slides every five seconds', () => expect(CV_SLIDE_INTERVAL).toBe(5000));
  it('opens with no default location', () => expect([EMPTY_CV.address, EMPTY_CV.city || '', EMPTY_CV.commune || '']).toEqual(['', '', '']));
  it('formats dates without splitting the period', () => expect(formatCvPeriod('Octobre 2021', 'Décembre 2022')).toBe('Octobre 2021 — Décembre 2022'));
  it('keeps generated user text escaped', () => expect(renderCvHtml(TEMPLATE_NO_PHOTO, { ...EMPTY_CV, firstName: '<script>alert(1)</script>' })).not.toContain('<script>'));
  it('keeps style customization isolated from catalog values', () => {
    const original = { ...TEMPLATE_NO_PHOTO };
    renderCvHtml(TEMPLATE_NO_PHOTO, { ...EMPTY_CV, customColor: '#123456', customFont: 'Georgia' });
    expect(TEMPLATE_NO_PHOTO).toEqual(original);
  });
});