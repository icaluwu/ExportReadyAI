# Vercel checklist — fix preview login

Use this after seeing **“Failed to fetch”** on `export-ready-ai-git-*-*.vercel.app`.

## Environment variables

Project: **export-ready-ai** → Settings → Environment Variables

| Name | Production | Preview | Development |
|------|:----------:|:-------:|:-----------:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ |
| `GEMINI_API_KEY` | ✓ | ✓ | optional |
| `NEXT_PUBLIC_SITE_URL` | `https://export-ready-ai.vercel.app` | optional* | `http://localhost:3000` |

\* Preview can omit `NEXT_PUBLIC_SITE_URL` — the app uses `window.location.origin` in the browser and `VERCEL_URL` on the server when unset.

## Redeploy

Env changes do not affect past builds. After saving variables:

**Deployments** → latest deployment → **⋯** → **Redeploy**.

## Supabase

Authentication → URL configuration:

- **Redirect URLs**: include `https://*.vercel.app/**` or each preview host explicitly.
- **Site URL**: `https://export-ready-ai.vercel.app` (or Cloud Run URL for production-only auth).

## Verify

1. Open preview URL → `/login`
2. DevTools → Network → login should POST to `https://<project>.supabase.co/auth/v1/token`
3. Wrong: requests to `undefined` or blocked — env missing at build time

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full documentation.
