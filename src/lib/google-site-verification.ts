export function getGoogleSiteVerificationToken(): string | null {
  const rawToken = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
  if (!rawToken) return null

  const contentMatch = rawToken.match(/content=["']([^"']+)["']/i)
  return contentMatch?.[1]?.trim() || rawToken
}

export function hasGoogleSiteVerificationToken(): boolean {
  return Boolean(getGoogleSiteVerificationToken())
}
