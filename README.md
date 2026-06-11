# ExportReady AI 🚀

Platform bertenaga AI untuk membantu UMKM Indonesia menilai kesiapan ekspor dan mendapatkan rekomendasi pasar global secara instan.

## 📝 Deskripsi Proyek
ExportReady AI dirancang sebagai asisten digital bagi pelaku usaha kecil dan menengah (UMKM) yang ingin go-global. Dengan menjawab beberapa pertanyaan strategis, AI akan memberikan skor kesiapan dan roadmap langkah demi langkah.

## 🤖 Atribusi AI
Proyek ini dikembangkan dengan bantuan **Artificial Intelligence (AI) sebesar ±50%** dalam proses koding, desain, dan penyusunan konten. Dikembangkan di bawah panduan teknis tahun 2026.

## 🛠️ Stack Teknologi
- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Google Gemini API (gemini-3-flash-preview)
- **Komponen**: Framer Motion & Recharts

## 🚀 Deployment

| Environment | Platform |
|-------------|----------|
| Prototype / preview | [Vercel](https://vercel.com) |
| Production | [Google Cloud Run](https://cloud.google.com/run) |

- **Local setup**: copy [`.env.example`](.env.example) → `.env.local`, then `npm install && npm run dev`
- **Vercel login issues**: [docs/VERCEL_CHECKLIST.md](docs/VERCEL_CHECKLIST.md)
- **Full guide (Vercel + Cloud Run + Supabase)**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Production URL (Vercel): `https://export-ready-ai.vercel.app`  
Branch previews use `export-ready-ai-git-<branch>-<team>.vercel.app` — this is normal Vercel behavior.

## 💡 Manfaat & Kegunaan
1. **Self-Assessment**: Mengetahui kelemahan dan kekuatan produk untuk pasar ekspor.
2. **Market Intelligence**: Rekomendasi 3 negara terbaik berdasarkan profil produk.
3. **Step-by-Step Roadmap**: Panduan persiapan dari bulan ke-0 hingga scale-up.
4. **Export Readiness Score**: Metrik objektif untuk mengukur kelayakan ekspor.

## 🛡️ Hak Milik & Lisensi
Proyek ini merupakan hak milik penuh dari **Teuku Vaickal Rizki Irdian** (USER). Dilisensikan di bawah [MIT License](LICENSE).

---
*Dibuat untuk UMKM Indonesia dan Hackathon Digdaya 2026.*
