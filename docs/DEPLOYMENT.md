# Deployment Guide — ExportReady AI

Production hosting uses Netlify with Supabase retained as the database and
authentication provider. Netlify deploy previews are used for pull requests.

| Environment | Platform | URL |
|-------------|----------|-----|
| Local | `npm run dev` | `http://localhost:3000` |
| Preview (`dev` + PR) | Netlify | Netlify deploy preview URL |
| Production (`main`) | Netlify | `https://exportready.web.id` |

## 1. Netlify configuration

The repository contains [`netlify.toml`](../netlify.toml), which configures:

- `npm run build` as the build command.
- Node.js 24.
- `@netlify/plugin-nextjs` for App Router, API routes, and server rendering.
- `.next` as the generated Next.js output.

Connect the repository to a Netlify site and set the production branch to
`main`. Do not use a static export: the application requires server routes,
Supabase service-role access, AI endpoints, and the Midtrans webhook.

## 2. Environment variables

Copy [`.env.example`](../.env.example) to `.env.local` for local development.
Configure the following in Netlify Site configuration → Environment variables.
Use the correct scopes for Production and Deploy Previews; never commit values
to the repository.

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | all | Existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all | Public Supabase browser key |
| `SUPABASE_SERVICE_ROLE_KEY` | production/preview | Server-only; never expose to browser |
| `AI_PROVIDER_API_KEY` or `GEMINI_API_KEY` | all | Server-only AI credential |
| `AI_PROVIDER_BASE_URL` | all | Optional provider base URL |
| `AI_MODEL` | all | Optional model override |
| `MIDTRANS_SERVER_KEY` | production | Server-only live payment key |
| `MIDTRANS_CLIENT_KEY` | production | Must match public client key |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | production | Snap.js client key |
| `MIDTRANS_IS_PRODUCTION` | production | `true` for live payments |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | production | Must also be `true` |
| `NEXT_PUBLIC_SITE_URL` | production | `https://exportready.web.id` |
| `REQUIRE_PRODUCTION_PAYMENTS` | preview | Set `true` only when preview has payment keys |

Netlify sets `NETLIFY_CONTEXT=production` for the production build. The build
validator uses this to enforce service-role and live Midtrans variables.

## 3. Domain and Supabase auth

1. Add `exportready.web.id` as the Netlify production custom domain.
2. Keep the existing DNS records pointed to Netlify as instructed by Netlify
   Domain management. Do not remove the Supabase project.
3. In Supabase Authentication → URL Configuration, set:
   - Site URL: `https://exportready.web.id`
   - Redirect URL: `https://exportready.web.id/**`
   - Local development: `http://localhost:3000/**`
4. Update the production Midtrans notification URL to:
   `https://exportready.web.id/api/payment/notification`.

## 4. Deploy and verify

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

After Netlify reports a successful deploy, verify:

- `https://exportready.web.id`
- `https://exportready.web.id/api/health`
- `/harga`
- `/pricing` redirect
- login and auth callback
- assessment and results
- Midtrans notification signature handling

Never set `SKIP_ENV_VALIDATION=true` on production. If a deploy fails, inspect
the Netlify deploy log; the validator reports missing variable names without
printing secret values.

## 5. Rollback

Use Netlify Deploys → select a known-good deploy → Publish deploy. Keep the
database migrations and application deployment rollback-compatible.

## 6. Wasmer

Wasmer remains an experimental static/edge path. It is not a valid production
target for this application because the app contains server routes, payment
webhooks, Supabase service-role operations, and AI endpoints.
