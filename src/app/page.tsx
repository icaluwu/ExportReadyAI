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
  Landmark
} from 'lucide-react';
import { motion } from 'framer-motion';

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-14 md:pt-28 md:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_50%_-20%,rgba(27,58,107,0.12),transparent)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-black tracking-widest text-primary uppercase bg-white/70 border border-white/50 rounded-full shadow-sm">
              <Zap className="h-3.5 w-3.5" /> Konsultan Ekspor Virtual 24/7
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-5 leading-[1.15]">
              Bantu UMKM Anda Siap Ekspor{" "}
              <span className="text-gradient">Kurang dari 30 Menit</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              Dapatkan <span className="font-black text-slate-900">skor kesiapan</span>,{" "}
              <span className="font-black text-slate-900">3 negara tujuan</span>, dan{" "}
              <span className="font-black text-slate-900">roadmap 4 fase</span>—gratis, kapan pun Anda butuh.
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
                className={buttonVariants({ size: "lg", variant: "outline", className: "h-14 px-8 text-base font-black border-2 bg-white/50 hover:bg-white" })}
              >
                Lihat Dashboard
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1">Gratis</span>
              <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1">Bahasa Indonesia</span>
              <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1">Cocok UMKM 1–5 orang</span>
              <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1">Akses 24/7</span>
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
                className="p-8 rounded-3xl bg-white/70 border border-white/50 shadow-[0_20px_40px_-25px_rgba(15,23,42,0.25)] text-center"
              >
                <div className="text-5xl font-black text-primary mb-2 leading-none">{stat.value}</div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xs text-slate-400 font-medium">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Fitur Unggulan</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
              Dirancang khusus untuk ekosistem UMKM Indonesia agar siap bersaing di kancah internasional.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-white/60 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] bg-white/70 hover:bg-white/80 transition-colors overflow-hidden group rounded-3xl">
                  <div className="h-1.5 w-full bg-primary/80" />
                  <CardContent className="pt-10 pb-12 px-8">
                    <div className="mb-7 inline-flex p-4 rounded-3xl bg-white shadow-sm border border-slate-100 transition-transform duration-300 group-hover:scale-[1.03]">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
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
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900">Hanya 3 Langkah Mudah</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium">
              Sederhanakan kerumitan ekspor dengan bantuan asisten AI cerdas kami.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center group">
                <div className="w-20 h-20 rounded-3xl bg-white/70 border border-white/60 flex items-center justify-center text-3xl font-black mb-8 group-hover:bg-primary group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">{step.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
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
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Untuk Siapa ExportReady AI?</h2>
            <p className="text-slate-600 font-medium max-w-2xl mx-auto">
              Dua lapisan pengguna—pelaku UMKM dan lembaga pendukung ekspor—dengan kebutuhan yang sama: informasi ekspor yang cepat dan jelas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border border-white/70 bg-white/70 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">UMKM Mikro–Menengah</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Cocok untuk tim kecil (1–5 orang) yang ingin ekspor tapi terkendala biaya konsultasi dan kebingungan dokumen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border border-white/70 bg-white/70 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-700">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Lembaga Pendukung Ekspor</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Untuk dinas/asosiasi/LPEI yang kewalahan konsultasi manual—ExportReady membantu standarisasi screening awal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <Card className="border border-white/60 bg-white/70 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] p-10 md:p-14 relative overflow-hidden text-center rounded-[2.5rem]">
            <div className="absolute -z-10 -top-20 -right-20 h-64 w-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-24 -left-20 h-72 w-72 bg-accent/12 rounded-full blur-3xl" />

            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-black tracking-widest text-slate-700 uppercase bg-white/70 rounded-full border border-white/60">
                <ShieldCheck className="h-4 w-4 text-primary" /> Gratis • 24/7 • Bahasa Indonesia
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-[1.12] tracking-tight text-slate-900">
                Mulai dari skor kesiapan, lalu eksekusi roadmap.
              </h2>
              <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">
                Isi profil produk Anda sekali, lalu dapatkan laporan yang bisa langsung dipraktikkan.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/95 h-14 px-10 font-black rounded-2xl shadow-lg shadow-primary/15" asChild>
                  <Link href="/assessment">Cek Kesiapan Gratis</Link>
                </Button>
                <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg", className: "h-14 px-8 font-black rounded-2xl border-2 bg-white/60 hover:bg-white" })}>
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
