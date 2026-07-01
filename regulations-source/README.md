# Sumber Regulasi untuk RAG

Taruh file teks regulasi hasil copy-paste manual di folder ini.

## Format file

- Ekstensi: `.txt` atau `.md`
- Nama file akan dipakai sebagai judul sumber, misalnya: `UU-17-2006-Kepabeanan.txt`

## Cara ingest

Pastikan env sudah diisi di `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Jalankan:

```bash
npx tsx scripts/ingest-regulations.ts
```

Script akan chunk teks (~500 token, overlap 50), embed via Gemini `text-embedding-004`, lalu insert ke tabel `regulation_chunks`.
