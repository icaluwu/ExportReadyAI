'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  History, 
  Plus, 
  TrendingUp, 
  Globe2, 
  ChevronRight,
  ArrowRight,
  Loader2,
  Calendar,
  Zap,
  X,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatPanel } from '@/components/chat/ChatPanel';
import Link from 'next/link';

interface UserStats {
  totalAssessments: number;
  avgScore: number;
  topCountry: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [roadmapDone, setRoadmapDone] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<UserStats>({
    totalAssessments: 0,
    avgScore: 0,
    topCountry: '-',
  });
  const [showRoadmap, setShowRoadmap] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getDashboardData() {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          router.push('/login');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);

        // Fetch history
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setHistory(data);
          
          // Calculate stats
          const completed = data.filter(a => a.status === 'completed');
          const total = completed.length;
          const avg = total > 0 
            ? Math.round(completed.reduce((acc, curr) => acc + (curr.readiness_score || 0), 0) / total)
            : 0;
          
          // Most frequent #1 recommended country across assessments
          const countryCount = new Map<string, number>();
          for (const a of completed) {
            const top = a.ai_result?.topCountries?.[0]?.country;
            if (top) countryCount.set(top, (countryCount.get(top) || 0) + 1);
          }
          const topCountry = [...countryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

          setStats({
            totalAssessments: total,
            avgScore: avg,
            topCountry: topCountry || '-',
          });

          // Roadmap checklist progress per assessment
          const { data: progressRows } = await supabase
            .from('roadmap_progress')
            .select('assessment_id, done')
            .eq('user_id', session.user.id)
            .eq('done', true);

          if (progressRows) {
            const doneMap: Record<string, number> = {};
            for (const row of progressRows) {
              doneMap[row.assessment_id] = (doneMap[row.assessment_id] || 0) + 1;
            }
            setRoadmapDone(doneMap);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    getDashboardData();
  }, [router]);

  // Prefill the assessment form from a previous assessment via the autosave draft
  function startReassessment(item: any) {
    const draft = {
      step: 1,
      values: {
        productName: item.product_name || '',
        category: item.category || '',
        description: item.description || '',
        hsCode: item.hs_code || '',
        capacity: item.capacity || 0,
        capacityUnit: item.capacity_unit || 'pcs',
        price: item.price || 0,
        hasOnlinePresence: !!item.has_online_presence,
        exportExperience: item.export_experience || '',
        certifications: item.certifications || [],
        meetsInternationalStandards: item.meets_international_standards || '',
        hasTrademark: !!item.has_trademark,
        targetMarkets: item.target_markets || [],
        exportMotivation: item.export_motivation || '',
        email: item.email || user?.email || '',
      },
    };
    localStorage.setItem('exportready-assessment-draft', JSON.stringify(draft));
    router.push('/assessment');
  }

  const trendData = [...history]
    .filter((a) => a.status === 'completed')
    .reverse()
    .map((a) => ({
      name: a.product_name,
      score: a.readiness_score || 0,
      date: new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container relative mx-auto px-4 py-12 max-w-6xl">
      {/* Background Orbs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/8 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-28 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">Overview Ekspor</h1>
          <p className="text-lg text-muted-foreground font-medium">Selamat datang kembali, <span className="text-primary font-bold">{user?.user_metadata?.full_name || user?.email}</span></p>
        </div>
        <Button 
          onClick={() => router.push('/assessment')}
          className="bg-primary hover:scale-105 transition-all h-14 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20 gap-2"
        >
          <Plus className="h-5 w-5" /> Mulai Assessment Baru
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          title="Total Assessment" 
          value={stats.totalAssessments.toString()} 
          icon={<History className="h-6 w-6 text-blue-500" />} 
          color="bg-blue-50 dark:bg-blue-500/10"
          delay={0.1}
        />
        <StatCard 
          title="Rata-rata Skor" 
          value={`${stats.avgScore}%`} 
          icon={<TrendingUp className="h-6 w-6 text-emerald-500" />} 
          color="bg-emerald-50 dark:bg-emerald-500/10"
          delay={0.2}
        />
        <StatCard 
          title="Top Negara Tujuan" 
          value={stats.topCountry} 
          icon={<Globe2 className="h-6 w-6 text-amber-500" />} 
          color="bg-amber-50 dark:bg-amber-500/10"
          delay={0.3}
        />
      </div>

      {/* Score trend over time */}
      {trendData.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
          <Card className="glass border-none shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <CardTitle className="text-xl font-black text-foreground">Tren Skor Kesiapan</CardTitle>
                  <CardDescription className="font-medium">Perkembangan skor dari seluruh assessment Anda.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 700 }} dy={8} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ stroke: 'var(--border)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover p-4 rounded-xl shadow-2xl border border-border">
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                              <p className="text-lg font-black text-foreground">{payload[0].value}% Siap</p>
                              <p className="text-[10px] font-bold text-muted-foreground">{payload[0].payload.date}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fill="url(#scoreTrend)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-foreground">Riwayat Terakhir</h2>
            <Link href="/profile" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Lihat Semua <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {history.length > 0 ? (
              history.slice(0, 5).map((item, idx) => {
                const roadmap = item.ai_result?.roadmap;
                const totalSteps = roadmap
                  ? ['fase1', 'fase2', 'fase3', 'fase4'].reduce((acc, f) => acc + (roadmap[f]?.length || 0), 0)
                  : 0;
                const doneSteps = Math.min(roadmapDone[item.id] || 0, totalSteps);
                return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className="glass border-none shadow-lg hover:shadow-xl transition-all cursor-pointer group rounded-2xl overflow-hidden"
                    onClick={() => router.push(`/results/${item.id}`)}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-3 bg-card rounded-xl shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground truncate">{item.product_name}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-medium">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                            <span className="h-1 w-1 bg-border rounded-full" />
                            <span>{item.status === 'completed' ? 'Analisis Selesai' : 'Sedang Diproses'}</span>
                          </div>
                          {totalSteps > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${Math.round((doneSteps / totalSteps) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                Roadmap {doneSteps}/{totalSteps}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground/80 font-black uppercase tracking-widest mb-1">Score</p>
                          <p className={`text-xl font-black ${
                            (item.readiness_score || 0) < 40 ? 'text-red-500' : 
                            (item.readiness_score || 0) < 70 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {item.readiness_score || 0}%
                          </p>
                        </div>
                        <button
                          type="button"
                          title="Assessment ulang produk ini (form terisi otomatis)"
                          onClick={(e) => {
                            e.stopPropagation();
                            startReassessment(item);
                          }}
                          className="p-2 rounded-full h-10 w-10 flex items-center justify-center bg-muted hover:bg-amber-500 hover:text-white transition-all"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <div className="p-2 rounded-full h-10 w-10 flex items-center justify-center bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                );
              })
            ) : (
              <Card className="glass border-dashed border-2 border-border shadow-none py-10 text-center rounded-[2rem]">
                <CardContent>
                  <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-2">Mulai Perjalanan Ekspor Anda</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    Dalam ± 10 menit, Anda akan tahu skor kesiapan ekspor produk Anda, negara tujuan terbaik, dan roadmap langkah demi langkah.
                  </p>
                  <div className="flex flex-col items-center gap-4 mb-6 text-sm font-medium text-muted-foreground">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full bg-card border border-border px-3 py-1">1. Isi profil produk</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="rounded-full bg-card border border-border px-3 py-1">2. AI menganalisis</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="rounded-full bg-card border border-border px-3 py-1">3. Eksekusi roadmap</span>
                    </div>
                  </div>
                  <Button onClick={() => router.push('/assessment')} className="bg-primary font-bold rounded-xl h-12 px-8 shadow-lg shadow-primary/20">
                    Mulai Assessment Pertama <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Links / Sidebar */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-foreground px-2">Aksi Cepat</h2>
          <div className="grid grid-cols-1 gap-4">
            <QuickLink 
              title="Konsultasi Pakar" 
              desc="Bicara dengan ahli ekspor kami" 
              icon={<Zap className="h-5 w-5 text-primary" />} 
              delay={0.4}
              onClick={() => window.open('https://icaluwu.space/', '_blank')}
            />
            <Link href="/materi-belajar" className="block">
              <QuickLink 
                title="Materi Belajar" 
                desc="Panduan ekspor untuk UMKM" 
                icon={<Globe2 className="h-5 w-5 text-indigo-500" />} 
                delay={0.5}
              />
            </Link>
            <QuickLink 
              title="Cek Roadmap" 
              desc="Lihat progress persiapan Anda" 
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} 
              delay={0.6}
              onClick={() => setShowRoadmap(true)}
            />
          </div>
          
          <Card className="bg-slate-900 text-white border-none rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
            <h3 className="text-xl font-bold mb-3 relative z-10">ExportReady <span className="text-primary font-black italic">PRO</span></h3>
            <p className="text-muted-foreground/80 text-sm mb-6 relative z-10">Dapatkan akses ke roadmap lengkap, unduh PDF, dan rekomendasi pasar AI.</p>
            <Button asChild className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-12 rounded-xl relative z-10">
              <Link href="/#pricing">Buka Fitur Lengkap</Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Roadmap Modal */}
      <AnimatePresence>
        {showRoadmap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRoadmap(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass border-none shadow-2xl rounded-[2.5rem] overflow-hidden p-8 sm:p-12"
            >
              <button 
                onClick={() => setShowRoadmap(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-6 w-6 text-muted-foreground/80" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Progress Roadmap Ekspor</h3>
                  <p className="text-muted-foreground font-medium text-sm">Grafik kesiapan berdasarkan seluruh produk yang Anda input.</p>
                </div>
              </div>

              <div className="h-[300px] w-full mb-8">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...history].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="product_name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                        dy={10}
                        hide={history.length > 5}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                        dx={-10}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover p-4 rounded-xl shadow-2xl border border-border">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">{payload[0].payload.product_name}</p>
                                <p className="text-lg font-black text-foreground">{payload[0].value}% Siap</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="readiness_score" 
                        radius={[8, 8, 8, 8]}
                        barSize={40}
                      >
                        {history.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.readiness_score < 40 ? '#ef4444' : 
                              entry.readiness_score < 70 ? '#f59e0b' : '#10b981'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted rounded-3xl">
                    <History className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground/80 font-bold">Belum ada data untuk ditampilkan</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-muted rounded-3xl border border-border">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-black text-muted-foreground/80 uppercase tracking-widest mb-1">Rata-rata Kesiapan</p>
                  <p className="text-3xl font-black text-foreground tracking-tight">{stats.avgScore}%</p>
                </div>
                <Button 
                  onClick={() => router.push('/assessment')}
                  className="w-full sm:w-auto bg-primary h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  Tambah Produk Lagi
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chat Consultant - aware of the latest assessment */}
      <ChatPanel assessmentId={history[0]?.id} />
    </div>
  );
}

function StatCard({ title, value, icon, color, delay }: { title: string, value: string, icon: React.ReactNode, color: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className="glass border-none shadow-xl rounded-[2rem] overflow-hidden group hover:translate-y-[-4px] transition-all">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-4 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm font-black text-muted-foreground/80 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-4xl font-black text-foreground tracking-tight">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickLink({ title, desc, icon, delay, onClick }: { title: string, desc: string, icon: React.ReactNode, delay: number, onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div 
        onClick={onClick}
        className="flex items-center gap-5 p-6 rounded-[1.5rem] bg-card border-2 border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer group"
      >
        <div className="p-4 bg-muted rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-black text-foreground text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-sm text-muted-foreground font-bold leading-tight">{desc}</p>
        </div>
        <div className="p-2 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
