'use client';

import Link from 'next/link';
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  Globe2, 
  Map, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const features = [
    {
      title: "Export Readiness Checker",
      description: "Analisis komprehensif kapasitas bisnis, sertifikasi, dan daya saing produk Anda.",
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
    },
    {
      title: "Market Recommendation",
      description: "Dapatkan rekomendasi 3 negara tujuan ekspor terbaik berdasarkan profil produk Anda.",
      icon: <Globe2 className="h-10 w-10 text-accent" />,
    },
    {
      title: "Export Roadmap",
      description: "Panduan langkah demi langkah fase persiapan hingga scale-up pasar global.",
      icon: <Map className="h-10 w-10 text-emerald-500" />,
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
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-40 md:pb-32">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-bold tracking-widest text-primary uppercase bg-white shadow-sm border border-slate-100 rounded-full">
              <Zap className="h-3 w-3 fill-primary" /> AI-Powered Export Intelligence
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Bawa Produk Lokal ke <span className="text-gradient">Pasar Global</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
              Analisis kesiapan ekspor UMKM Indonesia dalam hitungan detik dengan bantuan AI tercanggih.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/assessment" 
                className={buttonVariants({ size: "lg", className: "h-16 px-12 text-xl font-bold shadow-2xl shadow-primary/30 bg-primary hover:scale-105 transition-transform" })}
              >
                Mulai Analisis <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
              <Link 
                href="/dashboard" 
                className={buttonVariants({ size: "lg", variant: "outline", className: "h-16 px-10 text-lg font-bold border-2 hover:bg-white/50 backdrop-blur-sm" })}
              >
                Lihat Contoh
              </Link>
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
                className="p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 text-center"
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
      <section id="features" className="py-32">
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
                <Card className="h-full border-none shadow-xl glass hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                  <div className="h-2 w-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="pt-10 pb-12 px-8">
                    <div className="mb-8 inline-flex p-4 rounded-3xl bg-white shadow-lg border border-slate-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">
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
      <section id="how-it-works" className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none -z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Hanya 3 Langkah Mudah</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
              Sederhanakan kerumitan ekspor dengan bantuan asisten AI cerdas kami.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center group">
                <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-black mb-8 group-hover:bg-primary group-hover:scale-110 transition-all duration-500 shadow-2xl">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 relative flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-5xl">
          <Card className="border-none shadow-[0_50px_100px_-20px_rgba(27,58,107,0.3)] bg-slate-900 text-white p-12 md:p-20 relative overflow-hidden text-center rounded-[3rem] group">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-700" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -ml-48 -mb-48 transition-transform group-hover:scale-110 duration-700" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tight italic">
                  Saatnya Produk Anda <span className="text-primary italic">Menyapa Dunia</span>
                </h2>
                <p className="text-xl text-slate-400 mb-12 font-medium leading-relaxed">
                  Dapatkan assessment gratis dan roadmap ekspor personal hari ini juga. Tidak ada biaya, hanya peluang besar menanti Anda.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Button size="lg" className="bg-primary text-white hover:bg-primary/90 h-16 px-12 font-black text-xl rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105" asChild>
                    <Link href="/assessment">Cek Kesiapan Gratis</Link>
                  </Button>
                  <Link href="/register" className="text-white font-bold hover:text-primary transition-colors flex items-center gap-2 group/link">
                    Daftar Member UMKM <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
