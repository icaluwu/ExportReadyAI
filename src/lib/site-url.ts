/**
 * Canonical site URL for auth redirects and server-side metadata.
 * Browser: prefers window.origin. Server: env, then hosting preview URL, then fallback.
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) return stripTrailingSlash(envUrl)

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return getServerSiteUrl()
}

/** Use in Server Components, sitemap, robots, and layout metadata. */
export function getServerSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) return stripTrailingSlash(envUrl)

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, '')
    return `https://${stripTrailingSlash(host)}`
  }

  const netlifyUrl =
    process.env.DEPLOY_PRIME_URL?.trim() ||
    process.env.DEPLOY_URL?.trim()
  if (netlifyUrl) return stripTrailingSlash(netlifyUrl)

  return 'https://exportready.web.id'
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}
