# Deployment Guide — ExportReady AI

Arsitektur hosting:

| Environment | Platform | URL pattern |
|-------------|----------|-------------|
| Local | `npm run dev` | `http://localhost:3000` |
| Prototype | Vercel | `export-ready-ai.vercel.app` (production) atau `export-ready-ai-git-<branch>-<team>.vercel.app` (branch) |
| Production | Google Cloud Run | `https://<service>-xxxxx-<region>.run.app` |

---

## 1. Environment variables

Copy [`.env.example`](../.env.example) to `.env.local` for local development.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Auth redirect base; auto from `VERCEL_URL` on Vercel when unset in browser |
| `GEMINI_API_KEY` | Yes for AI | Server-only; `/api/analyze` |

Build runs `scripts/validate-env.mjs` and **fails** if Supabase vars are missing. Override only for experiments:

```bash
SKIP_ENV_VALIDATION=true npx next build
```

---

## 2. Vercel (prototype)

### 2.1 Why the domain “changed”

Vercel assigns different URLs per deployment type:

- **Production**: `https://export-ready-ai.vercel.app`
- **Branch (e.g. main)**: `https://export-ready-ai-git-main-<team>.vercel.app`
- **PR preview**: `https://export-ready-ai-git-<branch>-<team>.vercel.app`

Opening a branch URL is expected — not a broken domain.

### 2.2 Fix “Failed to fetch” on login

Login calls Supabase from the browser. **“Failed to fetch”** almost always means env vars were missing at **build** time for that deployment.

1. Vercel → **export-ready-ai** → **Settings → Environment Variables**
2. Add (or verify) for **Production** and **Preview**:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (optional on preview — browser uses current origin; set if email redirects misbehave)
   - `GEMINI_API_KEY`

3. **Redeploy** (Deployments → … → Redeploy) so the build embeds `NEXT_PUBLIC_*` values.

4. DevTools → **Network**: failed login should hit `https://<project>.supabase.co`, not `undefined`.

5. **Supabase** → Authentication → URL configuration:
   - **Site URL**: production URL (Vercel prod or Cloud Run)
   - **Redirect URLs** (add each host you use):

     ```
     https://export-ready-ai.vercel.app/**
     https://export-ready-ai-git-main-misifits.vercel.app/**
     http://localhost:3000/**
     https://*.vercel.app/**
     ```

     Wildcard `*.vercel.app` simplifies preview branches.

### 2.3 Sync env locally

```bash
npx vercel link
npx vercel env pull .env.local
```

---

## 3. Google Cloud Run (production)

### 3.1 One-time GCP setup

```bash
chmod +x scripts/gcp-setup.sh
./scripts/gcp-setup.sh YOUR_GCP_PROJECT_ID
```

Creates Artifact Registry, enables APIs, grants Cloud Build deploy permissions, and documents `GEMINI_API_KEY` in Secret Manager.

Add the Gemini secret:

```bash
echo -n 'YOUR_GEMINI_KEY' | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### 3.2 First manual deploy

```bash
export PROJECT_ID=YOUR_GCP_PROJECT_ID
export REGION=asia-southeast2
export SERVICE=exportready-prod
export AR_REPO=exportready

# Build & push (set your real Supabase values)
gcloud builds submit --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE}:manual" \
  --project="$PROJECT_ID" \
  --substitutions=.

# Or local Docker:
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://YOUR.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  --build-arg NEXT_PUBLIC_SITE_URL="https://placeholder.run.app" \
  -t exportready:local .

docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your-key \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:8080 \
  exportready:local
```

Deploy to Cloud Run:

```bash
gcloud run deploy "$SERVICE" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE}:manual" \
  --region="$REGION" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --timeout=300 \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=...,NEXT_PUBLIC_SUPABASE_ANON_KEY=...,NEXT_PUBLIC_SITE_URL=https://YOUR-SERVICE-url.run.app" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

After the first deploy, copy the service URL, set `NEXT_PUBLIC_SITE_URL` to that URL, **rebuild and redeploy**, then add the URL to Supabase redirect URLs.

Health check: `GET /api/health` → `{ "ok": true, "supabase": true }`.

### 3.3 Cloud Build CI

[`cloudbuild.yaml`](../cloudbuild.yaml) builds the image and deploys Cloud Run.

Create a trigger (Console → Cloud Build → Triggers) on branch `main` with substitutions:

- `_NEXT_PUBLIC_SUPABASE_URL`
- `_NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `_NEXT_PUBLIC_SITE_URL` (Cloud Run production URL)

CLI example:

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co,_NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...,_NEXT_PUBLIC_SITE_URL=https://exportready-prod-xxxxx-as.a.run.app
```

### 3.4 Rollback

```bash
gcloud run revisions list --service=exportready-prod --region=asia-southeast2
gcloud run services update-traffic exportready-prod \
  --region=asia-southeast2 \
  --to-revisions=exportready-prod-00042-abc=100
```

### 3.5 Troubleshooting Cloud Run

| Symptom | Check |
|---------|--------|
| Login “Failed to fetch” | Env vars on service; rebuild image if `NEXT_PUBLIC_*` changed |
| 502 / container exit | Logs: `gcloud run services logs read exportready-prod --region=asia-southeast2` |
| AI assessment fails | `GEMINI_API_KEY` secret mounted; `gcloud secrets versions list GEMINI_API_KEY` |
| Auth redirect error | Supabase redirect URLs include exact Cloud Run URL + `/auth/callback` |

---

## 4. Checklist before go-live

- [ ] Vercel Preview + Production env vars set and redeployed
- [ ] Cloud Run `NEXT_PUBLIC_SITE_URL` matches live `*.run.app` URL
- [ ] Supabase redirect URLs include Vercel + Cloud Run + localhost
- [ ] `GEMINI_API_KEY` in Vercel and Secret Manager (Cloud Run)
- [ ] `/api/health` returns `ok: true` on production
- [ ] Test login, register, assessment, results on both hosts
