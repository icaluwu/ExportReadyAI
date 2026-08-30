# Deployment Guide — ExportReady AI

Arsitektur hosting **Vercel-only** (PRD §11, prinsip P5). GitLab adalah mirror + CI gate; deployment dan CI produksi dikunci ke GitHub `main`.

| Environment | Platform | URL |
|-------------|----------|-----|
| Local | `npm run dev` | `http://localhost:3000` |
| Preview (`dev` + PR) | Vercel | `https://<project>-git-<branch>-misifits.vercel.app` |
| Production (`main`) | Vercel | `https://exportready.web.id` |

---

## 1. Branch & deployment

Strategi branch mengikuti PRD §12.1:

- `main` = **Production** → Vercel Production Deployment → `exportready.web.id`
- `dev` = **Development / integrasi** → Vercel Preview Deployment otomatis
- Rilis = PR `dev` → `main` (bukan push langsung ke `main`)

```
feat/x ──┐
fix/y   ──┼──► dev ──(PR rilis)──► main ──► exportready.web.id
chore/z ──┘       │
                  └─ Preview URL
```

## 2. Environment variables

Salin [`.env.example`](../.env.example) ke `.env.local` untuk pengembangan lokal.

| Variable | Wajib | Scope | Catatan |
|----------|-------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | selalu | publik | Project `vpkfogomhadefnyhrcgv` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | selalu | publik | — |
| `SUPABASE_SERVICE_ROLE_KEY` | production | **server only** | Jangan diprefiks `NEXT_PUBLIC_` |
| `GEMINI_API_KEY` | selalu | server only | `/api/analyze`, `/api/chat`, `/api/hs-code` |
| `MIDTRANS_SERVER_KEY` | production | server only | Signature sha512 webhook |
| `MIDTRANS_CLIENT_KEY` | production | server only | Harus identik dengan versi publik |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | production | publik | Snap.js |
| `MIDTRANS_IS_PRODUCTION` | production | server only | `true` saat live |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | production | publik | Sinkron dengan var server |
| `NEXT_PUBLIC_SITE_URL` | selalu | publik | `https://exportready.web.id` di production |
| `REQUIRE_PRODUCTION_PAYMENTS` | opsional | server only | Validasi ketat di preview |

Build menjalankan `scripts/validate-env.mjs` dan **gagal** jika var Supabase hilang. Jangan set `SKIP_ENV_VALIDATION` di Vercel (khusus CI).

### Scoping di Vercel (PRD §12.3)

- *Semua* var milik production → Production + Preview.
- `SUPABASE_SERVICE_ROLE_KEY` → Production + Preview (tidak untuk development lokal).
- Midtrans **production keys** → Production **hanya**. Preview memakai **sandbox keys**.
- `NEXT_PUBLIC_SITE_URL` → Production `https://exportready.web.id`; Preview memakai URL preview otomatis.

## 3. Men-deploy

1. Project Vercel sudah terhubung ke repo GitHub `icaluwu/ExportReadyAI`.
2. **Production Branch = `main`**, `Install Command = npm ci`, `Node = 24`.
3. Set environment variables per §12.3 di Vercel (Settings → Environment Variables).
4. PR `dev` → `main`. Saat di-merge, Vercel me-deploy `main` ke production.
5. Set domain `exportready.web.id` sebagai production domain + redirect `www`.

## 4. Webhook Midtrans

Buka halaman Midtrans → Settings → Configuration → Payment Notification URL:

- **Sandbox** → preview stabil `dev` (mis. `https://dev.exportready.web.id/api/payment/notification`)
- **Production** → `https://exportready.web.id/api/payment/notification`

## 5. Status & verifikasi

- Health check: `GET /api/health` → `{ status: "ok" }`
- `GET /pricing` → `308` menuju `/harga`
- `GET /api/payment/notification` hanya menerima signature valid (pay-6)

## 6. Rollback

Vercel → Deployments → pilih deployment → ⋯ → Promote to Production / Rollback.