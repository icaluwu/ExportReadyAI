import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Wallet,
  ExternalLink,
  ListChecks,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Direktori Sertifikasi Ekspor',
  description:
    'Panduan lengkap sertifikasi untuk UMKM yang ingin ekspor: BPOM, Halal BPJPH, SNI, ISO, HACCP, Phytosanitary, dan lainnya—lengkap dengan estimasi biaya, durasi, dan langkah pengurusan.',
};

interface Certification {
  name: string;
  fullName: string;
  for: string;
  cost: string;
  duration: string;
  priority: 'Wajib' | 'Sangat Disarankan' | 'Opsional';
  steps: string[];
  officialUrl: string;
  officialName: string;
}

const CERTIFICATIONS: Certification[] = [
  {
    name: 'BPOM',
    fullName: 'Izin Edar Badan Pengawas Obat dan Makanan',
    for: 'Produk pangan olahan, kosmetik, dan obat tradisional. Wajib untuk produk yang beredar di pasar domestik dan menjadi syarat dasar kepercayaan buyer luar negeri.',
    cost: 'Rp 100 ribu – 3 juta (tergantung jenis produk dan skala usaha)',
    duration: '± 30 hari kerja setelah dokumen lengkap',
    priority: 'Wajib',
    steps: [
      'Daftarkan akun perusahaan di e-reg.pom.go.id',
      'Siapkan dokumen sarana produksi (denah, alur produksi)',
      'Ajukan audit sarana produksi (PSB)',
      'Daftarkan produk dan unggah hasil uji laboratorium',
      'Terima Nomor Izin Edar (NIE)',
    ],
    officialUrl: 'https://e-reg.pom.go.id/',
    officialName: 'e-Registration BPOM',
  },
  {
    name: 'Halal (BPJPH)',
    fullName: 'Sertifikat Halal Badan Penyelenggara Jaminan Produk Halal',
    for: 'Produk makanan, minuman, kosmetik, dan barang gunaan. Wajib untuk pasar Timur Tengah, Malaysia, dan Brunei; nilai tambah besar untuk pasar lain.',
    cost: 'Gratis (self-declare UMK) hingga Rp 5 juta (reguler)',
    duration: '± 21 hari kerja (self-declare) hingga 3 bulan (reguler)',
    priority: 'Sangat Disarankan',
    steps: [
      'Buat akun di ptsp.halal.go.id (SIHALAL)',
      'Lengkapi data pelaku usaha dan produk',
      'Pilih jalur self-declare (UMK) atau reguler',
      'Proses pemeriksaan oleh LPH / pendamping halal',
      'Terbit sertifikat halal dari BPJPH',
    ],
    officialUrl: 'https://ptsp.halal.go.id/',
    officialName: 'SIHALAL BPJPH',
  },
  {
    name: 'SNI',
    fullName: 'Standar Nasional Indonesia',
    for: 'Produk tertentu yang diwajibkan SNI (mainan, helm, pakaian bayi, dll). Menunjukkan produk memenuhi standar mutu nasional—modal awal menuju standar internasional.',
    cost: 'Rp 10 – 40 juta (tergantung produk dan lembaga sertifikasi)',
    duration: '± 1 – 3 bulan',
    priority: 'Opsional',
    steps: [
      'Cek apakah produk Anda masuk SNI wajib di bsn.go.id',
      'Pilih Lembaga Sertifikasi Produk (LSPro) terakreditasi KAN',
      'Uji produk di laboratorium terakreditasi',
      'Audit proses produksi',
      'Terbit Sertifikat Produk Pengguna Tanda SNI (SPPT-SNI)',
    ],
    officialUrl: 'https://www.bsn.go.id/',
    officialName: 'Badan Standardisasi Nasional',
  },
  {
    name: 'ISO 9001 / 22000',
    fullName: 'Sistem Manajemen Mutu / Keamanan Pangan Internasional',
    for: 'Semua jenis usaha (9001) dan industri pangan (22000). Diakui global dan sering jadi syarat buyer korporat di Eropa, Amerika, dan Jepang.',
    cost: 'Rp 15 – 50 juta (tergantung ukuran organisasi)',
    duration: '± 3 – 6 bulan (termasuk persiapan sistem)',
    priority: 'Sangat Disarankan',
    steps: [
      'Pelajari persyaratan standar dan lakukan gap analysis',
      'Susun dokumen sistem manajemen mutu',
      'Implementasikan sistem minimal 3 bulan',
      'Pilih badan sertifikasi terakreditasi',
      'Audit tahap 1 & 2, lalu terbit sertifikat',
    ],
    officialUrl: 'https://www.iso.org/standards.html',
    officialName: 'International Organization for Standardization',
  },
  {
    name: 'HACCP',
    fullName: 'Hazard Analysis Critical Control Point',
    for: 'Industri pangan olahan dan hasil laut. Standar keamanan pangan yang hampir selalu diminta importir di Amerika Serikat, Eropa, dan Jepang.',
    cost: 'Rp 10 – 35 juta',
    duration: '± 2 – 4 bulan',
    priority: 'Sangat Disarankan',
    steps: [
      'Bentuk tim HACCP dan deskripsikan produk',
      'Identifikasi bahaya dan titik kendali kritis (CCP)',
      'Tetapkan batas kritis, monitoring, dan tindakan koreksi',
      'Implementasikan dan dokumentasikan sistem',
      'Audit sertifikasi oleh lembaga terakreditasi',
    ],
    officialUrl: 'https://www.bsn.go.id/',
    officialName: 'BSN (SNI CXC 1:2023)',
  },
  {
    name: 'Phytosanitary',
    fullName: 'Sertifikat Kesehatan Tumbuhan (Karantina)',
    for: 'Produk pertanian segar dan olahan minimal (kopi, rempah, buah, sayur). Wajib untuk hampir semua negara tujuan ekspor produk tumbuhan.',
    cost: 'Rp 50 – 500 ribu per pengiriman',
    duration: '1 – 3 hari kerja per pengiriman',
    priority: 'Wajib',
    steps: [
      'Daftarkan diri di sistem Barantin (best.karantinaindonesia.go.id)',
      'Ajukan permohonan pemeriksaan sebelum ekspor',
      'Pemeriksaan fisik komoditas oleh petugas karantina',
      'Perlakuan (fumigasi/treatment) jika disyaratkan negara tujuan',
      'Terbit Phytosanitary Certificate (PC)',
    ],
    officialUrl: 'https://barantin.go.id/',
    officialName: 'Badan Karantina Indonesia',
  },
  {
    name: 'Certificate of Origin',
    fullName: 'Surat Keterangan Asal (SKA)',
    for: 'Semua produk ekspor. Membuktikan asal barang dari Indonesia agar buyer mendapat tarif preferensi dari perjanjian dagang (FTA).',
    cost: 'Gratis – Rp 25 ribu per dokumen',
    duration: '1 hari kerja (online)',
    priority: 'Wajib',
    steps: [
      'Pastikan sudah memiliki NIB dan akses ekspor',
      'Daftar di e-ska.kemendag.go.id',
      'Isi data eksportir, buyer, dan rincian barang',
      'Pilih jenis form sesuai negara tujuan (Form E, D, AK, dll)',
      'SKA terbit elektronik dan dikirim ke buyer',
    ],
    officialUrl: 'https://e-ska.kemendag.go.id/',
    officialName: 'e-SKA Kemendag',
  },
  {
    name: 'Merek (HKI)',
    fullName: 'Pendaftaran Merek Dagang DJKI',
    for: 'Semua produk dengan merek sendiri. Melindungi brand Anda dari peniruan di dalam negeri, dan jadi dasar pendaftaran merek internasional (Madrid Protocol).',
    cost: 'Rp 500 ribu (UMK) – Rp 1,8 juta per kelas',
    duration: '± 6 bulan – 1 tahun hingga sertifikat terbit',
    priority: 'Sangat Disarankan',
    steps: [
      'Cek ketersediaan merek di pdki-indonesia.dgip.go.id',
      'Buat akun di merek.dgip.go.id',
      'Ajukan permohonan dengan label merek dan daftar kelas',
      'Masa pengumuman publik 2 bulan',
      'Pemeriksaan substantif lalu sertifikat terbit',
    ],
    officialUrl: 'https://merek.dgip.go.id/',
    officialName: 'DJKI Kemenkumham',
  },
];

const PRIORITY_STYLE: Record<Certification['priority'], string> = {
  'Wajib': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  'Sangat Disarankan': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'Opsional': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function SertifikasiPage() {
  return (
    <div className="container relative mx-auto min-h-screen max-w-6xl px-4 py-14">
      <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute -bottom-28 -left-24 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      {/* Header */}
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-sm">
          <ShieldCheck className="h-4 w-4" /> Direktori Sertifikasi
        </span>
        <h1 className="mb-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">
          Sertifikasi yang Anda Butuhkan untuk Ekspor
        </h1>
        <p className="text-lg font-medium leading-relaxed text-muted-foreground">
          Panduan ringkas 8 sertifikasi paling penting untuk UMKM ekspor—lengkap dengan estimasi biaya,
          durasi pengurusan, langkah-langkah, dan tautan resminya.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="mx-auto mb-12 flex max-w-3xl items-start gap-3 rounded-2xl border border-border bg-card/70 p-5 text-sm font-medium text-muted-foreground">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>
          Estimasi biaya dan durasi bersifat indikatif dan dapat berubah sewaktu-waktu. Selalu cek tautan
          resmi untuk informasi terbaru, atau tanyakan langsung ke <strong className="text-foreground">Konsultan AI</strong> kami
          dari halaman hasil analisis Anda.
        </p>
      </div>

      {/* Certification cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {CERTIFICATIONS.map((cert) => (
          <Card key={cert.name} id={cert.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
            <div className="h-1.5 w-full bg-primary/80" />
            <CardContent className="p-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground">{cert.name}</h2>
                  <p className="text-sm font-bold text-muted-foreground">{cert.fullName}</p>
                </div>
                <Badge className={`shrink-0 rounded-full border-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${PRIORITY_STYLE[cert.priority]}`}>
                  {cert.priority}
                </Badge>
              </div>

              <p className="mb-6 text-sm font-medium leading-relaxed text-muted-foreground">{cert.for}</p>

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimasi Biaya</p>
                    <p className="text-sm font-bold text-foreground">{cert.cost}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimasi Durasi</p>
                    <p className="text-sm font-bold text-foreground">{cert.duration}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <ListChecks className="h-4 w-4 text-primary" /> Langkah Pengurusan
                </p>
                <ol className="space-y-2">
                  {cert.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm font-medium text-foreground/90">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <a
                href={cert.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                {cert.officialName} <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-[2.5rem] border border-border/60 bg-card/70 p-10 text-center shadow-xl md:p-14">
        <h3 className="mb-3 text-2xl font-black text-foreground md:text-3xl">
          Bingung sertifikasi mana yang harus diurus duluan?
        </h3>
        <p className="mx-auto mb-8 max-w-xl font-medium text-muted-foreground">
          Lakukan assessment gratis—AI kami akan menganalisis produk Anda dan menyusun prioritas
          sertifikasi dalam roadmap 4 fase.
        </p>
        <Link href="/assessment" className={buttonVariants({ size: 'lg', className: 'h-14 rounded-2xl bg-primary px-10 font-black shadow-lg shadow-primary/15' })}>
          Cek Kesiapan Ekspor Saya <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
