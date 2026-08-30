'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  BarChart3,
  Globe2,
  Map,
  ArrowRight,
  ShieldCheck,
  Users,
  Landmark,
  ChevronDown,
  MessageCircle,
  ClipboardCheck,
  FileSearch,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PricingSection } from '@/components/pricing/PricingSection';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const features = [
  {
    title: 'Export Readiness Score (0-100)',
    description:
      'Skor otomatis lengkap dengan analisis gap yang perlu diperbaiki—langsung jelas apa yang harus dibenahi.',
    Icon: BarChart3,
  },
  {
    title: '3 Negara Tujuan Terbaik',
    description:
      'Rekomendasi negara yang relevan untuk produk Anda, beserta ringkasan demand dan regulasi masuk.',
    Icon: Globe2,
  },
  {
    title: 'Roadmap 4 Fase (Bahasa Indonesia)',
    description:
      'Panduan langkah demi langkah yang bisa langsung dieksekusi tanpa konsultan berbayar.',
    Icon: Map,
  },
  {
    title: 'Konsultan AI Chat',
    description:
      'Tanya apa pun seputar ekspor—AI kami paham konteks hasil assessment Anda dan menjawab 24/7.',
    Icon: MessageCircle,
  },
  {
    title: 'Roadmap Interaktif',
    description:
      'Centang langkah yang sudah selesai dan pantau progress persiapan ekspor Anda dari dashboard.',
    Icon: ClipboardCheck,
  },
  {
    title: 'HS Code Finder AI',
    description:
      'Tidak tahu kode HS produk Anda? Deskripsikan produknya, AI kami yang carikan kandidatnya.',
    Icon: FileSearch,
  },
];

const steps = [
  {
    number: '01',
    title: 'Isi Profil',
    description: 'Lengkapi data produk, kapasitas bisnis, dan sertifikasi yang Anda miliki.',
  },
  {
    number: '02',
    title: 'Analisis AI',
    description: 'AI kami memproses data Anda dengan parameter standar ekspor internasional.',
  },
  {
    number: '03',
    title: 'Dapatkan Roadmap',
    description: 'Terima laporan detail kesiapan dan langkah strategis untuk ekspor.',
  },
];

const stats = [
  { value: '64,2 Juta', label: 'UMKM Indonesia', sub: 'Potensi pasar besar' },
  { value: 'Hanya 15%', label: 'Kontribusi Ekspor', sub: 'Peluang pertumbuhan' },
  { value: '4 Fase', label: 'Analisis Terstruktur', sub: 'Roadmap siap ditindaklanjuti' },
];

const audiences = [
  {
    Icon: Users,
    title: 'UMKM Mikro–Menengah',
    description:
      'Cocok untuk tim kecil (1–5 orang) yang ingin ekspor tapi terkendala biaya konsultasi dan kebingungan dokumen.',
  },
  {
    Icon: Landmark,
    title: 'Lembaga Pendukung Ekspor',
    description:
      'Untuk dinas/asosiasi/LPEI yang kewalahan konsultasi manual—ExportReady membantu standarisasi screening awal.',
  },
];

const faqs = [
  {
    q: 'Apakah ExportReady AI benar-benar gratis?',
    a: 'Ya. Assessment kesiapan ekspor, skor 0-100, rekomendasi negara tujuan, dan roadmap 4 fase semuanya gratis. Anda bahkan tidak wajib membuat akun untuk mencoba.',
  },
  {
    q: 'Berapa lama proses assessment-nya?',
    a: 'Sekitar 5-10 menit untuk mengisi 4 langkah formulir, lalu AI menganalisis data Anda dalam hitungan detik. Total kurang dari 30 menit sampai Anda memegang roadmap ekspor.',
  },
  {
    q: 'Apakah saya perlu membuat akun?',
    a: 'Tidak wajib. Namun dengan akun gratis, riwayat assessment tersimpan, progress roadmap bisa dicentang dan dipantau, serta Anda bisa membandingkan perkembangan skor dari waktu ke waktu.',
  },
  {
    q: 'Saya tidak tahu kode HS produk saya, bagaimana?',
    a: 'Tidak masalah. Kode HS bersifat opsional, dan kami punya fitur HS Code Finder AI yang menyarankan kandidat kode HS hanya dari nama dan deskripsi produk Anda.',
  },
  {
    q: 'Apakah hasil analisis bisa dibagikan?',
    a: 'Bisa. Anda dapat mengunduh laporan PDF atau membuat tautan publik untuk membagikan hasil assessment ke mitra, pembina UMKM, atau calon buyer.',
  },
  {
    q: 'Data saya aman tidak?',
    a: 'Data Anda tersimpan aman dan hanya digunakan untuk keperluan analisis kesiapan ekspor. Hasil assessment hanya bisa diakses oleh Anda, kecuali Anda sendiri yang memilih membagikannya.',
  },
];

const trustChips = [
  'Gratis',
  'Bahasa Indonesia',
  'Cocok UMKM 1–5 orang',
  'Akses 24/7',
  'Tanpa kartu kredit',
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="hairline-grid pointer-events-none absolute inset-0 opacity-[0.45] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="shell relative grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-24">
          <motion.div {...fadeUp}>
            <p className="eyebrow">Konsultan Ekspor Virtual 24/7</p>
            <h1 className="display-xl mt-5 text-foreground">
              Bantu UMKM Anda siap ekspor{' '}
              <span className="text-primary">kurang dari 30 menit</span>
            </h1>
            <p className="lede mt-6 max-w-xl">
              Dapatkan <span className="font-semibold text-foreground">skor kesiapan</span>,{' '}
              <span className="font-semibold text-foreground">3 negara tujuan</span>, dan{' '}
              <span className="font-semibold text-foreground">roadmap 4 fase</span>—gratis, kapan pun
              Anda butuh.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/assessment"
                className={buttonVariants({ size: 'cta-lg' })}
              >
                Mulai Analisis Gratis <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard"
                className={buttonVariants({ size: 'cta-lg', variant: 'outline' })}
              >
                Lihat Dashboard
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-2.5">
              {trustChips.map((chip) => (
                <li
                  key={chip}
                  className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground"
                >
                  <Check className="size-3.5 text-primary" aria-hidden />
                  {chip}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.12 }}
            className="relative"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-40px_hsl(222_42%_11%/0.35)] sm:p-8">
              <div className="flex items-baseline justify-between border-b border-border pb-5">
                <div>
                  <p className="eyebrow">Export Readiness Score</p>
                  <p className="font-heading mt-2 text-5xl font-bold leading-none tracking-[-0.03em] text-foreground">
                    72<span className="text-xl text-muted-foreground">/100</span>
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Siap Bersyarat
                </span>
              </div>

              <dl className="mt-5 space-y-4">
                {[
                  { label: 'Produk & Kapasitas', value: 84 },
                  { label: 'Dokumen & Sertifikasi', value: 61 },
                  { label: 'Kesiapan Pasar', value: 70 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-[0.8125rem]">
                      <dt className="font-medium text-foreground">{row.label}</dt>
                      <dd className="tabular-nums text-muted-foreground">{row.value}</dd>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-6 rule-t pt-5">
                <p className="eyebrow">Negara tujuan teratas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Jepang', 'Uni Emirat Arab', 'Australia'].map((country) => (
                    <span
                      key={country}
                      className="rounded-md border border-border px-2.5 py-1 text-[0.8125rem] font-medium text-foreground"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ilustrasi laporan—hasil aktual mengikuti data bisnis Anda.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-[var(--paper-alt)]">
        <div className="shell grid gap-px py-0 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="py-9 sm:border-l sm:border-border sm:px-8 sm:first:border-l-0 sm:first:pl-0"
            >
              <p className="font-heading text-[2rem] font-bold leading-none tracking-[-0.03em] text-primary">
                {stat.value}
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">{stat.label}</p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="border-b border-border">
        <div className="shell py-16 sm:py-20 lg:py-24">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="eyebrow">Fitur</p>
            <h2 className="display-lg mt-4 text-foreground">
              Semua yang dibutuhkan untuk langkah ekspor pertama
            </h2>
            <p className="lede mt-5">
              Dirancang khusus untuk ekosistem UMKM Indonesia agar siap bersaing di kancah
              internasional.
            </p>
          </motion.div>

          <div className="mt-12 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.article
                key={feature.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.07 }}
                className="group border-b border-border px-0 py-8 sm:px-7 sm:[&:nth-child(odd)]:pl-0 lg:px-8 lg:[&:nth-child(3n+1)]:pl-0 sm:border-l sm:[&:nth-child(odd)]:border-l-0 lg:[&:nth-child(odd)]:border-l lg:[&:nth-child(3n+1)]:border-l-0"
              >
                <feature.Icon className="size-6 text-primary" aria-hidden />
                <h3 className="font-heading mt-5 text-lg font-semibold tracking-[-0.015em] text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-[1.6] text-muted-foreground">
                  {feature.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-border bg-[var(--paper-alt)]">
        <div className="shell py-16 sm:py-20 lg:py-24">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="eyebrow">Cara kerja</p>
            <h2 className="display-lg mt-4 text-foreground">Hanya 3 langkah mudah</h2>
            <p className="lede mt-5">
              Sederhanakan kerumitan ekspor dengan bantuan asisten AI kami.
            </p>
          </motion.div>

          <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <motion.li
                key={step.number}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="border-t-2 border-primary/25 pt-6"
              >
                <span className="font-heading text-sm font-bold tracking-[0.08em] text-primary">
                  {step.number}
                </span>
                <h3 className="font-heading mt-3 text-xl font-semibold tracking-[-0.015em] text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-[1.6] text-muted-foreground">
                  {step.description}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="shell py-16 sm:py-20 lg:py-24">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="eyebrow">Untuk siapa</p>
            <h2 className="display-lg mt-4 text-foreground">
              Dua lapisan pengguna, satu kebutuhan yang sama
            </h2>
            <p className="lede mt-5">
              Pelaku UMKM dan lembaga pendukung ekspor sama-sama butuh informasi ekspor yang cepat
              dan jelas.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-0">
            {audiences.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="md:border-l md:border-border md:px-10 md:first:border-l-0 md:first:pl-0"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/12">
                  <item.Icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-heading mt-5 text-xl font-semibold tracking-[-0.015em] text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 max-w-md text-[0.9375rem] leading-[1.65] text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section id="faq" className="border-b border-border">
        <div className="shell grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
          <motion.div {...fadeUp}>
            <p className="eyebrow">FAQ</p>
            <h2 className="display-md mt-4 text-foreground">
              Pertanyaan yang sering diajukan
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-[1.65] text-muted-foreground">
              Masih ragu? Mungkin jawabannya ada di sini.
            </p>
          </motion.div>

          <div className="border-t border-border">
            {faqs.map((faq, i) => (
              <motion.details
                key={faq.q}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                className="group border-b border-border"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[0.9375rem] font-semibold text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="max-w-2xl pb-5 text-[0.9375rem] leading-[1.7] text-muted-foreground">
                  {faq.a}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="shell py-16 text-center sm:py-20 lg:py-24">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
              <ShieldCheck className="size-4" aria-hidden />
              Gratis • 24/7 • Bahasa Indonesia
            </p>
            <h2 className="display-lg mt-5 text-primary-foreground">
              Mulai dari skor kesiapan, lalu eksekusi roadmap.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-[1.65] text-primary-foreground/75 sm:text-lg">
              Isi profil produk Anda sekali, lalu dapatkan laporan yang bisa langsung dipraktikkan.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/assessment"
                className={buttonVariants({
                  size: 'cta-lg',
                  className:
                    'bg-background text-foreground hover:bg-background/90 [a]:hover:bg-background/90',
                })}
              >
                Cek Kesiapan Gratis <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className={buttonVariants({
                  size: 'cta-lg',
                  variant: 'outline',
                  className:
                    'border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:bg-transparent dark:border-primary-foreground/30 dark:hover:bg-primary-foreground/10',
                })}
              >
                Buat Akun (opsional)
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
