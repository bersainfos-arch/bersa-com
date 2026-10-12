export function authIdentifier(value: string): { email: string } | { phone: string } | null {
  const text = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return { email: text };
  const phone = text.replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(phone) ? { phone } : null;
}