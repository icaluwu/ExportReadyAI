import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Globe2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Award,
  Zap,
  ShieldCheck,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Hasil Analisis Kesiapan Ekspor (Dibagikan)',
  description: 'Laporan kesiapan ekspor yang dibagikan melalui ExportReady AI.',
  robots: { index: false },
};

interface SharedAssessment {
  id: string;
  product_name: string;
  category: string;
  readiness_score: number;
  score_breakdown: {
    certificationScore: number;
    capacityScore: number;
    priceScore: number;
    experienceScore: number;
  };
  ai_result: {
    summary: string;
    topCountries: Array<{ country: string; flag: string; demandLevel: string; reason: string }>;
    gaps: string[];
    roadmap: { fase1: string[]; fase2: string[]; fase3: string[]; fase4: string[] };
    motivationalNote: string;
  };
  target_markets: string[];
  created_at: string;
}

function getScoreStatus(score: number) {
  if (score < 40) return { label: 'Belum Siap', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' };
  if (score < 70) return { label: 'Siap Terbatas', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
  return { label: 'Siap Ekspor', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
}

const PHASES = [
  { key: 'fase1' as const, title: 'Fase 1: Persiapan Dasar', subtitle: 'Bulan 0-1', color: 'bg-amber-500', icon: Zap },
  { key: 'fase2' as const, title: 'Fase 2: Standarisasi', subtitle: 'Bulan 1-3', color: 'bg-primary', icon: ShieldCheck },
  { key: 'fase3' as const, title: 'Fase 3: Penetrasi Pasar', subtitle: 'Bulan 3-6', color: 'bg-emerald-500', icon: TrendingUp },
  { key: 'fase4' as const, title: 'Fase 4: Scale Up', subtitle: 'Bulan 6+', color: 'bg-blue-600', icon: Award },
];

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Basic UUID shape check before hitting the database
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_shared_assessment', { token });

  const assessment: SharedAssessment | undefined = Array.isArray(data) ? data[0] : data;
  if (error || !assessment) notFound();

  const status = getScoreStatus(assessment.readiness_score);

  return (
    <div className="container relative mx-auto min-h-screen max-w-5xl px-4 py-12">
      <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute -bottom-28 -left-24 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      {/* Shared banner */}
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-sm">
          <Globe2 className="h-4 w-4" /> Laporan Dibagikan — ExportReady AI
        </span>
        <h1 className="mb-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">
          Kesiapan Ekspor: {assessment.product_name}
        </h1>
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Dianalisis {new Date(assessment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="hidden sm:inline">• Kategori {assessment.category}</span>
        </p>
      </div>

      {/* Score badge */}
      <Card className="mb-8 overflow-hidden rounded-[2.5rem] border-none shadow-2xl glass">
        <CardContent className="flex flex-col items-center gap-8 p-10 sm:flex-row sm:justify-center">
          <div className="relative flex h-44 w-44 items-center justify-center">
            <svg viewBox="0 0 224 224" className="h-full w-full -rotate-90 transform drop-shadow-xl">
              <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-muted" />
              <circle
                cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="14" fill="transparent"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - assessment.readiness_score / 100)}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tracking-tighter text-foreground">{assessment.readiness_score}</span>
              <span className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Score</span>
            </div>
          </div>
          <div className="max-w-md space-y-4 text-center sm:text-left">
            <span className={`inline-block rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest shadow-sm ${status.color}`}>
              {status.label}
            </span>
            <p className="font-medium italic leading-relaxed text-muted-foreground">
              &quot;{assessment.ai_result.summary}&quot;
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top countries */}
      <div className="mb-8">
        <h2 className="mb-6 text-2xl font-black tracking-tight text-foreground">Rekomendasi Pasar</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {assessment.ai_result.topCountries.map((country, idx) => (
            <Card key={idx} className="h-full overflow-hidden rounded-[2rem] border-none shadow-xl glass">
              <div className={`h-2.5 w-full ${country.demandLevel === 'Tinggi' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-4xl drop-shadow-lg">{country.flag}</span>
                  <Badge className={`rounded-full border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    country.demandLevel === 'Tinggi'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {country.demandLevel} Demand
                  </Badge>
                </div>
                <h3 className="mb-2 text-xl font-black text-foreground">{country.country}</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">{country.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Gaps */}
        <Card className="overflow-hidden rounded-[2rem] border-none shadow-xl glass lg:col-span-1">
          <CardHeader className="p-7 pb-0">
            <div className="mb-1 flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2 dark:bg-red-950"><AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
              <CardTitle className="text-lg font-bold text-foreground">Analisis Celah</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-7">
            {assessment.ai_result.gaps.map((gap, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3 dark:border-red-950 dark:bg-red-950/30">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="text-sm font-bold leading-snug text-foreground/90">{gap}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Roadmap (read-only) */}
        <Card className="rounded-[2rem] border-none shadow-xl glass lg:col-span-2">
          <CardHeader className="p-7 pb-0">
            <CardTitle className="text-lg font-bold text-foreground">Roadmap Strategis</CardTitle>
            <CardDescription className="font-medium">Panduan 4 fase menuju ekspor perdana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-7 pt-8">
            {PHASES.map((phase) => {
              const Icon = phase.icon;
              const items = assessment.ai_result.roadmap[phase.key] || [];
              return (
                <div key={phase.key} className="relative pl-14">
                  <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg ${phase.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <h4 className="font-black text-foreground">{phase.title}</h4>
                    <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white ${phase.color}`}>
                      {phase.subtitle}
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-[2.5rem] bg-slate-900 p-10 text-center shadow-2xl md:p-14">
        <h3 className="mb-3 text-2xl font-black text-white md:text-3xl">Penasaran dengan kesiapan ekspor produk Anda?</h3>
        <p className="mx-auto mb-8 max-w-xl font-medium text-slate-400">
          Dapatkan skor kesiapan, rekomendasi negara tujuan, dan roadmap 4 fase—gratis dan kurang dari 30 menit.
        </p>
        <Link href="/assessment" className={buttonVariants({ size: 'lg', className: 'h-14 rounded-2xl bg-primary px-10 font-black shadow-lg' })}>
          Cek Kesiapan Saya <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
