# Vercel checklist — deployment ExportReady AI

Project Vercel terhubung ke GitHub **`icaluwu/ExportReadyAI`**, Production Branch = `main`.

## Environment variables (PRD §12.3)

| Name | Production | Preview | Development |
|------|:----------:|:-------:|:-----------:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ | lokal saja |
| `GEMINI_API_KEY` | ✓ | ✓ | ✓ |
| Midtrans **production** keys | ✓ | – | – |
| Midtrans **sandbox** keys | – | ✓ | ✓ |
| `MIDTRANS_IS_PRODUCTION` | `true` | `false` | `false` |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `true` | `false` | `false` |
| `NEXT_PUBLIC_SITE_URL` | `https://exportready.web.id` | URL preview | `http://localhost:3000` |
| `SKIP_ENV_VALIDATION` | jangan diset | jangan diset | jangan diset |

## Redeploy

Env berubah tidak memengaruhi build lama. Setelah menyimpan variabel:

**Deployments** → deployment terbaru → **⋯** → **Redeploy**.

## Supabase

Authentication → URL configuration:

- **Site URL**: `https://exportready.web.id`
- **Redirect URLs**: tambahkan `https://exportready.web.id/**`, pola preview `https://*.vercel.app/**`, dan `http://localhost:3000/**`.

## Domain

- Pasang `exportready.web.id` sebagai production domain di Vercel.
- Tambahkan redirect `www.exportready.web.id` → `https://exportready.web.id`.
- Verifikasi DNS CNAME/A record sesuai instruksi Vercel.

## Verify

1. Buka `https://exportready.web.id/login`.
2. DevTools → Network → login harus POST ke `https://vpkfogomhadefnyhrcgv.supabase.co/auth/v1/token`.
3. Salah: request ke `undefined` atau terblokir → env hilang saat build.

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap.