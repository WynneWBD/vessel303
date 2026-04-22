export const ADMIN_EMAIL_WHITELIST: string[] = [
  'wynnewbd@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_WHITELIST.includes(email.toLowerCase());
}
