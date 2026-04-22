export const ADMIN_EMAIL_WHITELIST: string[] = [
  // Wynne 测试后再加邮箱，先留空
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_WHITELIST.includes(email.toLowerCase());
}
