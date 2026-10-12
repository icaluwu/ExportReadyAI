# PRD — ExportReady AI v2 (Rebuild)

**Versi:** 1.0
**Tanggal:** 30 Agustus 2026
**Pemilik Produk:** Owner ExportReady AI
**Status:** Siap dieksekusi
**Audiens dokumen:** AI/engineer yang akan mengimplementasikan. Dokumen ini bersifat **preskriptif** — jika ada pertanyaan desain yang tidak dijawab di sini, ikuti pola yang sudah ada di repo `main`.

**Daftar isi:** [0 Aturan Main](#0-konteks--aturan-main-dokumen-ini) · [1 Ringkasan](#1-ringkasan-produk) · [2 Persona](#2-persona--job-to-be-done) · [3 Scope](#3-ruang-lingkup) · [4 Desain & IA](#4-desain--information-architecture) · [5 Model Data](#5-model-data-supabase-project-vpkfogomhadefnyhrcgv) · [6 Alur Bisnis](#6-alur-logic-bisnis) · [7 Payment](#7-alur-payment-midtrans) · [8 Tiga Pilar Fitur](#8-spesifikasi-tiga-pilar-fitur) · [9 Kontrak API](#9-kontrak-api) · [10 Keamanan & Env](#10-keamanan-environment--konfigurasi) · [11 Refactor](#11-refactor--cleanup-target-g4--g5) · [12 Branch & Deployment](#12-strategi-branch-ci--deployment) · [13 Pengujian](#13-strategi-pengujian) · [14 Fase](#14-fase-implementasi) · [15 Kriteria Penerimaan](#15-kriteria-penerimaan) · [16 Risiko](#16-risiko--mitigasi) · [17 Cara Pakai](#17-cara-memakai-dokumen-ini-untuk-ai-pelaksana)

***

## 0. Konteks & Aturan Main Dokumen Ini

Repo sumber: `https://github.com/icaluwu/ExportReadyAI` (public), branch `main`, commit acuan `13b423ca66f44791aea3c39d2a2aa38741501dc8`.

Rebuild ini **bukan rewrite dari nol**. Kode di `main` sudah \~85% benar secara fungsional dan sangat kuat di sisi keamanan database (9 migration, RLS ketat, hardening SECURITY DEFINER). Yang bermasalah adalah:

1. **Kerapian arsitektur** — ada duplikasi logika, sisa artefak deployment GCP, dan satu file monolit 30 KB.
2. **Konsistensi produk** — copy "gratis" bertabrakan dengan paket berbayar; halaman pricing tidak punya route sendiri.
3. **Kesiapan produksi** — project Vercel sudah dihapus, domain berubah, admin email masih menunjuk domain mati.

Maka PRD ini disusun sebagai: **pertahankan fondasi database & keamanan → rapikan application layer → tuntaskan alur payment → deploy ulang dengan disiplin branching.**

**Prinsip yang wajib dipegang implementor:**

| #  | Prinsip                                          | Konsekuensi praktis                                                            |
| -- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| P1 | Database adalah sumber kebenaran, bukan aplikasi | Aktivasi langganan, rate limit, dan masking freemium diputuskan di Postgres    |
| P2 | Satu logika, satu tempat                         | Tidak boleh ada dua implementasi untuk hal yang sama                           |
| P3 | Server tidak pernah percaya klien                | Semua input lewat Zod; harga selalu dihitung ulang di server                   |
| P4 | Copy produk harus sinkron dengan sistem billing  | Tidak boleh ada klaim "gratis" tanpa kualifikasi di halaman yang menjual paket |
| P5 | Vercel-only                                      | Semua artefak Docker/Cloud Run dihapus                                         |

***

## 1. Ringkasan Produk

**ExportReady AI** adalah SaaS berbasis Google Gemini yang menilai kesiapan ekspor produk UMKM Indonesia, lalu menerjemahkan penilaian itu menjadi roadmap yang bisa dieksekusi.

**Value proposition:** UMKM mengisi profil produk sekali (5–10 menit), lalu menerima Export Readiness Score 0–100, rekomendasi negara tujuan, analisis gap, dan roadmap 4 fase dalam Bahasa Indonesia — tanpa perlu menyewa konsultan ekspor.

**Model bisnis:** Freemium. Assessment dasar + skor + sebagian hasil AI gratis (tanpa wajib akun). Detail lengkap (semua negara tujuan, roadmap fase 3–4, export PDF, AI chat tanpa batas) dikunci di paket Premium yang dibayar via Midtrans.

**Tiga pilar fitur yang wajib ada di v2 (sesuai permintaan Owner):**

1. **Pricing per-paket** — halaman harga dengan route sendiri, membaca paket langsung dari database, checkout Midtrans Snap.
2. **Blog** — sistem konten multi-penulis dengan alur draft → published, kategori, SEO metadata, dan role editor.
3. **AI Helper** — chat konsultan ekspor streaming yang sadar konteks hasil assessment pengguna, plus HS Code Finder.

### 1.1 Tujuan Rebuild (measurable)

| Tujuan                             | Kondisi sekarang (`main`)                             | Target v2                                                 |
| ---------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| G1 — Pricing punya alamat sendiri  | hanya anchor `/#pricing`, `/harga` dan `/pricing` 404 | route `/harga` berfungsi, `/pricing` redirect ke `/harga` |
| G2 — Satu jalur aktivasi langganan | 2 jalur (trigger DB + fungsi TS)                      | 1 jalur (trigger DB), fungsi TS jadi read-only            |
| G3 — Copy konsisten dengan billing | FAQ klaim "benar-benar gratis"                        | copy membedakan Gratis vs Premium secara eksplisit        |
| G4 — Zero artefak non-Vercel       | Dockerfile, cloudbuild.yaml, `output: standalone`     | hanya konfigurasi Vercel                                  |
| G5 — Tidak ada file > 500 baris    | `admin/dashboard/page.tsx` 30 KB                      | didekomposisi jadi komponen                               |
| G6 — Legitimasi publik             | email & admin di domain mati                          | domain, email, dan identitas legal aktif                  |
| G7 — CI hijau di dua branch        | CI hanya jalan di `main`                              | CI jalan di `main` + `dev` + semua PR                     |

***

## 2. Persona & Job-to-be-Done

| Persona                      | Deskripsi                                                               | Job-to-be-done                                                                  | Halaman utama                     |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------- |
| **Bu Sari — UMKM mikro**     | Produsen keripik, tim 3 orang, belum pernah ekspor, tidak paham HS Code | "Saya ingin tahu apakah produk saya layak ekspor dan apa langkah pertamanya"    | `/assessment`, `/results/[id]`    |
| **Pak Andi — UMKM menengah** | Sudah pernah ekspor sekali via trading house, ingin ekspor mandiri      | "Saya ingin tahu negara mana yang paling realistis dan dokumen apa yang kurang" | `/results/[id]`, AI Chat, Premium |
| **Dinas/Asosiasi (pembina)** | Petugas dinas perdagangan yang membina puluhan UMKM                     | "Saya ingin standarisasi screening awal agar tidak konsultasi manual satu-satu" | `/share/[token]`, laporan PDF     |
| **Editor konten**            | Penulis internal/kontributor                                            | "Saya ingin menerbitkan artikel edukasi ekspor"                                 | `/editor/*`                       |
| **Admin**                    | Owner produk                                                            | "Saya ingin memantau user, transaksi, dan aplikasi editor"                      | `/admin/dashboard`                |

**Implikasi desain:** Bu Sari adalah persona default. Setiap halaman harus bisa dipahami tanpa pengetahuan ekspor sebelumnya. Setiap istilah teknis (HS Code, Incoterms, COO/SKA, HACCP) wajib punya tooltip atau penjelasan satu baris.

***

## 3. Ruang Lingkup

### 3.1 In Scope (v2)

* Landing page + halaman pricing `/harga` sebagai route mandiri

* Alur assessment 4 langkah (guest & authenticated)

* Halaman hasil dengan skor, negara tujuan, gap, roadmap interaktif, export PDF

* Share hasil via token dengan masa berlaku

* AI Helper: chat streaming kontekstual + HS Code Finder

* Blog publik + panel editor + panel admin

* Auth: email/password, reset password, callback OAuth

* Payment: Midtrans Snap, webhook notification, halaman status, rekonsiliasi

* Freemium gating konsisten (server + database + UI)

* Deployment Vercel dengan dua environment (Production dari `main`, Preview dari `dev`)

### 3.2 Out of Scope (v2)

| Item                                                     | Alasan                                                                                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile API `/api/mobile/v1/*` + `openapi/mobile-v1.yaml` | Tidak ada aplikasi mobile yang mengonsumsi. **Keputusan: hapus** dari kode, simpan spesifikasinya di `docs/archive/` untuk referensi masa depan |
| Deployment Cloud Run / Docker                            | Owner memutuskan Vercel-only                                                                                                                    |
| Multi-bahasa (i18n)                                      | Target pasar Indonesia; tunda ke v3                                                                                                             |
| Integrasi UN Comtrade real-time                          | Belum ada kontrak API; data pasar tetap dari Gemini + RAG regulasi                                                                              |
| Recurring auto-billing Midtrans                          | v2 pakai one-time charge per periode; renewal manual                                                                                            |

***

## 4. Desain & Information Architecture

### 4.1 Design Token (pertahankan dari `main`, formalkan di `globals.css`)

Repo sudah memakai Tailwind v4 + shadcn/ui dengan tema berbasis CSS variable dan dukungan dark mode via `next-themes`. Formalkan token berikut dan **jangan gunakan warna hardcoded di luar daftar ini**:

| Token                     | Nilai terang                               | Nilai gelap | Pemakaian                    |
| ------------------------- | ------------------------------------------ | ----------- | ---------------------------- |
| `--primary`               | `#1B3A6B` (navy)                           | `#608CD6`   | CTA utama, skor, aksen brand |
| `--accent`                | `#F59E0B` (amber)                          | `#FBBF24`   | highlight sekunder, badge    |
| `--background` / `--card` | putih / `card/70`                          | slate gelap | permukaan                    |
| `--muted-foreground`      | slate 500                                  | slate 400   | teks pendukung               |
| Semantik skor             | `emerald` ≥ 70, `amber` 40–69, `rose` < 40 | idem        | ring skor, badge kesiapan    |

**Aturan tipografi:** `font-black` untuk heading, `font-bold` untuk sub-heading dan label, `font-medium` untuk body. Skala heading: `text-4xl md:text-6xl` (h1), `text-3xl md:text-5xl` (h2), `text-2xl` (h3).

**Aturan bentuk:** radius `rounded-2xl` untuk kontrol, `rounded-3xl` untuk kartu, `rounded-[2.5rem]` untuk panel CTA besar. Shadow selalu berupa "lifted shadow" bernuansa slate, bukan hitam pekat.

**Motion:** `framer-motion` hanya untuk entrance (`initial/whileInView`, delay bertingkat 0.05–0.1s) dan micro-interaction hover. Tidak ada animasi yang menunda pembacaan konten utama. Wajib hormati `prefers-reduced-motion`.

**Aksesibilitas (wajib, bukan opsional):**

* Kontras minimum WCAG AA 4.5:1 untuk semua teks

* Setiap input punya `<label>` terkait; error diumumkan via `aria-live`

* Focus ring terlihat pada semua elemen interaktif

* Ikon dekoratif diberi `aria-hidden`; ikon bermakna diberi `aria-label`

* Skor 0–100 tidak boleh dikomunikasikan hanya lewat warna — sertakan angka dan label teks

### 4.2 Peta Route Lengkap

| Route                                                        | Tipe            | Auth              | Perubahan dari `main`                                                          |
| ------------------------------------------------------------ | --------------- | ----------------- | ------------------------------------------------------------------------------ |
| `/`                                                          | Landing         | publik            | Hapus `PricingSection` inline; ganti jadi ringkasan 3 paket + link ke `/harga` |
| `/harga`                                                     | **BARU**        | publik            | Halaman pricing penuh: tabel perbandingan, FAQ billing, checkout               |
| `/pricing`                                                   | **BARU**        | publik            | `permanentRedirect('/harga')`                                                  |
| `/assessment`                                                | Form 4 langkah  | opsional          | Tambah disclaimer AI di langkah terakhir                                       |
| `/results/[id]`                                              | Hasil           | opsional          | Tambah disclaimer AI permanen di atas hasil                                    |
| `/share/[token]`                                             | Hasil publik    | publik            | Tampilkan masa berlaku token                                                   |
| `/dashboard`                                                 | Ringkasan user  | wajib             | Tambah kartu status langganan                                                  |
| `/profile`, `/profile/edit`                                  | Profil          | wajib             | —                                                                              |
| `/blog`, `/blog/[slug]`                                      | Blog publik     | publik            | Tambah paginasi + filter kategori                                              |
| `/editor/*`                                                  | Panel editor    | role editor/admin | —                                                                              |
| `/editor-onboarding`                                         | Aplikasi editor | wajib             | —                                                                              |
| `/admin/dashboard`                                           | Panel admin     | role admin        | **Dekomposisi wajib** (lihat §11)                                              |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth            | publik            | —                                                                              |
| `/payment/status`                                            | Status bayar    | wajib             | Tambah polling + tombol "cek ulang"                                            |
| `/materi-belajar`                                            | Edukasi         | publik            | **Ganti CTA** dari `icaluwu.space` ke `/harga`                                 |
| `/sertifikasi`                                               | Edukasi         | publik            | Tambah sitasi sumber resmi                                                     |
| `/syarat-ketentuan`, `/kebijakan-privasi`                    | Legal           | publik            | Sinkronkan dengan model freemium & entitas legal                               |
| `/hubungi-kami`                                              | **BARU**        | publik            | Form kontak + email aktif + identitas legal                                    |

### 4.3 Navigasi

**Navbar (desktop):** Logo · Fitur · Cara Kerja · Harga · Blog · Materi Belajar · \[Theme Toggle] · \[Masuk / UserMenu]

`Harga` harus menunjuk ke `/harga` (route, bukan anchor). Ini memperbaiki penyebab 404 yang teramati di situs live.

**Footer:** empat kolom — Produk (Assessment, Harga, Blog, Materi Belajar) · Perusahaan (Tentang, Hubungi Kami, Sertifikasi) · Legal (Syarat & Ketentuan, Kebijakan Privasi, Disclaimer AI) · Identitas (nama badan usaha, alamat, email aktif, NIB jika sudah ada).

***

## 5. Model Data (Supabase project `vpkfogomhadefnyhrcgv`)

Skema di `main` sudah matang. **Jangan buat ulang dari nol** — jalankan 9 migration yang ada secara berurutan, lalu tambahkan migration baru untuk perbaikan v2.

### 5.1 Tabel

| Tabel                  | Kolom kunci                                                                                                                                                                                         | Catatan                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `subscription_plans`   | `id`, `name` (unique), `price_idr`, `features` jsonb, `is_active`                                                                                                                                   | Seed: `free` 0, `premium_monthly` 40000, `premium_yearly` 399000. Dibaca publik (anon) hanya jika `is_active` |
| `user_subscriptions`   | `user_id`, `plan_id`, `status` (`active`/`expired`/`cancelled`), `started_at`, `expires_at`, `midtrans_order_id` **UNIQUE**                                                                         | UNIQUE pada `midtrans_order_id` adalah kunci idempotensi webhook                                              |
| `payment_transactions` | `user_id`, `plan_id`, `order_id` **UNIQUE**, `gross_amount`, `status` (`pending`/`settlement`/`expire`/`cancel`/`deny`), `midtrans_transaction_id`, `payment_type`, `raw_notification` jsonb        | Audit trail penuh; `raw_notification` menyimpan payload asli Midtrans                                         |
| `assessments`          | seluruh field kuesioner, `readiness_score`, `score_breakdown` jsonb, `ai_result` jsonb, `status`, `user_id` **nullable**, `share_token` uuid unique, `share_token_expires_at`                       | `user_id` nullable untuk guest. `anon` **tidak** punya grant apa pun — guest wajib lewat server route         |
| `roadmap_progress`     | `assessment_id`, `user_id`, `phase`, `item_index`, `done`, UNIQUE(`assessment_id`,`phase`,`item_index`)                                                                                             | Backing untuk roadmap interaktif                                                                              |
| `profiles`             | `id`→`auth.users`, `username` unique, `full_name`, `bio`, `avatar_url`, `phone_number`, `phone_verified`, `account_type` (`user`/`editor`/`admin`), 5 field sosial                                  | RLS: baca hanya milik sendiri atau admin                                                                      |
| `public_profiles`      | proyeksi tabel (bukan view) berisi `id`, `username`, `full_name`, `bio`, `avatar_url`                                                                                                               | Disinkronkan trigger `sync_public_profile`; inilah yang dibaca publik untuk byline blog                       |
| `editor_applications`  | `status`, `disclaimer_accepted(_at)`, `phone_number`, `rejection_reason`, `reviewed_by`, `reviewed_at`                                                                                              | Insert wajib berstatus `pending` dan belum direview                                                           |
| `blog_categories`      | seed 5: Regulasi Ekspor, Tips & Strategi, Pasar Global, Sertifikasi, Kisah Sukses                                                                                                                   | Punya warna untuk badge                                                                                       |
| `blog_posts`           | `author_id`, `category_id`, `title`, `slug` unique, `excerpt`, `content`, `meta_title`, `meta_description`, `og_image_url`, `status` (`draft`/`published`/`archived`), `published_at`, `view_count` | Trigger `handle_blog_post_publish` mengisi `published_at` otomatis                                            |
| `regulation_chunks`    | `source_title`, `source_url`, `chunk_text`, `embedding vector(768)`                                                                                                                                 | HNSW cosine index. `REVOKE ALL FROM anon, authenticated` — hanya service\_role                                |
| `rate_limits`          | key ter-hash, endpoint, window                                                                                                                                                                      | `check_rate_limit` hanya bisa dieksekusi `service_role`                                                       |
| `admin_emails`         | daftar email admin                                                                                                                                                                                  | **Wajib di-reseed di v2** (lihat §5.4)                                                                        |

### 5.2 Fungsi Database yang Wajib Dipertahankan

| Fungsi                                          | Peran                                                                                                 | Catatan implementasi                                                                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activate_subscription_on_settlement()`         | **Satu-satunya jalur aktivasi langganan.** Trigger AFTER INSERT OR UPDATE pada `payment_transactions` | Sudah memakai `pg_advisory_xact_lock`, guard idempotensi pada `midtrans_order_id`, validasi plan, dan perpanjangan `GREATEST(expiry, now()) + interval` |
| `check_rate_limit(...)`                         | Rate limiting atomik                                                                                  | `pg_advisory_xact_lock` + assertion kunci 64 karakter; EXECUTE hanya `service_role`                                                                     |
| `mask_free_ai_result(jsonb)`                    | Masking freemium di level DB                                                                          | Mirror dari versi TS; dipakai `get_shared_assessment`                                                                                                   |
| `get_shared_assessment(token)`                  | Baca hasil via share token                                                                            | Syarat: status `completed`, token belum kedaluwarsa, hasil di-mask                                                                                      |
| `user_has_role(uuid, text[])`, `is_admin(uuid)` | Otorisasi role                                                                                        | STABLE, SECURITY DEFINER, `search_path = ''`, EXECUTE hanya `authenticated`                                                                             |
| `handle_new_user()`                             | Buat profil saat signup                                                                               | Role **hanya** dari tabel `admin_emails`. Jangan pernah baca `raw_user_meta_data->>'account_type'` — itu lubang privilege escalation yang sudah ditutup |
| `match_regulation_chunks(embedding, count)`     | Pencarian RAG                                                                                         | Cosine similarity via HNSW                                                                                                                              |
| `sync_public_profile()`                         | Menjaga proyeksi `public_profiles`                                                                    | Trigger pada INSERT/UPDATE kolom publik/DELETE                                                                                                          |
| `admin_update_user_role(uuid, text)`            | Ubah role user                                                                                        | Satu-satunya cara sah mengubah `account_type`                                                                                                           |
| `is_subscription_active(uuid)`                  | Cek langganan di level SQL                                                                            | Untuk dipakai di policy                                                                                                                                 |

### 5.3 Aturan RLS (target state)

* RLS **enabled** di semua tabel `public`.

* `anon` hanya boleh: SELECT `subscription_plans` (aktif), SELECT `blog_posts` (published), SELECT `blog_categories`, SELECT `public_profiles`, EXECUTE `get_shared_assessment`.

* `anon` **tidak punya grant** pada `assessments`, `editor_applications`, `payment_transactions`, `regulation_chunks`, `roadmap_progress`, `user_subscriptions`.

* `authenticated` hanya melihat baris miliknya sendiri, kecuali admin.

* `profiles`: UPDATE **column-scoped** — hanya `username`, `full_name`, `bio`, `avatar_url`, `phone_number`, dan field sosial. `account_type` tidak bisa diubah user.

* Semua fungsi SECURITY DEFINER: `REVOKE ALL FROM PUBLIC, anon` + `SET search_path = ''`.

### 5.4 Migration Baru untuk v2

Buat satu migration baru, `supabase/migrations/20260901000000_v2_rebuild_alignment.sql`, dibungkus `BEGIN; … COMMIT;` yang melakukan:

1. **Reseed** **`admin_emails`** — hapus `teukuvaickal@export-ready-ai.vercel.app` (domain Vercel sudah dihapus, email itu tidak pernah bisa diterima), ganti dengan email admin di domain baru yang benar-benar aktif. Setelah itu jalankan `admin_update_user_role` untuk akun admin yang sudah ada.
2. **Standarkan masa berlaku share token** — pilih **7 hari** sebagai satu-satunya konvensi (`main` punya dua: 24 jam di route analyze, 30 hari di backfill migration). Tambahkan `DEFAULT now() + interval '7 days'` pada `share_token_expires_at` dan sesuaikan route agar tidak menghitung sendiri.
3. **Tegaskan grant** **`check_rate_limit`** — `REVOKE` dari `anon`/`authenticated`, `GRANT EXECUTE` hanya ke `service_role`. Migration 6 pernah memberi grant ke anon; migration 7 sudah mencabutnya, tapi pernyataan ulang ini membuat state akhir eksplisit dan tidak bergantung pada urutan.
4. **Tambah kolom** **`subscription_plans.description`** **dan** **`subscription_plans.sort_order`** — supaya halaman `/harga` bisa menampilkan deskripsi dan urutan paket dari database, bukan dari konstanta di kode.
5. **Isi** **`features`** **jsonb dengan label lengkap** — agar UI merender `plan.features` alih-alih daftar hardcoded.
6. **Tambah index** `payment_transactions(user_id, created_at DESC)` dan `assessments(user_id, created_at DESC)` untuk query dashboard.

***

## 6. Alur Logic Bisnis

### 6.1 Alur Inti: Assessment → Hasil

```
[Pengunjung] → /assessment (form 4 langkah)
   Langkah 1: Produk (nama, kategori, deskripsi, HS Code opsional)
              └─ tombol "Bantu cari HS Code" → POST /api/hs-code (Gemini)
   Langkah 2: Kapasitas & Harga (kapasitas + unit, harga satuan)
   Langkah 3: Kesiapan (sertifikasi[], standar internasional, merek/HKI,
              pengalaman ekspor, kehadiran online)
   Langkah 4: Target & Konsen (negara target[], motivasi, email,
              checkbox privasi WAJIB true)
        ↓
POST /api/analyze
   ├─ 1. checkBotId()                        → 403 jika bot
   ├─ 2. checkRateLimit(ip, 'analyze', 5/60s) → 429 jika lewat batas
   ├─ 3. Zod parse (privacyAccepted: literal(true)) → 400
   ├─ 4. calculateReadinessScore(input)      ← DETERMINISTIK, bukan AI
   ├─ 5. searchRegulations(query, 5)         ← RAG pgvector
   ├─ 6. Gemini generate → JSON ketat        → 502 jika gagal parse
   ├─ 7. Tentukan isPremium via getUserSubscriptionStatus
   ├─ 8. Insert assessments (admin client)
   │      └─ guest: share_token = randomUUID(), expires = +7 hari
   └─ 9. Return { score, breakdown, aiResult: isPremium ? full : masked,
                  assessmentId, accessToken }
        ↓
[Redirect] → /results/[id]
```

**Aturan penting yang tidak boleh dilanggar:**

| Aturan                                                                                                                      | Alasan                                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Skor dihitung deterministik di `src/lib/scoring.ts`, **bukan oleh AI**                                                      | Skor harus reproducible dan bisa dipertanggungjawabkan ke pengguna |
| AI hanya menghasilkan narasi: `summary`, `topCountries`, `gaps`, `roadmap`, `motivationalNote`                              | Memisahkan fakta dari interpretasi                                 |
| Response AI di-parse dengan regex `\{[\s\S]*\}` lalu `JSON.parse`; kalau gagal → 502, **jangan** simpan hasil setengah jadi | Mencegah data korup                                                |
| `privacyAccepted` harus `z.literal(true)`                                                                                   | Kepatuhan persetujuan data                                         |
| Guest tetap dapat hasil, tapi lewat `share_token`, bukan akses tabel langsung                                               | `anon` tidak punya grant pada `assessments`                        |

**Formula skor (pertahankan apa adanya):**

| Komponen           | Aturan                                                          | Maks    |
| ------------------ | --------------------------------------------------------------- | ------- |
| Sertifikasi        | `min(jumlah/3 × 30, 30)`                                        | 30      |
| Kapasitas produksi | > 1000 → 25 · ≥ 500 → 18 · ≥ 100 → 12 · lainnya → 5             | 25      |
| Harga satuan       | > 100.000 → 25 · ≥ 50.000 → 18 · lainnya → 12                   | 25      |
| Pengalaman ekspor  | "Sudah rutin ekspor" → 20 · "Pernah mencoba" → 12 · lainnya → 5 | 20      |
| **Total**          | dibatasi 100                                                    | **100** |

### 6.2 Alur Freemium Gating

Gating terjadi di **tiga lapis**, dan ketiganya harus konsisten:

```
Lapis 1 — SERVER (otoritatif)
  src/lib/ai-result.ts → maskFreeAiResult(aiResult)
  Menyimpan topCountries[0], sisanya diganti placeholder terkunci
  roadmap.fase3 & fase4 → ['Langkah premium dikunci.']
  → Data premium NEVER meninggalkan server untuk user gratis

Lapis 2 — DATABASE (untuk jalur share token)
  mask_free_ai_result(jsonb) dipanggil di get_shared_assessment()

Lapis 3 — UI (kosmetik saja)
  PremiumGate.tsx membungkus konten dengan blur + CTA
```

**Perbaikan wajib di v2:** Lapis 3 saat ini hanya "blur" — kalau data premium sampai terkirim ke klien, blur bisa dilewati dengan devtools. Tetapkan aturan: **UI gating tidak boleh menjadi satu-satunya penghalang.** Setiap `PremiumGate` yang membungkus data sensitif harus dipasangkan dengan data yang memang sudah di-mask dari server. `PremiumGate` hanya sah dipakai untuk fitur yang aksinya di server (tombol export PDF, tombol chat).

Selain itu, ubah `PremiumGate` dan `PremiumCTA` agar menunjuk `/harga` (bukan `/#pricing`).

**Matriks entitlement:**

| Fitur                          | Gratis             | Premium                           |
| ------------------------------ | ------------------ | --------------------------------- |
| Assessment + skor 0–100        | ✅ tanpa batas      | ✅                                 |
| Analisis gap                   | ✅                  | ✅                                 |
| Negara tujuan                  | 1 dari 3           | ✅ semua                           |
| Roadmap                        | Fase 1–2           | ✅ Fase 1–4                        |
| Roadmap interaktif (checklist) | ❌                  | ✅                                 |
| Export PDF                     | ❌                  | ✅                                 |
| Share link                     | ✅ (hasil ter-mask) | ✅ (hasil penuh)                   |
| AI Chat                        | 5 pesan/hari       | tanpa batas (rate limit 10/menit) |
| HS Code Finder                 | ✅                  | ✅                                 |
| Riwayat assessment             | ✅ (butuh akun)     | ✅                                 |

Feature flag di `subscription_plans.features`: `assessment_basic`, `roadmap_full`, `export_pdf`, `market_recommendations`, `chat_unlimited`, `roadmap_interactive`.

### 6.3 Alur Auth & Role

```
Register → Supabase Auth signUp
   └─ trigger handle_new_user()
        ├─ INSERT profiles
        └─ account_type = 'admin' JIKA email ∈ admin_emails, else 'user'

Naik jadi editor:
  /editor-onboarding → INSERT editor_applications (status WAJIB 'pending')
     └─ Admin review di /admin/dashboard
          └─ approve → admin_update_user_role(user_id, 'editor')
```

**Larangan keras:** role tidak boleh pernah berasal dari input klien (metadata signup, form, header). Hanya `admin_emails` dan `admin_update_user_role` yang boleh menentukan role.

***

## 7. Alur Payment (Midtrans)

### 7.1 Rantai End-to-End

```
[User login] → /harga → klik "Pilih Paket"
        ↓
POST /api/payment/create-transaction   { plan_id: uuid }
   ├─ 1. checkBotId()                              → 403
   ├─ 2. auth.getUser()                            → 401 jika belum login
   ├─ 3. Zod parse { plan_id: z.string().uuid() }   → 400
   ├─ 4. Cek MIDTRANS_SERVER_KEY & CLIENT_KEY ada   → 503 jika kosong
   ├─ 5. SELECT subscription_plans WHERE id = plan_id AND is_active
   │        └─ tolak plan 'free'                    → 400
   ├─ 6. calculatePaymentTotal(plan.price)
   │        subtotal = plan.price
   │        tax      = round(subtotal × 0.11)       ← PPN 11%
   │        total    = subtotal + tax
   ├─ 7. orderId = 'EXPRDY-' + user.id.slice(0,8) + '-' + Date.now()
   ├─ 8. snap.createTransaction({
   │        transaction_details: { order_id, gross_amount: total },
   │        item_details: [ {paket, price: subtotal, qty 1},
   │                        {id 'TAX', name 'Pajak (PPN 11%)', price: tax} ],
   │        customer_details: { email, first_name },
   │        callbacks: { finish: `${SITE_URL}/payment/status?order_id=…` } })
   ├─ 9. INSERT payment_transactions (status 'pending', gross_amount = total,
   │        user_id, plan_id, order_id, snap_token)   ← admin client
   └─ 10. Return { token, redirect_url, order_id, amount }
        ↓
[Browser] Snap.js (getSnapScriptUrl(), data-client-key)
          window.snap.pay(token, { onSuccess, onPending, onError, onClose })
        ↓
Dua jalur PARALEL — jangan saling menggantikan:

  A. Jalur UI (tidak otoritatif)
     onSuccess → redirect /payment/status?order_id=…
        └─ polling GET /api/payment/status/[orderId] tiap 3 detik, maks 10×
             └─ baca payment_transactions.status (RLS: milik sendiri)

  B. Jalur Webhook (OTORITATIF)
     Midtrans → POST /api/payment/notification
        ├─ body > 64 KB                              → 413
        ├─ Zod: order_id, status_code /^\d{3}$/,
        │        gross_amount, signature_key len 128,
        │        transaction_status, fraud_status? (.passthrough())
        ├─ verifySignature(sha512(order_id + status_code
        │        + gross_amount + MIDTRANS_SERVER_KEY))
        │        dibanding timingSafeEqual             → 403 jika beda
        ├─ mapTransactionStatus():
        │     settlement                      → 'settlement'
        │     capture + fraud_status 'accept'  → 'settlement'
        │     capture + fraud_status lain      → 'challenge'
        │     pending                          → 'pending'
        │     deny/cancel/expire/failure       → status apa adanya
        └─ UPDATE payment_transactions
              WHERE order_id = ? AND gross_amount = ?   ← DUA kondisi
                 └─ TRIGGER activate_subscription_on_settlement
                      ├─ pg_advisory_xact_lock(hashtext(order_id))
                      ├─ guard idempoten: skip jika sudah pernah aktif
                      └─ UPSERT user_subscriptions
                            status 'active',
                            expires_at = now() + 30d (monthly) / 365d (yearly)
        ↓
getUserSubscriptionStatus(user_id) → isPremiumUser() → gating terbuka
```

### 7.2 Aturan Payment yang Tidak Boleh Dilanggar

| #     | Aturan                                                                                                                                                                                                                               | Alasan                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| PAY-1 | Harga **selalu** dibaca dari `subscription_plans` di server. Klien tidak pernah mengirim harga.                                                                                                                                      | Mencegah manipulasi harga                                   |
| PAY-2 | `gross_amount` yang dikirim ke Midtrans = `calculatePaymentTotal(price).total`. Fungsi ini dipakai bersama oleh UI dan server sehingga angka di layar = angka yang ditagih.                                                          | Selisih 1 rupiah membuat signature/verifikasi gagal         |
| PAY-3 | UPDATE webhook harus mencocokkan `order_id` **dan** `gross_amount`.                                                                                                                                                                  | Mencegah replay dengan amount berbeda                       |
| PAY-4 | Aktivasi langganan **hanya** lewat trigger `activate_subscription_on_settlement`. Fungsi TS `activateSubscription()` di `src/lib/subscription.ts` **dihapus**.                                                                       | Dua jalur aktivasi = risiko double-grant dan state divergen |
| PAY-5 | Halaman `/payment/status` tidak boleh mengaktifkan langganan, hanya membaca status.                                                                                                                                                  | Klien tidak boleh jadi sumber kebenaran pembayaran          |
| PAY-6 | Webhook selalu balas `200` untuk notifikasi yang valid tapi tidak dikenal (order tidak ditemukan), dan `403` hanya untuk signature salah.                                                                                            | Midtrans akan retry terus kalau dapat 5xx                   |
| PAY-7 | Di production, `validate-env.mjs` mewajibkan `MIDTRANS_IS_PRODUCTION === 'true'` **dan** `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'` **dan** `MIDTRANS_CLIENT_KEY === NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`. Jangan lemahkan cek ini. | Mencegah sandbox key bocor ke production                    |
| PAY-8 | Tidak ada auto-renewal. Langganan berakhir sendiri di `expires_at`; user membeli lagi secara manual.                                                                                                                                 | Recurring Midtrans di luar scope v2 (§3)                    |

### 7.3 Status Transaksi & Yang Dilihat User

| `payment_transactions.status` | Yang dilihat user di `/payment/status`                 | Langganan   |
| ----------------------------- | ------------------------------------------------------ | ----------- |
| `pending`                     | "Menunggu pembayaran" + instruksi + tombol cek ulang   | tidak aktif |
| `settlement`                  | "Pembayaran berhasil" + tombol ke `/dashboard`         | **aktif**   |
| `challenge`                   | "Pembayaran sedang diverifikasi" + info 1×24 jam       | tidak aktif |
| `deny` / `cancel`             | "Pembayaran dibatalkan" + tombol coba lagi ke `/harga` | tidak aktif |
| `expire`                      | "Sesi pembayaran kedaluwarsa" + tombol ke `/harga`     | tidak aktif |
| `failure`                     | "Terjadi kesalahan" + link `/hubungi-kami`             | tidak aktif |

### 7.4 Yang Wajib Ditambahkan di v2

1. **Halaman** **`/harga`** **sebagai route nyata** — bukan lagi hanya anchor `#pricing` di landing page. `PricingSection` dipakai ulang di dua tempat (landing dan `/harga`).
2. **Transparansi PPN** — tampilkan rincian `Harga paket + PPN 11% = Total` di kartu paket **sebelum** user menekan tombol bayar, bukan hanya di layar Snap.
3. **Riwayat transaksi di** **`/dashboard`** — daftar `payment_transactions` milik user (order id, tanggal, paket, total, status). Tabel dan index-nya sudah ada; hanya UI yang belum.
4. **Banner mode sandbox** — tampilkan peringatan jelas kalau `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION !== 'true'` agar tester tidak bingung.
5. **Idempoten di sisi order** — kalau user punya transaksi `pending` untuk plan yang sama dalam < 15 menit, kembalikan `snap_token` lama alih-alih membuat order baru.
6. **Halaman** **`/hubungi-kami`** dengan email yang benar-benar aktif, dirujuk dari semua status gagal.

***

## 8. Spesifikasi Tiga Pilar Fitur

### 8.1 Pilar 1 — Pricing per Paket (`/harga`)

**Kondisi sekarang:** `PricingSection` hanya hidup sebagai `<section id="pricing">` di dalam `src/app/page.tsx`. Route `/harga` dan `/pricing` tidak ada, sehingga semua tautan eksternal ke harga menghasilkan 404. Daftar fitur premium di-hardcode di komponen, tidak dibaca dari `subscription_plans.features`.

**Target v2:**

| Aspek             | Spesifikasi                                                                                                                                                        | <br />                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------ |
| Route             | `src/app/harga/page.tsx` — Server Component, `revalidate = 300`                                                                                                    | <br />                                            |
| Redirect          | `src/app/pricing/page.tsx` → `permanentRedirect('/harga')`                                                                                                         | <br />                                            |
| Sumber data       | `SELECT id, name, slug, price, billing_period, description, features, sort_order FROM subscription_plans WHERE is_active ORDER BY sort_order`                      | <br />                                            |
| Rendering fitur   | Iterasi `plan.features` dari database. **Tidak ada daftar fitur hardcoded di komponen.**                                                                           | <br />                                            |
| Komponen bayar    | `<PlanCheckoutButton planId>` — client component tipis, satu-satunya yang memuat Snap.js                                                                           | <br />                                            |
| Belum login       | Tombol → `/login?next=/harga`                                                                                                                                      | <br />                                            |
| Sudah premium     | Tombol jadi disabled + label "Paket aktif sampai {tanggal}"                                                                                                        | <br />                                            |
| Rincian harga     | Tampilkan `Rp {price}` + baris kecil `+ PPN 11% → total Rp {total}`                                                                                                | <br />                                            |
| Metadata          | \`title: 'Harga & Paket                                                                                                                                            | ExportReady AI'`, canonical `  /harga\`, OG image |
| Struktur halaman  | Hero singkat → grid paket → tabel perbandingan fitur → FAQ billing (5 pertanyaan) → CTA                                                                            | <br />                                            |
| FAQ billing wajib | (1) apa yang gratis dan apa yang tidak, (2) metode pembayaran Midtrans, (3) apakah otomatis diperpanjang → **tidak**, (4) kebijakan refund, (5) faktur/bukti bayar | <br />                                            |

**Copy yang wajib dikoreksi** (mengacu prinsip P4): kalimat FAQ di landing page `"Ya. Assessment kesiapan ekspor, skor 0-100, rekomendasi negara tujuan, dan roadmap 4 fase semuanya gratis."` adalah **klaim tidak benar** — `maskFreeAiResult` hanya memberi 1 dari 3 negara dan fase 1–2. Ganti dengan versi yang jujur, misalnya:

> "Assessment dan skor 0–100 gratis tanpa batas, termasuk analisis gap, satu rekomendasi negara tujuan, dan roadmap fase 1–2. Dua rekomendasi negara lainnya, roadmap fase 3–4, export PDF, dan chat tanpa batas tersedia di paket Premium."

Badge hero "Gratis" diubah menjadi "Mulai gratis". Badge CTA "Gratis • 24/7 • Bahasa Indonesia" → "Mulai gratis • 24/7 • Bahasa Indonesia". Semua statistik ("64,2 juta UMKM", "hanya 15%") wajib diberi sumber + tahun, atau dihapus.

### 8.2 Pilar 2 — Blog

**Kondisi sekarang:** sudah cukup lengkap dan aman. `/blog` (ISR 300s) menampilkan featured post + grid, filter kategori, pencarian via `?q=`; `/blog/[slug]` menyanitasi HTML lewat `sanitizeArticleHtml` (allowlist tag, `img` hanya https, `rel="noopener noreferrer"` otomatis untuk `target="_blank"`); penulis dibaca dari tabel projeksi `public_profiles`; ada JSON-LD. Alur editor: `/editor-onboarding` → `editor_applications` → approve admin → `/editor/posts/new`.

**Masalah yang harus diperbaiki:**

| #   | Masalah                                                                                                                                                             | Perbaikan                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| B-1 | `view_count` dinaikkan dengan read-modify-write dari client-side session (`update({ view_count: post.view_count + 1 })`) — race condition, dan hitungan bisa hilang | Buat RPC `increment_post_view(p_post_id uuid)` SECURITY DEFINER yang melakukan `UPDATE … SET view_count = view_count + 1`; panggil itu |
| B-2 | Pencarian `?q=` diinterpolasi langsung ke `.or('title.ilike.%q%')`                                                                                                  | Escape `%`, `_`, dan `,` sebelum interpolasi; batasi panjang query 100 karakter                                                        |
| B-3 | Tidak ada paginasi — hardcoded `.limit(24)`                                                                                                                         | Tambah paginasi `?page=` dengan `.range()`, 12 post per halaman                                                                        |
| B-4 | `estimateReadTime` mengalikan panjang excerpt × 4 (tebakan)                                                                                                         | Simpan `reading_minutes` saat post disimpan, hitung dari `content` sebenarnya                                                          |
| B-5 | CTA "Daftar sebagai Editor" mengarah ke `/register` walau user sudah login                                                                                          | Arahkan ke `/editor-onboarding` kalau sudah login                                                                                      |
| B-6 | `<img>` mentah tanpa optimasi                                                                                                                                       | Ganti ke `next/image` dengan `remotePatterns` yang eksplisit                                                                           |
| B-7 | Cast `as any` pada `post.category` dan `post.author`                                                                                                                | Definisikan tipe `BlogPostListItem` yang benar                                                                                         |

**Tidak boleh diubah:** sanitasi HTML wajib tetap ada dan tetap server-side. Konten editor tidak boleh pernah dirender dengan `dangerouslySetInnerHTML` tanpa melalui `sanitizeArticleHtml`.

### 8.3 Pilar 3 — AI Helper

AI helper terdiri dari **tiga endpoint terpisah** yang sering disalahpahami sebagai satu fitur:

| Endpoint            | Fungsi                                     | Rate limit      | Auth                   | Model                                                |
| ------------------- | ------------------------------------------ | --------------- | ---------------------- | ---------------------------------------------------- |
| `POST /api/analyze` | Analisis kesiapan ekspor + RAG regulasi    | 5/menit per IP  | opsional (guest boleh) | `gemini-3-flash-preview`, JSON ketat                 |
| `POST /api/chat`    | Konsultan AI streaming, konteks assessment | 10/menit per IP | wajib login            | `sendMessageStream` → `text/plain`, `no-store`       |
| `POST /api/hs-code` | Cari kandidat HS Code (maks 3)             | 5/menit per IP  | tidak wajib            | JSON ketat, wajib menyertakan `note` verifikasi BTKI |

**Aturan AI yang wajib dipatuhi:**

| #    | Aturan                                                                                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AI-1 | Nama model **hanya** didefinisikan di `src/lib/gemini.ts`. Saat ini route chat mengulang string `'gemini-3-flash-preview'` — hapus duplikasi itu.                                                                                                                                                            |
| AI-2 | RAG `searchRegulations` **fail soft** (return `[]`) — jangan pernah diubah jadi throw. Analisis tetap jalan tanpa konteks regulasi.                                                                                                                                                                          |
| AI-3 | Prompt regulasi wajib mempertahankan klausa anti-halusinasi: kalau konteks tidak cukup, AI harus mengaku dan mengarahkan verifikasi ke Kemendag/instansi resmi.                                                                                                                                              |
| AI-4 | `regulation_chunks` tidak boleh bisa dibaca `anon` maupun `authenticated`. Akses hanya via `match_regulation_chunks` yang dipanggil service role.                                                                                                                                                            |
| AI-5 | Embedding tetap `text-embedding-004` @ 768 dimensi, sesuai kolom `vector(768)`. Mengganti model embedding = wajib re-embed seluruh korpus + migrasi kolom.                                                                                                                                                   |
| AI-6 | Semua output AI wajib didampingi disclaimer terlihat: *"Hasil ini dibuat oleh AI dan bersifat indikatif. Verifikasi ke instansi resmi sebelum mengambil keputusan bisnis."* Sekarang disclaimer hanya ada di `/syarat-ketentuan` — pindahkan/duplikasikan ke `/results/[id]`, panel chat, dan hasil HS Code. |
| AI-7 | Sumber regulasi (`extractSourceTitles`) wajib ditampilkan di halaman hasil supaya jawaban bisa dilacak.                                                                                                                                                                                                      |

**Perbaikan chat yang harus dikerjakan:** entitlement "5 pesan/hari untuk gratis" ada di matriks entitlement tapi **belum diimplementasikan** — `ChatPanel` tidak mengenal `isPremium` dan `/api/chat` hanya punya rate limit per IP. Implementasikan kuota harian di server: hitung lewat `check_rate_limit` dengan endpoint `chat-daily`, window 24 jam, `maxRequests` 5 untuk non-premium dan longgar untuk premium. Kuota harus dievaluasi di server, bukan di komponen.

***

## 9. Kontrak API

Semua route di bawah wajib: validasi Zod di batas masuk, pesan error berbahasa Indonesia, dan tidak pernah membocorkan detail internal ke klien (log detail ke server saja).

| Method & Path                          | Auth      | Body / Param                                                      | Sukses                                                                                 | Error                                        |
| -------------------------------------- | --------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------- |
| `POST /api/analyze`                    | opsional  | `AssessmentInput` + `privacyAccepted: literal(true)`              | `200 { score, breakdown, aiResult, assessmentId, accessToken? }`                       | 400, 403 bot, 429, 502 AI, 500               |
| `POST /api/chat`                       | wajib     | `{ assessmentId?, messages: [{role, content ≤2000}] }` 1–21 pesan | `200` stream `text/plain`, `no-store`                                                  | 400, 401, 403, 429, 500                      |
| `POST /api/hs-code`                    | tidak     | `{ productName ≤200, category? ≤100, description? ≤1000 }`        | `200 { candidates[≤3], note }`                                                         | 400, 403, 429, 500                           |
| `GET /api/results/[id]`                | opsional  | `id` uuid; `?token=` uuid untuk guest                             | `200` baris assessment (ter-mask jika non-premium), `Cache-Control: private, no-store` | 400, 404, 500                                |
| `POST /api/payment/create-transaction` | wajib     | `{ plan_id: uuid }`                                               | `200 { token, redirect_url, order_id, amount }`                                        | 400, 401, 403, 404 plan, 503 key kosong, 500 |
| `POST /api/payment/notification`       | signature | payload Midtrans                                                  | `200 { received: true }`                                                               | 400, 403 signature, 413 >64KB, 500           |
| `GET /api/payment/status/[orderId]`    | wajib     | `orderId`                                                         | `200 { order_id, status, gross_amount, updated_at }`                                   | 401, 404, 500                                |
| `GET /api/subscription/status`         | wajib     | —                                                                 | `200 { plan, status, expiresAt, features, isPremium }`                                 | 401, 500                                     |
| `GET /api/health`                      | tidak     | —                                                                 | `200 { status: 'ok' }`                                                                 | 500                                          |

**Route yang dihapus:** seluruh `src/app/api/mobile/v1/**` (6 endpoint) beserta `src/lib/mobile-auth.ts` dan `openapi/mobile-v1.yaml`. Spesifikasi OpenAPI dipindahkan ke `docs/archive/mobile-v1.yaml` sebagai catatan sejarah.

**Aturan tambahan:**

* Setiap route yang menerima input dari publik wajib `checkBotId()` sebelum melakukan pekerjaan berat.

* Rate limit dievaluasi lewat `check_rate_limit` (Postgres, `pg_advisory_xact_lock`). Di production, kegagalan RPC harus **menolak** request (`RATE_LIMIT_UNAVAILABLE`), bukan fail-open. Fallback in-memory hanya boleh aktif di development.

* Endpoint yang mengembalikan data pribadi wajib `Cache-Control: private, no-store`.

***

## 10. Keamanan, Environment & Konfigurasi

### 10.1 Matriks Environment Variable

| Variable                             | Wajib      | Scope           | Catatan                                                                                         |
| ------------------------------------ | ---------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | selalu     | publik          | Harus `https://` dan memuat "supabase"                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | selalu     | publik          | —                                                                                               |
| `SUPABASE_SERVICE_ROLE_KEY`          | production | **server only** | Jangan pernah diprefiks `NEXT_PUBLIC_`                                                          |
| `GEMINI_API_KEY`                     | selalu     | server only     | —                                                                                               |
| `MIDTRANS_SERVER_KEY`                | production | server only     | Dipakai untuk signature sha512                                                                  |
| `MIDTRANS_CLIENT_KEY`                | production | server only     | Harus identik dengan versi publiknya                                                            |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`    | production | publik          | —                                                                                               |
| `MIDTRANS_IS_PRODUCTION`             | production | server only     | Wajib `'true'` di production                                                                    |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | production | publik          | Wajib `'true'` di production                                                                    |
| `NEXT_PUBLIC_SITE_URL`               | selalu     | publik          | `https://exportready.web.id` di production; dipakai untuk canonical, sitemap, callback Midtrans |
| `SKIP_ENV_VALIDATION`                | tidak      | build only      | Hanya untuk CI build. Jangan diset di Vercel                                                    |
| `REQUIRE_PRODUCTION_PAYMENTS`        | tidak      | server only     | Memaksa validasi ketat di preview                                                               |

Gerbang validasi tetap `scripts/validate-env.mjs`, dijalankan sebagai bagian dari `npm run build`. **Jangan lemahkan atau lewati skrip ini.**

### 10.2 Kebersihan Secret

* Semua secret hanya ada di Vercel Environment Variables. `.env.local` tidak pernah di-commit.

* `.env.example` wajib diperbarui: hapus referensi ke `export-ready-ai.vercel.app` dan Cloud Run, ganti dengan domain baru.

* Kalau ada kemungkinan key lama pernah bocor saat project Vercel dihapus/dibuat ulang, **rotasi**: Supabase service role key, Gemini API key, dan Midtrans server key.

### 10.3 Security Header

Pertahankan konfigurasi di `next.config.ts` (CSP dengan allowlist Midtrans, HSTS `preload`, `X-Frame-Options: DENY`, COOP, `withBotId`). Satu-satunya perubahan: **hapus** **`output: "standalone"`** karena itu artefak Cloud Run dan tidak diperlukan Vercel.

### 10.4 Kepatuhan & Legitimasi Publik

Ini yang membuat produk terlihat sungguhan, dan sekarang belum beres:

| #   | Item                                                                                | Aksi                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-1 | Email `info@exportready.ai` tidak bisa dihubungi (domain berbeda dari yang dipakai) | Ganti ke email di domain aktif, pasang di footer + `/hubungi-kami` + T\&K + kebijakan privasi                                                     |
| L-2 | Alamat "Jakarta, Indonesia" tanpa identitas hukum                                   | Cantumkan nama badan/perorangan + NPWP/NIB kalau ada; kalau belum ada badan usaha, sebut jelas sebagai layanan perorangan — jangan menyiratkan PT |
| L-3 | CTA di `/materi-belajar` mengarah ke situs pribadi `icaluwu.space`                  | Arahkan ke halaman internal yang relevan                                                                                                          |
| L-4 | Disclaimer AI hanya di T\&K                                                         | Duplikasikan ke `/results/[id]`, chat, dan HS Code (AI-6)                                                                                         |
| L-5 | Statistik tanpa sumber                                                              | Tambah sumber + tahun, atau hapus                                                                                                                 |
| L-6 | Belum ada halaman refund/pembatalan padahal menerima pembayaran                     | Tambahkan bagian refund di `/syarat-ketentuan` dan rujuk dari FAQ billing                                                                         |

***

## 11. Refactor & Cleanup (target G4 & G5)

### 11.1 File yang Wajib Didekomposisi

Batas keras: **tidak ada file** **`.tsx`** **lebih dari 500 baris**. Kondisi sekarang:

| File                               | Baris | Rencana dekomposisi                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/assessment/page.tsx`      | 830   | Pecah per langkah wizard: `components/assessment/StepProduk.tsx`, `StepKapasitas.tsx`, `StepSertifikasi.tsx`, `StepHarga.tsx`, `StepPengalaman.tsx`, `StepReview.tsx`, plus `useAssessmentForm()` hook untuk state + validasi Zod, dan `AssessmentProgress.tsx`. Halaman tinggal orkestrasi. |
| `src/app/admin/dashboard/page.tsx` | 571   | Pecah per tab/panel: `components/admin/StatsCards.tsx`, `UserTable.tsx`, `EditorApplicationTable.tsx`, `TransactionTable.tsx`, `PostModerationTable.tsx`. Query dipindah ke `src/lib/admin-queries.ts`.                                                                                      |
| `src/app/dashboard/page.tsx`       | 557   | Pecah jadi `components/dashboard/AssessmentHistoryList.tsx`, `SubscriptionCard.tsx`, `TransactionHistoryList.tsx` (baru, §7.4 poin 3), `QuickActions.tsx`.                                                                                                                                   |

Aturan dekomposisi: **jangan ubah perilaku**. Ini murni pemindahan kode. Server Component tetap Server Component; hanya bagian yang butuh `useState`/`useEffect` yang jadi `"use client"`.

### 11.2 File & Konfigurasi yang Dihapus

| Yang dihapus                                                             | Alasan                                                                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`, `.dockerignore`, `cloudbuild.yaml`, `scripts/gcp-setup.sh` | Artefak Cloud Run. Prinsip P5: Vercel-only.                                                                                  |
| `output: "standalone"` di `next.config.ts`                               | Konsekuensi dari poin di atas.                                                                                               |
| `src/app/api/mobile/v1/**` (6 endpoint)                                  | Tidak ada klien mobile. Permukaan serang tanpa manfaat (§9).                                                                 |
| `src/lib/mobile-auth.ts`                                                 | Hanya dipakai route mobile.                                                                                                  |
| `openapi/mobile-v1.yaml`                                                 | Dipindah ke `docs/archive/mobile-v1.yaml`.                                                                                   |
| Fungsi `activateSubscription()` di `src/lib/subscription.ts`             | Jalur aktivasi duplikat (PAY-4 / G2). Fungsi baca (`getUserSubscriptionStatus`, `isPremiumUser`, `computeExpiryDate`) tetap. |
| String `'gemini-3-flash-preview'` di `src/app/api/chat/route.ts`         | Duplikasi konstanta (AI-1). Impor dari `src/lib/gemini.ts`.                                                                  |

### 11.3 Konsolidasi Lain

1. **`PremiumGate`** **/** **`PremiumCTA`** — ganti semua tautan `/#pricing` menjadi `/harga`; gunakan prop `feature` yang sekarang tidak terpakai untuk menentukan copy CTA.
2. **`PricingSection`** — jadikan komponen presentasional yang menerima `plans` sebagai props dari Server Component, bukan lagi fetch sendiri di client.
3. **Tipe database** — satu file `src/types/database.ts` sebagai sumber tipe baris tabel. Hapus semua `as any` pada hasil query Supabase.
4. **`.env.example`** — sinkronkan dengan §10.1, hapus semua jejak `export-ready-ai.vercel.app` dan Cloud Run.
5. **`docs/`** — `DEPLOYMENT.md` dan `VERCEL_CHECKLIST.md` diperbarui agar cocok dengan alur branch di §12; hapus instruksi GCP.

***

## 12. Strategi Branch, CI & Deployment

### 12.1 Struktur Branch

Repo sekarang hanya punya `main` (HEAD `13b423c`). Target dua branch permanen:

| Branch | Peran                       | Vercel                                       | Proteksi                                                                           |
| ------ | --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `main` | **Production**              | Production Deployment → `exportready.web.id` | Tidak boleh push langsung. Hanya lewat PR dari `dev`. Wajib CI hijau + 1 approval. |
| `dev`  | **Development / integrasi** | Preview Deployment (URL preview otomatis)    | Push langsung boleh. CI wajib jalan.                                               |

Branch kerja harian dibuat dari `dev` dengan pola `feat/…`, `fix/…`, `chore/…`, lalu PR ke `dev`. Rilis = PR `dev` → `main`.

```
feat/harga-page ──┐
fix/blog-view    ──┼──► dev ──(PR rilis)──► main ──► Production
chore/cleanup    ──┘      │                    │
                          └─ Preview URL       └─ exportready.web.id
```

Perintah pembuatan branch `dev` (sekali saja):

```bash
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev
```

Aturan: **`dev`** **tidak pernah di-rebase paksa** dan **`main`** **tidak pernah menerima commit langsung**. Hotfix production dibuat dari `main` sebagai `hotfix/…`, PR ke `main`, lalu di-merge balik ke `dev` agar tidak ada divergensi.

### 12.2 Perubahan CI

`.github/workflows/ci.yml` sekarang hanya terpicu pada `pull_request` dan `push` ke `[main]`. Target G7 menuntut:

```yaml
on:
  pull_request:
  push:
    branches: [main, dev]
```

Sisa langkah (lint → typecheck → test → validate:migrations → build dengan `SKIP_ENV_VALIDATION=true` → `npm audit --omit=dev --audit-level=high`) **dipertahankan apa adanya**. Tambahan yang wajib:

* Job `migration-check` yang gagal kalau ada file baru di `supabase/migrations/` dengan timestamp lebih kecil dari migration terakhir yang sudah ada (mencegah urutan migration kacau).

* Cache `.next/cache` untuk mempercepat build.

### 12.3 Konfigurasi Vercel

| Setting           | Nilai                                                              |
| ----------------- | ------------------------------------------------------------------ |
| Framework Preset  | Next.js                                                            |
| Production Branch | `main`                                                             |
| Build Command     | default (`npm run build`, yang sudah memanggil `validate-env.mjs`) |
| Install Command   | `npm ci`                                                           |
| Node Version      | 24                                                                 |
| Domain production | `exportready.web.id` + redirect dari `www`                         |
| Preview           | otomatis untuk `dev` dan semua PR                                  |

**Scoping environment variable di Vercel:**

| Variable                     | Production                   | Preview     | Development             |
| ---------------------------- | ---------------------------- | ----------- | ----------------------- |
| Supabase URL / anon key      | ✅                            | ✅           | ✅                       |
| `SUPABASE_SERVICE_ROLE_KEY`  | ✅                            | ✅           | lokal saja              |
| `GEMINI_API_KEY`             | ✅                            | ✅           | ✅                       |
| Midtrans **production** keys | ✅                            | ❌           | ❌                       |
| Midtrans **sandbox** keys    | ❌                            | ✅           | ✅                       |
| `MIDTRANS_IS_PRODUCTION`     | `true`                       | `false`     | `false`                 |
| `NEXT_PUBLIC_SITE_URL`       | `https://exportready.web.id` | URL preview | `http://localhost:3000` |
| `SKIP_ENV_VALIDATION`        | ❌ jangan diset               | ❌           | ❌                       |

**Larangan keras:** Midtrans production key tidak boleh pernah ada di scope Preview. Preview memakai sandbox supaya pengujian pembayaran tidak menagih uang sungguhan.

### 12.4 Webhook Midtrans per Environment

Midtrans hanya mengizinkan satu Payment Notification URL per environment key:

* **Sandbox dashboard** → `https://<url-preview-dev-yang-stabil>/api/payment/notification`

* **Production dashboard** → `https://exportready.web.id/api/payment/notification`

Karena URL preview per-PR berubah-ubah, gunakan **satu preview domain stabil** yang dipin ke branch `dev` (misalnya `dev.exportready.web.id`) sebagai target webhook sandbox.

### 12.5 Urutan Migrasi Database

Supabase project `vpkfogomhadefnyhrcgv` dipakai bersama oleh production dan preview di v2 (tidak ada dana untuk dua project). Konsekuensi dan mitigasinya:

1. Migration di-apply manual dan berurutan; jangan pernah menjalankan `supabase db reset` pada project ini.
2. Setiap migration wajib idempoten (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`).
3. Sebelum apply migration `20260901000000_v2_rebuild_alignment.sql`, ambil backup lewat Supabase Dashboard.
4. Data uji di preview harus memakai akun bertanda jelas (misal email `+test@`) supaya bisa dibersihkan.
5. Kalau nanti ada anggaran, pisahkan menjadi project `staging` — ini rekomendasi, bukan syarat v2.

***

## 13. Strategi Pengujian

### 13.1 Yang Sudah Ada

`tests/production-readiness.test.ts` dijalankan lewat `tsx --test` dan menguji 4 hal:

1. `safe-redirect` menerima path lokal dan menolak target eksternal
2. `sanitizeArticleHtml` membuang markup eksekutabel
3. `maskFreeAiResult` menyembunyikan negara premium dan roadmap fase 3–4
4. `calculatePaymentTotal` menghitung PPN secara konsisten

**Keempat test ini wajib tetap lulus.** Jangan dilonggarkan untuk mengakomodasi refactor — kalau test gagal setelah refactor, refactor-nya yang salah.

### 13.2 Test yang Wajib Ditambahkan

| #   | Test                                                                                                                                             | Kenapa penting                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| T-1 | `calculateExportScore` deterministik: input identik → skor identik; setiap komponen sesuai tabel formula §6.1; total tidak pernah > 100 atau < 0 | Skor adalah janji inti produk                            |
| T-2 | Verifikasi signature Midtrans: signature benar → lolos; satu karakter diubah → ditolak; panjang berbeda → ditolak tanpa exception                | Ini gerbang uang                                         |
| T-3 | `mapTransactionStatus` untuk semua kombinasi `transaction_status` × `fraud_status` sesuai tabel §7.1                                             | Salah map = langganan aktif tanpa bayar, atau sebaliknya |
| T-4 | `computeExpiryDate` untuk `monthly` (+30 hari) dan `yearly` (+365 hari), termasuk kasus tahun kabisat                                            | Salah hitung = user dirugikan                            |
| T-5 | `maskFreeAiResult` idempoten (memanggil dua kali hasilnya sama) dan tidak pernah membocorkan `topCountries[1]`/`[2]`                             | Kebocoran = kehilangan alasan bayar                      |
| T-6 | Escaping query pencarian blog: input `%`, `_`, `,`, dan `'` tidak mengubah struktur filter                                                       | B-2                                                      |
| T-7 | Zod schema tiap endpoint: payload kosong, kelebihan panjang, tipe salah → semuanya 400                                                           | Batas input adalah pertahanan pertama                    |

Semua test di atas adalah **unit test murni** terhadap fungsi di `src/lib/*` — tidak butuh database, tidak butuh network, jadi bisa jalan di CI tanpa secret.

### 13.3 Verifikasi Manual Sebelum Rilis ke `main`

Checklist ini dijalankan di preview `dev` dengan Midtrans sandbox:

| #    | Skenario                                                   | Hasil yang diharapkan                                                      |
| ---- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| M-1  | Assessment sebagai guest sampai selesai                    | Skor keluar, hasil bisa dibuka lewat `share_token`, fase 3–4 terkunci      |
| M-2  | Buka URL hasil orang lain tanpa token                      | 404                                                                        |
| M-3  | Buka URL hasil dengan token kedaluwarsa                    | 404                                                                        |
| M-4  | Bayar paket premium dengan kartu sandbox sukses            | `settlement` → langganan aktif → fase 3–4 & PDF terbuka tanpa perlu logout |
| M-5  | Bayar lalu pilih "batalkan" di Snap                        | Status `cancel`, langganan tetap non-aktif                                 |
| M-6  | Kirim webhook palsu dengan signature salah                 | 403, tidak ada perubahan di database                                       |
| M-7  | Kirim webhook valid dua kali (replay)                      | Langganan tidak diperpanjang dua kali (idempotency guard)                  |
| M-8  | Hit `/api/analyze` 6× dalam semenit                        | Request ke-6 dapat 429                                                     |
| M-9  | Login sebagai non-admin lalu buka `/admin/dashboard`       | Ditolak/redirect, bukan sekadar UI disembunyikan                           |
| M-10 | Publikasikan artikel blog berisi `<script>` sebagai editor | Script hilang dari halaman publik                                          |
| M-11 | Buka `/harga` sebagai user premium aktif                   | Tombol bayar disabled dengan label tanggal berakhir                        |
| M-12 | Buka `/pricing`                                            | Redirect permanen ke `/harga`                                              |
| M-13 | Lighthouse pada `/`, `/harga`, `/blog`                     | Accessibility ≥ 95, tidak ada error kontras                                |
| M-14 | Navigasi keyboard penuh di `/assessment`                   | Semua field bisa dicapai, fokus terlihat                                   |

Rilis ke `main` **diblokir** kalau ada satu pun item M-1..M-14 gagal.

***

## 14. Fase Implementasi

Urutan ini dirancang supaya setiap fase menghasilkan sesuatu yang bisa dideploy dan diuji. Jangan lompat fase.

### Fase 0 — Fondasi Repo (½ hari)

1. Buat branch `dev` dari `main`, push ke origin.
2. Aktifkan branch protection di `main` (PR wajib, CI wajib hijau).
3. Perbarui `ci.yml` agar terpicu di `main` + `dev` (§12.2).
4. Buat project Vercel baru, hubungkan ke repo, set Production Branch = `main`.
5. Isi environment variable per scope (§12.3).
6. Hapus artefak Cloud Run + `output: "standalone"` (§11.2).

**Selesai kalau:** CI hijau di `dev`, preview deployment berhasil dibuka, `npm run build` lolos `validate-env.mjs`.

### Fase 1 — Database & Migration (½ hari)

1. Backup Supabase project `vpkfogomhadefnyhrcgv`.
2. Apply `20260901000000_v2_rebuild_alignment.sql` (§5.4): reseed `admin_emails`, standardisasi share token 7 hari, grant `check_rate_limit`, kolom `description` + `sort_order`, isi `features` jsonb, dua index dashboard.
3. Tambah RPC `increment_post_view` (B-1) dan kolom `blog_posts.reading_minutes` (B-4).
4. Verifikasi RLS sesuai §5.3 dengan uji query sebagai `anon` dan `authenticated`.

**Selesai kalau:** `npm run validate:migrations` lolos, `subscription_plans` mengembalikan `features` dan `sort_order` yang benar.

### Fase 2 — Pembersihan Kode (1 hari)

1. Hapus `api/mobile/v1/**`, `mobile-auth.ts`, pindahkan `openapi/mobile-v1.yaml` ke `docs/archive/`.
2. Hapus `activateSubscription()` dari `src/lib/subscription.ts` (PAY-4).
3. Sentralisasi nama model Gemini (AI-1).
4. Buat `src/types/database.ts`, hapus `as any`.
5. Dekomposisi tiga file besar (§11.1).

**Selesai kalau:** `npm run typecheck` + `npm run lint` bersih, tidak ada file `.tsx` > 500 baris, semua test §13.1 tetap lulus.

### Fase 3 — Pricing & Payment (1–2 hari)

1. Buat `src/app/harga/page.tsx` (Server Component) + `src/app/pricing/page.tsx` redirect.
2. Ekstrak `PlanCheckoutButton` sebagai satu-satunya pemuat Snap.js.
3. Tampilkan rincian PPN sebelum bayar (§7.4 poin 2).
4. Tambah idempotency order (§7.4 poin 5).
5. Tambah riwayat transaksi di `/dashboard`.
6. Tambah banner sandbox.
7. Repoint semua `PremiumGate`/`PremiumCTA` ke `/harga`.
8. Set webhook sandbox ke preview domain stabil, jalankan M-4..M-7.

**Selesai kalau:** M-4 sampai M-7 dan M-11, M-12 lulus di sandbox.

### Fase 4 — Blog & AI Helper (1–2 hari)

1. B-1..B-7 (§8.2).
2. Kuota chat harian di server (§8.3).
3. Disclaimer AI di `/results/[id]`, panel chat, hasil HS Code (AI-6).
4. Tampilkan sumber regulasi (AI-7).

**Selesai kalau:** M-10 lulus, kuota chat terbukti ditolak di server (bukan hanya UI), disclaimer tampil di tiga tempat.

### Fase 5 — Copy, Legitimasi & Desain (1 hari)

1. Koreksi copy FAQ + badge hero (§8.1, prinsip P4).
2. Tambah/beri sumber statistik atau hapus (L-5).
3. Buat `/hubungi-kami` dengan email aktif; perbarui footer, T\&K, kebijakan privasi (L-1).
4. Cantumkan identitas hukum (L-2).
5. Ganti CTA ke situs pribadi (L-3).
6. Tambah bagian refund di `/syarat-ketentuan` (L-6).
7. Formalkan design token di `globals.css`, pastikan skor tidak dikomunikasikan hanya lewat warna.

**Selesai kalau:** M-13 dan M-14 lulus, tidak ada klaim "semuanya gratis" yang bertentangan dengan gating.

### Fase 6 — Rilis (½ hari)

1. Jalankan seluruh checklist M-1..M-14 di preview.
2. PR `dev` → `main`, review, merge.
3. Ganti Midtrans ke production key di scope Production, set `MIDTRANS_IS_PRODUCTION=true`.
4. Set webhook production ke `https://exportready.web.id/api/payment/notification`.
5. Uji satu transaksi nominal kecil sungguhan, pastikan `settlement` → langganan aktif.
6. Pasang domain `exportready.web.id`, verifikasi sitemap + robots + canonical.

**Selesai kalau:** transaksi production pertama berhasil dan langganan aktif otomatis tanpa intervensi manual.

***

## 15. Kriteria Penerimaan

PRD ini dianggap terpenuhi kalau **semua** baris di bawah bisa dibuktikan:

| Goal     | Kriteria terukur                                                                                                 | Cara verifikasi               |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| G1       | `GET /harga` → 200 dengan paket dari database; `GET /pricing` → 308 ke `/harga`                                  | curl / browser                |
| G2       | Pencarian `activateSubscription` di seluruh `src/` → 0 hasil; langganan aktif hanya setelah webhook `settlement` | grep + M-4                    |
| G3       | Tidak ada kalimat yang mengklaim fitur premium sebagai gratis; setiap statistik punya sumber                     | review copy manual            |
| G4       | Tidak ada `Dockerfile`, `cloudbuild.yaml`, `.dockerignore`, `scripts/gcp-setup.sh`, `output: "standalone"`       | grep + `git ls-files`         |
| G5       | Tidak ada file `.tsx` > 500 baris                                                                                | skrip hitung baris            |
| G6       | Email kontak menerima balasan; identitas hukum tercantum; `admin_emails` tidak lagi memuat domain mati           | kirim email uji + query tabel |
| G7       | CI hijau di `main`, `dev`, dan PR terbuka                                                                        | tab Actions                   |
| Payment  | M-4..M-7 lulus di sandbox **dan** satu transaksi production sukses                                               | manual                        |
| Keamanan | M-2, M-3, M-6, M-9, M-10 lulus; `regulation_chunks` tidak terbaca `anon`                                         | manual + query                |
| AI       | Disclaimer tampil di hasil, chat, dan HS Code; sumber regulasi terlihat                                          | manual                        |
| Kuota    | Chat non-premium ditolak di server setelah kuota harian habis                                                    | manual dengan akun uji        |

***

## 16. Risiko & Mitigasi

| #    | Risiko                                                                  | Dampak                                       | Mitigasi                                                                                          |
| ---- | ----------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| R-1  | Satu Supabase project dipakai production dan preview                    | Data uji tercampur data nyata                | Migration idempoten, backup sebelum apply, akun uji bertanda `+test@`, tidak pernah `db reset`    |
| R-2  | Webhook Midtrans hanya satu URL per environment                         | Notifikasi sandbox nyasar ke deployment lama | Pin satu preview domain stabil untuk `dev` (§12.4)                                                |
| R-3  | Refactor dekomposisi mengubah perilaku tanpa sadar                      | Regresi senyap                               | Test §13.1 wajib tetap lulus; dekomposisi dilakukan dalam PR terpisah dari perubahan fitur        |
| R-4  | Key lama mungkin sudah bocor sebelum project Vercel dihapus             | Penyalahgunaan kuota Gemini / akses database | Rotasi service role key, Gemini key, Midtrans server key sebelum production (§10.2)               |
| R-5  | Nama model Gemini `gemini-3-flash-preview` adalah preview               | Model bisa dihentikan sewaktu-waktu          | Satu konstanta di `gemini.ts` supaya penggantian cukup satu baris; siapkan fallback model         |
| R-6  | Kuota Gemini habis saat trafik naik                                     | `/api/analyze` gagal massal                  | Rate limit sudah ada; tambahkan pesan error yang jelas dan monitoring kegagalan 502               |
| R-7  | Rate limit fail-closed bisa memblokir semua user kalau RPC bermasalah   | Downtime fungsional                          | Pantau error `RATE_LIMIT_UNAVAILABLE`; ini pilihan sadar — lebih baik menolak daripada dibanjiri  |
| R-8  | User mengharapkan auto-renewal karena "bulanan"                         | Komplain saat langganan mati mendadak        | Nyatakan eksplisit di FAQ billing bahwa perpanjangan manual; kirim pengingat sebelum `expires_at` |
| R-9  | Pindah domain dari `export-ready-ai.vercel.app` ke `exportready.web.id` | Kehilangan indeks SEO                        | Pertahankan slug blog, pasang canonical + sitemap, submit ulang di Search Console                 |
| R-10 | Belum ada badan usaha padahal menerima pembayaran                       | Risiko kepatuhan dan kepercayaan             | Selesaikan L-2 sebelum promosi berbayar; jangan menyiratkan PT kalau belum ada                    |

***

## 17. Cara Memakai Dokumen Ini (untuk AI pelaksana)

1. Kerjakan **per fase** sesuai §14. Satu fase = satu atau beberapa PR ke `dev`.
2. Sebelum menulis kode, baca ulang §0 (lima prinsip) dan bagian yang relevan. Aturan bertanda **"tidak boleh"**, **"wajib"**, atau **"larangan keras"** adalah batasan keras, bukan saran.
3. Kalau ada konflik antara PRD ini dan kode yang ada, **PRD menang** — kecuali PRD tampak bertentangan dengan kenyataan kode, yang berarti harus dilaporkan, bukan ditebak.
4. Jangan menambah dependency baru tanpa alasan yang ditulis di deskripsi PR.
5. Jangan menambah fitur yang tidak ada di §3.1. Ide di luar scope dicatat, bukan dikerjakan.
6. Setiap PR wajib menyebut nomor aturan yang dipenuhi (misal "memenuhi PAY-4, G2") dan lulus CI.

