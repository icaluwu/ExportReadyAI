'use client';

import Link from 'next/link';
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  Globe2, 
  Map, 
  ArrowRight,
  Zap,
  ShieldCheck,
  Users,
  Landmark,
  ChevronDown,
  MessageCircle,
  ClipboardCheck,
  FileSearch
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PricingSection } from '@/components/pricing/PricingSection';

export default function LandingPage() {
  const features = [
    {
      title: "Export Readiness Score (0-100)",
      description: "Skor otomatis lengkap dengan analisis gap yang perlu diperbaiki—langsung jelas apa yang harus dibenahi.",
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
    },
    {
      title: "3 Negara Tujuan Terbaik",
      description: "Rekomendasi negara yang relevan untuk produk Anda, beserta ringkasan demand dan regulasi masuk.",
      icon: <Globe2 className="h-10 w-10 text-emerald-600" />,
    },
    {
      title: "Roadmap 4 Fase (Bahasa Indonesia)",
      description: "Panduan langkah demi langkah yang bisa langsung dieksekusi tanpa konsultan berbayar.",
      icon: <Map className="h-10 w-10 text-amber-600" />,
    },
    {
      title: "Konsultan AI Chat",
      description: "Tanya apa pun seputar ekspor—AI kami paham konteks hasil assessment Anda dan menjawab 24/7.",
      icon: <MessageCircle className="h-10 w-10 text-sky-600" />,
    },
    {
      title: "Roadmap Interaktif",
      description: "Centang langkah yang sudah selesai dan pantau progress persiapan ekspor Anda dari dashboard.",
      icon: <ClipboardCheck className="h-10 w-10 text-violet-600" />,
    },
    {
      title: "HS Code Finder AI",
      description: "Tidak tahu kode HS produk Anda? Deskripsikan produknya, AI kami yang carikan kandidatnya.",
      icon: <FileSearch className="h-10 w-10 text-rose-600" />,
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Isi Profil",
      description: "Lengkapi data produk, kapasitas bisnis, dan sertifikasi yang Anda miliki.",
    },
    {
      number: "02",
      title: "Analisis AI",
      description: "AI kami memproses data Anda dengan parameter standar ekspor internasional.",
    },
    {
      number: "03",
      title: "Dapatkan Roadmap",
      description: "Terima laporan detail kesiapan dan langkah strategis untuk ekspor.",
    },
  ];

  const faqs = [
    {
      q: "Apakah ExportReady AI benar-benar gratis?",
      a: "Ya. Assessment kesiapan ekspor, skor 0-100, rekomendasi negara tujuan, dan roadmap 4 fase semuanya gratis. Anda bahkan tidak wajib membuat akun untuk mencoba.",
    },
    {
      q: "Berapa lama proses assessment-nya?",
      a: "Sekitar 5-10 menit untuk mengisi 4 langkah formulir, lalu AI menganalisis data Anda dalam hitungan detik. Total kurang dari 30 menit sampai Anda memegang roadmap ekspor.",
    },
    {
      q: "Apakah saya perlu membuat akun?",
      a: "Tidak wajib. Namun dengan akun gratis, riwayat assessment tersimpan, progress roadmap bisa dicentang dan dipantau, serta Anda bisa membandingkan perkembangan skor dari waktu ke waktu.",
    },
    {
      q: "Saya tidak tahu kode HS produk saya, bagaimana?",
      a: "Tidak masalah. Kode HS bersifat opsional, dan kami punya fitur HS Code Finder AI yang menyarankan kandidat kode HS hanya dari nama dan deskripsi produk Anda.",
    },
    {
      q: "Apakah hasil analisis bisa dibagikan?",
      a: "Bisa. Anda dapat mengunduh laporan PDF atau membuat tautan publik untuk membagikan hasil assessment ke mitra, pembina UMKM, atau calon buyer.",
    },
    {
      q: "Data saya aman tidak?",
      a: "Data Anda tersimpan aman dan hanya digunakan untuk keperluan analisis kesiapan ekspor. Hasil assessment hanya bisa diakses oleh Anda, kecuali Anda sendiri yang memilih membagikannya.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-14 md:pt-28 md:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_50%_-20%,rgba(27,58,107,0.12),transparent)] dark:bg-[radial-gradient(1200px_500px_at_50%_-20%,rgba(96,140,214,0.15),transparent)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-black tracking-widest text-primary uppercase bg-card/70 border border-border/50 rounded-full shadow-sm">
              <Zap className="h-3.5 w-3.5" /> Konsultan Ekspor Virtual 24/7
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-5 leading-[1.15]">
              Bantu UMKM Anda Siap Ekspor{" "}
              <span className="text-gradient">Kurang dari 30 Menit</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              Dapatkan <span className="font-black text-foreground">skor kesiapan</span>,{" "}
              <span className="font-black text-foreground">3 negara tujuan</span>, dan{" "}
              <span className="font-black text-foreground">roadmap 4 fase</span>—gratis, kapan pun Anda butuh.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/assessment" 
                className={buttonVariants({ size: "lg", className: "h-14 px-10 text-lg font-black shadow-lg shadow-primary/15 bg-primary hover:bg-primary/95" })}
              >
                Mulai Analisis Gratis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/dashboard" 
                className={buttonVariants({ size: "lg", variant: "outline", className: "h-14 px-8 text-base font-black border-2 bg-card/50 hover:bg-card" })}
              >
                Lihat Dashboard
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-muted-foreground">
              <span className="rounded-full border border-border bg-card/60 px-3 py-1">Gratis</span>
              <span className="rounded-full border border-border bg-card/60 px-3 py-1">Bahasa Indonesia</span>
              <span className="rounded-full border border-border bg-card/60 px-3 py-1">Cocok UMKM 1–5 orang</span>
              <span className="rounded-full border border-border bg-card/60 px-3 py-1">Akses 24/7</span>
              <span className="rounded-full border border-border bg-card/60 px-3 py-1">Tanpa kartu kredit</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "UMKM Indonesia", value: "64.2 Juta", sub: "Potensi pasar besar" },
              { label: "Kontribusi Ekspor", value: "Hanya 15%", sub: "Peluang pertumbuhan" },
              { label: "Akurasi AI", value: "94.8%", sub: "Berdasarkan standar global" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-card/70 border border-border/50 shadow-[0_20px_40px_-25px_rgba(15,23,42,0.25)] text-center"
              >
                <div className="text-5xl font-black text-primary mb-2 leading-none">{stat.value}</div>
                <p className="text-sm font-bold text-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground/80 font-medium">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">Fitur Unggulan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium">
              Dirancang khusus untuk ekosistem UMKM Indonesia agar siap bersaing di kancah internasional.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 3) * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-border/60 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] bg-card/70 hover:bg-card/90 transition-colors overflow-hidden group rounded-3xl">
                  <div className="h-1.5 w-full bg-primary/80" />
                  <CardContent className="pt-10 pb-12 px-8">
                    <div className="mb-7 inline-flex p-4 rounded-3xl bg-card shadow-sm border border-border transition-transform duration-300 group-hover:scale-[1.03]">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 overflow-hidden relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_400px_at_50%_0%,rgba(245,158,11,0.14),transparent)]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">Hanya 3 Langkah Mudah</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium">
              Sederhanakan kerumitan ekspor dengan bantuan asisten AI cerdas kami.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center group">
                <div className="w-20 h-20 rounded-3xl bg-card/70 border border-border/60 flex items-center justify-center text-3xl font-black mb-8 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For who */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">Untuk Siapa ExportReady AI?</h2>
            <p className="text-muted-foreground font-medium max-w-2xl mx-auto">
              Dua lapisan pengguna—pelaku UMKM dan lembaga pendukung ekspor—dengan kebutuhan yang sama: informasi ekspor yang cepat dan jelas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border border-border/70 bg-card/70 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground mb-2">UMKM Mikro–Menengah</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      Cocok untuk tim kecil (1–5 orang) yang ingin ekspor tapi terkendala biaya konsultasi dan kebingungan dokumen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border border-border/70 bg-card/70 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-700 dark:text-amber-400">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground mb-2">Lembaga Pendukung Ekspor</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      Untuk dinas/asosiasi/LPEI yang kewalahan konsultasi manual—ExportReady membantu standarisasi screening awal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-muted-foreground font-medium">
              Masih ragu? Mungkin jawabannya ada di sini.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="group rounded-2xl border border-border/70 bg-card/70 shadow-sm open:shadow-md transition-shadow"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-6 font-bold text-foreground [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-6 text-muted-foreground font-medium leading-relaxed">
                  {faq.a}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <Card className="border border-border/60 bg-card/70 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] p-10 md:p-14 relative overflow-hidden text-center rounded-[2.5rem]">
            <div className="absolute -z-10 -top-20 -right-20 h-64 w-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-24 -left-20 h-72 w-72 bg-accent/12 rounded-full blur-3xl" />

            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-black tracking-widest text-foreground/80 uppercase bg-card/70 rounded-full border border-border/60">
                <ShieldCheck className="h-4 w-4 text-primary" /> Gratis • 24/7 • Bahasa Indonesia
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-[1.12] tracking-tight text-foreground">
                Mulai dari skor kesiapan, lalu eksekusi roadmap.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 font-medium leading-relaxed">
                Isi profil produk Anda sekali, lalu dapatkan laporan yang bisa langsung dipraktikkan.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/95 h-14 px-10 font-black rounded-2xl shadow-lg shadow-primary/15" asChild>
                  <Link href="/assessment">Cek Kesiapan Gratis</Link>
                </Button>
                <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg", className: "h-14 px-8 font-black rounded-2xl border-2 bg-card/60 hover:bg-card" })}>
                  Buat Akun (opsional)
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
