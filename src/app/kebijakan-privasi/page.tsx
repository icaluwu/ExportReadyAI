import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi ExportReady AI untuk pengguna UMKM Indonesia.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="rounded-[2rem] border border-white/70 bg-white/70 p-8 md:p-10 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)]">
        <h1 className="text-3xl font-black text-slate-900 mb-3">Kebijakan Privasi</h1>
        <p className="text-slate-600 font-medium leading-relaxed">
          Halaman ini menjelaskan bagaimana ExportReady AI mengumpulkan, menggunakan, dan melindungi data yang Anda input.
          Silakan sesuaikan isi kebijakan ini sebelum benar-benar digunakan untuk production.
        </p>

        <div className="mt-8 space-y-4 text-slate-700">
          <section>
            <h2 className="font-black">1) Data yang dikumpulkan</h2>
            <p className="text-sm font-medium text-slate-600">
              Informasi produk, kapasitas, sertifikasi, serta email untuk pengiriman laporan.
            </p>
          </section>
          <section>
            <h2 className="font-black">2) Tujuan penggunaan</h2>
            <p className="text-sm font-medium text-slate-600">
              Untuk menghasilkan skor kesiapan, rekomendasi negara, dan roadmap ekspor.
            </p>
          </section>
          <section>
            <h2 className="font-black">3) Penyimpanan & keamanan</h2>
            <p className="text-sm font-medium text-slate-600">
              Data disimpan di Supabase (PostgreSQL). Akses data sebaiknya dibatasi dengan kebijakan RLS.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

