import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Syarat dan ketentuan penggunaan ExportReady AI.',
  alternates: { canonical: '/syarat-ketentuan' },
};

const sections = [
  {
    title: 'Kelayakan dan akun',
    body: 'Anda wajib memberikan informasi yang benar, menjaga keamanan akun, dan bertanggung jawab atas aktivitas melalui akun Anda. Kami dapat membatasi akun yang digunakan untuk penipuan, penyalahgunaan, atau pelanggaran ketentuan.',
  },
  {
    title: 'Sifat layanan dan hasil AI',
    body: 'Skor, kode HS, rekomendasi pasar, regulasi, dan jawaban AI merupakan informasi pendukung. Hasil dapat tidak lengkap atau keliru dan bukan pengganti verifikasi dengan instansi, konsultan hukum, kepabeanan, pajak, sertifikasi, atau profesional lain.',
  },
  {
    title: 'Paket berbayar',
    body: 'Harga, masa aktif, pajak, dan fitur ditampilkan sebelum pembayaran. Pembayaran diproses oleh Midtrans. Aktivasi mengikuti konfirmasi pembayaran yang sah. Permintaan pengembalian dana ditinjau berdasarkan status transaksi, pemakaian layanan, dan ketentuan pembayaran yang berlaku.',
  },
  {
    title: 'Konten pengguna dan editor',
    body: 'Anda hanya boleh mengunggah konten yang berhak Anda gunakan. Konten tidak boleh melanggar hukum, hak kekayaan intelektual, privasi, atau keamanan pihak lain. Artikel editor dapat dimoderasi, ditolak, diarsipkan, atau dihapus.',
  },
  {
    title: 'Penggunaan yang dilarang',
    body: 'Dilarang mencoba melewati kontrol akses, mengambil data pengguna lain, mengganggu layanan, mengotomasi permintaan secara berlebihan, menyalahgunakan hasil AI, mengunggah kode berbahaya, atau menggunakan layanan untuk aktivitas melawan hukum.',
  },
  {
    title: 'Ketersediaan dan tanggung jawab',
    body: 'Kami berupaya menjaga layanan tetap tersedia dan aman, tetapi tidak menjamin layanan bebas gangguan atau seluruh hasil selalu akurat. Keputusan bisnis dan kepatuhan ekspor tetap menjadi tanggung jawab pengguna.',
  },
  {
    title: 'Penangguhan dan perubahan',
    body: 'Kami dapat menangguhkan akses untuk melindungi pengguna dan sistem. Fitur atau ketentuan dapat diperbarui; perubahan material akan diberitahukan melalui layanan atau halaman ini.',
  },
];

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <article className="border border-border bg-card p-6 shadow-sm md:p-10">
        <h1 className="mb-3 text-3xl font-black text-foreground">Syarat & Ketentuan</h1>
        <p className="text-sm font-medium text-muted-foreground">Terakhir diperbarui: 22 Juli 2026</p>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Dengan menggunakan ExportReady AI, Anda menyetujui ketentuan berikut dan{' '}
          <Link className="font-bold text-primary underline" href="/kebijakan-privasi">Kebijakan Privasi</Link>.
        </p>
        <div className="mt-8 space-y-7">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="font-black text-foreground">{index + 1}. {section.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
          <section>
            <h2 className="font-black text-foreground">8. Kontak</h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Pertanyaan mengenai layanan dapat dikirim ke{' '}
              <a className="font-bold text-primary underline" href="mailto:info@exportready.ai">info@exportready.ai</a>.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}