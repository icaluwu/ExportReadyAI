export function getSiteUrl() {
  // Prefer explicit env for consistent redirects (Vercel preview/prod).
  // Fallback to window origin in the browser.
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://export-ready-ai.vercel.app'
}

