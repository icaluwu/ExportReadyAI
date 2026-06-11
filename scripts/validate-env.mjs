/**
 * Fails the build early when required public env vars are missing.
 * Set SKIP_ENV_VALIDATION=true only for local experiments or partial builds.
 */

const skip = process.env.SKIP_ENV_VALIDATION === 'true'

if (skip) {
  console.warn('[validate-env] SKIP_ENV_VALIDATION=true — skipping checks')
  process.exit(0)
}

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const missing = required.filter((key) => !process.env[key]?.trim())

if (missing.length > 0) {
  console.error(
    '\n[validate-env] Missing required environment variables:\n' +
      missing.map((k) => `  - ${k}`).join('\n') +
      '\n\nCopy .env.example to .env.local or set them in Vercel / Cloud Run.\n' +
      'For Vercel: enable variables for Production AND Preview, then redeploy.\n',
  )
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!url.startsWith('https://') || !url.includes('supabase')) {
  console.warn(
    '[validate-env] NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase URL:',
    url,
  )
}

if (!process.env.GEMINI_API_KEY?.trim()) {
  console.warn(
    '[validate-env] GEMINI_API_KEY is not set — AI assessment (/api/analyze) will fail at runtime.',
  )
}

console.log('[validate-env] OK')
