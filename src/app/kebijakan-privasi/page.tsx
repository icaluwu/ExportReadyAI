import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi dan pemrosesan data ExportReady AI.',
  alternates: { canonical: '/kebijakan-privasi' },
};

const sections = [
  {
    title: 'Data yang kami proses',
    body: 'Kami memproses data akun, profil usaha, informasi produk, kapasitas, sertifikasi, target pasar, hasil assessment, percakapan dengan Konsultan AI, serta data transaksi. Kami tidak meminta kata sandi melalui formulir selain halaman autentikasi resmi.',
  },
  {
    title: 'Tujuan pemrosesan',
    body: 'Data digunakan untuk menyediakan akun, menghitung kesiapan ekspor, menghasilkan rekomendasi AI, menyimpan riwayat, memproses pembayaran, mencegah penyalahgunaan, memperbaiki layanan, dan memenuhi kewajiban hukum.',
  },
  {
    title: 'Penyedia layanan',
    body: 'ExportReady AI menggunakan Supabase untuk autentikasi dan database, Google Gemini untuk pemrosesan AI, Midtrans untuk pembayaran, dan Vercel untuk hosting. Data yang diperlukan dapat diteruskan kepada penyedia tersebut sesuai fungsi layanan.',
  },
  {
    title: 'Penyimpanan dan keamanan',
    body: 'Assessment tamu diakses melalui tautan rahasia yang berlaku terbatas. Data akun disimpan selama akun aktif atau selama diperlukan untuk layanan, keamanan, penyelesaian sengketa, dan kewajiban hukum. Kami menerapkan kontrol akses, enkripsi saat transit, pencatatan aktivitas, dan pembatasan permintaan.',
  },
  {
    title: 'Hak dan pilihan Anda',
    body: 'Anda dapat memperbarui profil, menonaktifkan tautan berbagi, serta meminta akses, koreksi, ekspor, atau penghapusan data. Permintaan dapat ditolak atau dibatasi apabila penyimpanan masih diwajibkan untuk keamanan, transaksi, atau hukum.',
  },
  {
    title: 'Konten AI dan transfer data',
    body: 'Input yang dikirim ke fitur AI dapat diproses pada infrastruktur penyedia di luar wilayah Anda. Hindari memasukkan rahasia dagang, data pribadi pihak lain, atau informasi yang tidak berhak Anda bagikan.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <article className="border border-border bg-card p-6 shadow-sm md:p-10">
        <h1 className="mb-3 text-3xl font-black text-foreground">Kebijakan Privasi</h1>
        <p className="text-sm font-medium text-muted-foreground">Terakhir diperbarui: 22 Juli 2026</p>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Kebijakan ini menjelaskan cara pengelola ExportReady AI memproses data ketika Anda menggunakan situs dan layanan kami.
        </p>

        <div className="mt-8 space-y-7">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="font-black text-foreground">{index + 1}. {section.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
          <section>
            <h2 className="font-black text-foreground">7. Kontak dan perubahan kebijakan</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
              Untuk pertanyaan atau permintaan terkait data, hubungi{' '}
              <a className="font-bold text-primary underline" href="mailto:info@exportready.ai">info@exportready.ai</a>.
              Perubahan material akan ditampilkan pada halaman ini. Penggunaan layanan juga tunduk pada{' '}
              <Link className="font-bold text-primary underline" href="/syarat-ketentuan">Syarat & Ketentuan</Link>.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}