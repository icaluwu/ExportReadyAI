'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  MessageSquare, 
  RefreshCw,
  AlertCircle,
  XCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Globe2,
  BarChart3,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const PDFExporter = dynamic(() => import('./PDFExporter'), { 
  ssr: false,
  loading: () => (
    <Button variant="outline" className="h-14 px-8 rounded-2xl font-black border-2 gap-2 opacity-50 cursor-wait">
      <RefreshCw className="h-5 w-5 animate-spin" /> ...
    </Button>
  )
});

interface AssessmentResult {
  id: string;
  product_name: string;
  readiness_score: number;
  score_breakdown: {
    certificationScore: number;
    capacityScore: number;
    priceScore: number;
    experienceScore: number;
  };
  ai_result: {
    summary: string;
    topCountries: Array<{
      country: string;
      flag: string;
      demandLevel: string;
      reason: string;
    }>;
    gaps: string[];
    roadmap: {
      fase1: string[];
      fase2: string[];
      fase3: string[];
      fase4: string[];
    };
    motivationalNote: string;
  };
}

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [data, setData] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    async function fetchData() {
      try {
        const response = await fetch(`/api/results/${id}`);
        if (response.status === 404) {
          // Keep loading if not found yet
          return;
        }
        if (!response.ok) throw new Error('Gagal mengambil data');
        
        const result = await response.json();
        if (result && result.status === 'completed') {
          setData(result);
          setLoading(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    }

    fetchData(); // Initial fetch
    
    pollInterval = setInterval(fetchData, 3000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, router]);

  if (loading) return <ResultsSkeleton />;
  if (error || !data) return <ResultsError message={error || 'Data tidak ditemukan'} />;

  const getScoreColor = (score: number) => {
    return 'text-slate-900'; // Always high contrast for readability
  };

  const getScoreStatus = (score: number) => {
    if (score < 40) return { label: 'Belum Siap', color: 'bg-red-100 text-red-700' };
    if (score < 70) return { label: 'Siap Terbatas', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Siap Ekspor', color: 'bg-emerald-100 text-emerald-700' };
  };

  const scoreStatus = getScoreStatus(data.readiness_score);

  return (
    <div className="container relative mx-auto px-4 py-12 max-w-6xl min-h-screen">
      {/* Background accents */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      {/* Header - Non-printable */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-3 bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Hasil Analisis AI Berhasil
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-1 tracking-tight italic">Export Report</h1>
          <p className="text-lg text-slate-500 font-medium italic">Strategi masuk pasar untuk <span className="text-primary font-bold not-italic underline decoration-2 underline-offset-4">{data.product_name}</span></p>
        </div>
        <div className="flex items-center gap-4">
          <PDFExporter 
            reportRef={reportRef} 
            productName={data.product_name} 
            setIsExporting={setIsExporting}
          />
          <Button 
            onClick={() => router.push('/assessment')}
            className="bg-primary hover:scale-105 transition-all h-14 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 gap-2"
          >
            <RefreshCw className="h-5 w-5" /> Analisis Ulang
          </Button>
        </div>
      </div>

      {/* Main Report Content - Printable */}
      <div ref={reportRef} className={`space-y-12 bg-white/40 p-2 md:p-6 rounded-[3rem] transition-all pdf-report ${isExporting ? 'exporting-mode' : ''}`}>
        {/* Logo/Header for PDF Only */}
        <div id="pdf-header" className="hidden flex items-center justify-between mb-12 border-b-2 border-slate-100 pb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Globe2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">ExportReady <span className="text-primary">AI</span></p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Market Intelligence</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">Laporan Kesiapan Ekspor</p>
            <p className="text-xs font-bold text-slate-400 italic">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Readiness Score Card */}
          <Card className="lg:col-span-1 border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-bold text-slate-900">Readiness Score</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="relative w-56 h-56 flex items-center justify-center mb-8">
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${
                  data.readiness_score < 40 ? 'bg-red-500' : 
                  data.readiness_score < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                
                <svg className="w-full h-full -rotate-90 transform drop-shadow-xl">
                  <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100/50" />
                  <motion.circle
                    cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={2 * Math.PI * 100}
                    initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 100 * (1 - data.readiness_score / 100) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    strokeLinecap="round"
                    className={getScoreColor(data.readiness_score)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black tracking-tighter text-slate-900 drop-shadow-sm`}>
                    {data.readiness_score}
                  </span>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Score</span>
                </div>
              </div>
              
              <div className={`w-full py-4 px-6 rounded-2xl text-center mb-8 font-black uppercase tracking-widest text-sm shadow-sm ${scoreStatus.color}`}>
                {scoreStatus.label}
              </div>
              
              <div className="relative p-6 bg-slate-50/50 rounded-3xl border border-white/50 w-full italic text-slate-600 text-sm text-center leading-relaxed font-medium">
                <span className="absolute -top-3 left-6 text-4xl text-primary/20 font-serif">&quot;</span>
                {data.ai_result.motivationalNote}
                <span className="absolute -bottom-8 right-6 text-4xl text-primary/20 font-serif rotate-180">&quot;</span>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown & Summary */}
          <Card className="lg:col-span-2 border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-bold text-slate-900">Analisis Strategis</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="relative p-8 bg-primary/5 rounded-[2.5rem] border border-primary/5 group transition-all hover:bg-primary/10">
                <div className="absolute top-6 right-8 text-primary/10 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-16 w-16" />
                </div>
                <p className="text-slate-800 leading-relaxed font-bold text-lg md:text-xl pr-12 italic">
                  {data.ai_result.summary}
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-primary" /> Parameter Penilaian
                </h4>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Sertifikasi', score: data.score_breakdown.certificationScore, max: 30 },
                        { name: 'Kapasitas', score: data.score_breakdown.capacityScore, max: 25 },
                        { name: 'Harga', score: data.score_breakdown.priceScore, max: 25 },
                        { name: 'Legalitas', score: data.score_breakdown.experienceScore, max: 20 },
                      ]}
                      layout="vertical"
                      margin={{ top: 0, right: 40, left: 100, bottom: 0 }}
                    >
                      <XAxis type="number" hide domain={[0, 30]} />
                      <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 700, fill: '#1e293b' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.4)', radius: 12 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            return (
                              <div className="glass p-4 rounded-2xl shadow-2xl border-none">
                                <p className="text-sm font-black text-slate-900 mb-1">{p.name}</p>
                                <p className="text-xs font-bold text-primary">{p.score} / {p.max}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 12, 12, 0]} barSize={32}>
                        {[{v:30,c:'#1B3A6B'},{v:25,c:'#2563EB'},{v:25,c:'#10B981'},{v:20,c:'#F59E0B'}].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.c} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Target Countries Section */}
        <div>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-50">
              <Globe2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Rekomendasi Pasar</h2>
              <p className="text-slate-500 font-medium">Potensi penetrasi tertinggi berdasarkan data produk.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.ai_result.topCountries.map((country, idx) => (
              <motion.div key={idx} whileHover={{ y: -10 }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                <Card className="h-full border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden group">
                  <div className={`h-3 w-full ${country.demandLevel === 'Tinggi' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-6xl group-hover:scale-110 group-hover:-rotate-6 transition-transform filter drop-shadow-lg">{country.flag}</div>
                      <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border-none ${
                         country.demandLevel === 'Tinggi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {country.demandLevel} Demand
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-black mb-4 text-slate-900">{country.country}</h3>
                    <p className="text-slate-500 leading-relaxed font-medium text-sm">{country.reason}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gap Analysis - Hidden in PDF */}
          <Card className={`lg:col-span-1 border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden ${isExporting ? 'hidden' : ''}`}>
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-xl"><AlertCircle className="h-5 w-5 text-red-600" /></div>
                <CardTitle className="text-xl font-bold text-slate-900">Analisis Celah</CardTitle>
              </div>
              <CardDescription className="text-slate-500 font-medium">Point kritis yang harus segera diperbaiki.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {data.ai_result.gaps.map((gap, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-100 group hover:bg-red-50 transition-colors">
                  <div className="mt-1 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <XCircle className="h-3 w-3 text-red-600" />
                  </div>
                  <span className="text-sm text-slate-800 font-bold leading-snug">{gap}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Roadmap Timeline - Hidden in PDF */}
          <Card className={`lg:col-span-2 border-none shadow-2xl glass rounded-[2.5rem] ${isExporting ? 'hidden' : ''}`}>
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-xl"><Calendar className="h-5 w-5 text-primary" /></div>
                <CardTitle className="text-xl font-bold text-slate-900">Roadmap Strategis</CardTitle>
              </div>
              <CardDescription className="text-slate-500 font-medium">Panduan langkah demi langkah menuju ekspor perdana.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-12">
              <div className="space-y-12 relative">
                <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100" />
                <RoadmapPhase title="Fase 1: Persiapan Dasar" subtitle="Bulan 0-1" items={data.ai_result.roadmap.fase1} icon={<Zap className="h-5 w-5" />} color="bg-amber-500" isExporting={isExporting} />
                <RoadmapPhase title="Fase 2: Standarisasi" subtitle="Bulan 1-3" items={data.ai_result.roadmap.fase2} icon={<ShieldCheck className="h-5 w-5" />} color="bg-primary" isExporting={isExporting} />
                <RoadmapPhase title="Fase 3: Penetrasi Pasar" subtitle="Bulan 3-6" items={data.ai_result.roadmap.fase3} icon={<TrendingUp className="h-5 w-5" />} color="bg-emerald-500" isExporting={isExporting} />
                <RoadmapPhase title="Fase 4: Scale Up" subtitle="Bulan 6+" items={data.ai_result.roadmap.fase4} icon={<Award className="h-5 w-5" />} color="bg-blue-600" isExporting={isExporting} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section - Non-printable */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 overflow-hidden relative rounded-[4rem] p-12 md:p-24 text-center shadow-[0_50px_100px_-20px_rgba(27,58,107,0.3)] bg-slate-900"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[120px] -mr-80 -mt-80 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -ml-80 -mb-80 animate-pulse delay-1000" />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-10 text-xs font-black tracking-[0.3em] text-primary uppercase bg-white/10 rounded-full border border-white/10">
            <Zap className="h-4 w-4 fill-primary" /> Akses Konsultan Ahli
          </div>
          <h3 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.05] tracking-tight italic">
            Eksekusi Roadmap Anda <span className="text-primary block md:inline not-italic">Tanpa Hambatan.</span>
          </h3>
          <p className="text-xl md:text-2xl text-slate-400 mb-14 font-medium leading-relaxed max-w-2xl mx-auto">
            Konsultan pakar kami siap membantu Anda mengurus perizinan internasional dan menghubungkan produk Anda ke jaringan pembeli global.
          </p>
          <Button 
             size="lg" 
             className="bg-primary text-white hover:bg-white hover:text-slate-900 h-24 px-16 font-black text-3xl rounded-[2.5rem] shadow-2xl shadow-primary/40 transition-all hover:scale-105 group"
             onClick={() => window.open('https://icaluwu.space/', '_blank')}
          >
            Konsultasi Gratis <ArrowRight className="ml-4 h-8 w-8 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function RoadmapPhase({ title, subtitle, items, icon, color, isExporting }: { title: string, subtitle: string, items: string[], icon: React.ReactNode, color: string, isExporting?: boolean }) {
  if (isExporting) {
    return (
      <div className="relative pl-16">
        {/* Icon Node */}
        <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} z-10`}>
          {icon}
        </div>
        
        <div className="p-8 rounded-[2rem] bg-white border-2 border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <h4 className="text-xl font-black text-slate-900">{title}</h4>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shrink-0 w-fit ${color} shadow-sm`}>
              {subtitle}
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3 text-slate-600 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      className="relative pl-16 group"
    >
      {/* Icon Node */}
      <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10 transition-transform group-hover:scale-110 z-10 ${color}`}>
        {icon}
      </div>
      
      <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm transition-all group-hover:shadow-xl group-hover:border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h4 className="text-xl font-black text-slate-900">{title}</h4>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shrink-0 w-fit ${color} opacity-90 shadow-sm`}>
            {subtitle}
          </span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-500 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}



function ResultsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="h-[400px] bg-slate-100 rounded-3xl lg:col-span-1" />
        <div className="h-[400px] bg-slate-100 rounded-3xl lg:col-span-2" />
      </div>
      <div className="h-64 bg-slate-100 rounded-3xl" />
    </div>
  );
}

function ResultsError({ message }: { message: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <AlertCircle className="h-16 w-16 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Oops! Ada Kesalahan</h2>
      <p className="text-slate-600 mb-8 max-w-md">{message}</p>
      <Button onClick={() => window.location.reload()} className="bg-primary">
        <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
      </Button>
    </div>
  );
}
