/**
 * Canonical site URL for auth redirects and server-side metadata.
 * Browser: prefers window.origin. Server: env, then Vercel, then fallback.
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

  return 'https://export-ready-ai.vercel.app'
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}
