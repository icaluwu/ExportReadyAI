'use client';

import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  BookOpen, 
  CheckCircle2, 
  Globe2, 
  TrendingUp, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StudyMaterialPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container relative mx-auto px-4 py-16 max-w-4xl">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-8 group"
          >
            <div className="p-2 rounded-full glass group-hover:bg-primary group-hover:text-white transition-all">
              <ChevronLeft className="h-4 w-4" />
            </div>
            Kembali ke Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">Edukasi Ekspor</span>
          </div>
          
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Panduan Ekspor untuk UMKM Indonesia
          </h1>
          
          <div className="flex items-center gap-4 mb-12 text-slate-500 font-medium pb-8 border-b border-slate-200/60">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Dipublikasi: Maret 2026
            </span>
            <span className="h-1 w-1 bg-slate-300 rounded-full" />
            <span>Waktu Baca: 8 Menit</span>
          </div>

          <article className="prose prose-slate prose-lg max-w-none space-y-12">
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <span className="text-primary/20 text-5xl font-black italic">01</span> Mengapa Ekspor Itu Penting?
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Bagi UMKM di Indonesia, pasar ekspor bukan sekadar memperluas jangkauan geografi, melainkan pintu menuju skalabilitas global. Dengan populasi dunia yang terus tumbuh, kebutuhan akan produk unik, artisanal, dan berkualitas tinggi dari Indonesia semakin meningkat. Ekspor membantu UMKM meningkatkan standar produksi, diversifikasi risiko pasar domestik, dan tentunya meningkatkan profitabilitas melalui mata uang asing.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="glass p-8 rounded-[2.5rem] border-none shadow-xl">
                <div className="p-4 bg-blue-50 rounded-2xl w-fit mb-6 text-blue-600">
                  <Globe2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-xl mb-2">Pasar Global</h3>
                <p className="text-slate-500 text-sm">Akses ke miliaran calon pembeli di seluruh dunia melalui platform digital dan pameran internasional.</p>
              </div>
              <div className="glass p-8 rounded-[2.5rem] border-none shadow-xl">
                <div className="p-4 bg-emerald-50 rounded-2xl w-fit mb-6 text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-xl mb-2">Standar Kualitas</h3>
                <p className="text-slate-500 text-sm">Mendorong UMKM untuk terus berinovasi dan meningkatkan standar produk agar kompetitif secara global.</p>
              </div>
            </div>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <span className="text-primary/20 text-5xl font-black italic">02</span> Persiapan Utama: Administratif
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Langkah pertama menuju pasar internasional adalah kepatuhan hukum. Tanpa perizinan yang tepat, produk Anda tidak akan bisa lepas landas dari pelabuhan.
              </p>
              <div className="space-y-4">
                {[
                  "NIB (Nomor Induk Berusaha) dengan akses kepabeanan",
                  "NPWP Perusahaan yang valid",
                  "Izin Edar (BPOM untuk makanan/obat, SPP-PIRT)",
                  "Sertifikasi Halal (Kritikal untuk pasar Timur Tengah & Malaysia)",
                  "COO (Certificate of Origin / Surat Keterangan Asal)"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group hover:border-primary/20 transition-all">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-1 shrink-0" />
                    <span className="text-slate-800 font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6 bg-slate-900 p-12 rounded-[3rem] text-white my-16 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
               <h2 className="text-3xl font-black mb-6 relative z-10 italic">Strategi Penentuan Harga Ekspor</h2>
               <p className="text-slate-400 mb-8 relative z-10 leading-relaxed">
                 Banyak UMKM melakukan kesalahan dengan menyamakan harga domestik dengan harga ekspor. Anda harus mempertimbangkan biaya logistik, proteksi asuransi, dan marjin agen/distributor di negara tujuan.
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">FOB</p>
                    <p className="text-sm font-bold">Free On Board</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">CIF</p>
                    <p className="text-sm font-bold">Cost, Insurance, Freight</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">EXW</p>
                    <p className="text-sm font-bold">Ex Works</p>
                 </div>
               </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <span className="text-primary/20 text-5xl font-black italic">03</span> Memilih Negara Tujuan
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                Jangan mencoba mengekspor ke semua negara sekaligus. Fokuslah pada negara yang memiliki perjanjian perdagangan bebas (FTA) dengan Indonesia untuk mendapatkan pembebasan bea masuk. Gunakan asisten AI kami untuk menganalisis kecocokan produk Anda dengan tren di negara tertentu.
              </p>
            </section>

            <div className="pt-16 mt-16 border-t border-slate-200 text-center">
               <div className="p-6 bg-primary/5 rounded-[2.5rem] max-w-2xl mx-auto">
                 <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Sudah Siap Melangkah Lebih Jauh?</h4>
                 <p className="text-slate-500 font-medium mb-8">Dapatkan konsultasi mendalam untuk strategi ekspor produk Anda bersama pakar kami.</p>
                 <Button asChild className="h-16 px-10 rounded-2xl font-black text-lg bg-primary gap-3 shadow-xl shadow-primary/20">
                    <Link href="https://icaluwu.space/" target="_blank">
                      <Zap className="h-6 w-6" /> Konsultasi Pakar Sekarang
                    </Link>
                 </Button>
               </div>
            </div>
          </article>
        </motion.div>
      </div>
    </div>
  );
}
