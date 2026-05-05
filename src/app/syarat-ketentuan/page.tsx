import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Syarat dan ketentuan penggunaan ExportReady AI.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="rounded-[2rem] border border-white/70 bg-white/70 p-8 md:p-10 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)]">
        <h1 className="text-3xl font-black text-slate-900 mb-3">Syarat & Ketentuan</h1>
        <p className="text-slate-600 font-medium leading-relaxed">
          Halaman ini berisi aturan penggunaan ExportReady AI. Silakan lengkapi konten sesuai kebutuhan legal sebelum rilis production.
        </p>

        <div className="mt-8 space-y-4 text-slate-700">
          <section>
            <h2 className="font-black">1) Layanan informasi</h2>
            <p className="text-sm font-medium text-slate-600">
              ExportReady AI memberikan rekomendasi berbasis data dan AI, bukan pengganti konsultasi hukum/sertifikasi resmi.
            </p>
          </section>
          <section>
            <h2 className="font-black">2) Akurasi</h2>
            <p className="text-sm font-medium text-slate-600">
              Hasil analisis bersifat rekomendasi. Pengguna tetap bertanggung jawab atas keputusan bisnis dan kepatuhan regulasi.
            </p>
          </section>
          <section>
            <h2 className="font-black">3) Penggunaan akun</h2>
            <p className="text-sm font-medium text-slate-600">
              Jangan membagikan kredensial akun. Akses dashboard dan riwayat hanya untuk pemilik akun.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

