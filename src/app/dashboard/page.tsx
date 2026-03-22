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
  X
} from 'lucide-react';
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
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const [stats, setStats] = useState<UserStats>({
    totalAssessments: 0,
    avgScore: 0,
    topCountry: '-',
  });
  const [showRoadmap, setShowRoadmap] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getDashboardData() {
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
        
        // Find most frequent top country (dummy logic for now as ai_result is JSON)
        setStats({
          totalAssessments: total,
          avgScore: avg,
          topCountry: total > 0 ? 'Ekspansi Global' : '-',
        });
      }
      
      setLoading(false);
    }

    getDashboardData();
  }, [router]);

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
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Overview Ekspor</h1>
          <p className="text-lg text-slate-500 font-medium">Selamat datang kembali, <span className="text-primary font-bold">{user?.user_metadata?.full_name || user?.email}</span></p>
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
          color="bg-blue-50"
          delay={0.1}
        />
        <StatCard 
          title="Rata-rata Skor" 
          value={`${stats.avgScore}%`} 
          icon={<TrendingUp className="h-6 w-6 text-emerald-500" />} 
          color="bg-emerald-50"
          delay={0.2}
        />
        <StatCard 
          title="Status Utama" 
          value={stats.topCountry} 
          icon={<Globe2 className="h-6 w-6 text-amber-500" />} 
          color="bg-amber-50"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-900">Riwayat Terakhir</h2>
            <Link href="/profile" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Lihat Semua <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {history.length > 0 ? (
              history.slice(0, 5).map((item, idx) => (
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
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{item.product_name}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                            <span className="h-1 w-1 bg-slate-200 rounded-full" />
                            <span>{item.status === 'completed' ? 'Analisis Selesai' : 'Sedang Diproses'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Score</p>
                          <p className={`text-xl font-black ${
                            (item.readiness_score || 0) < 40 ? 'text-red-500' : 
                            (item.readiness_score || 0) < 70 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {item.readiness_score || 0}%
                          </p>
                        </div>
                        <div className="p-2 rounded-full h-10 w-10 flex items-center justify-center bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="glass border-dashed border-2 border-slate-200 shadow-none py-12 text-center rounded-[2rem]">
                <CardContent>
                  <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-4">
                    <History className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada History</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mb-6">Mulai assessment pertama Anda untuk melihat analisis detail produk Anda.</p>
                  <Button onClick={() => router.push('/assessment')} variant="outline" className="border-2 font-bold rounded-xl">Mulai Sekarang</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Links / Sidebar */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 px-2">Aksi Cepat</h2>
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
            <p className="text-slate-400 text-sm mb-6 relative z-10">Dapatkan akses ke jaringan buyer internasional dan perizinan lebih cepat.</p>
            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-12 rounded-xl relative z-10">Updgrade Sekarang</Button>
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
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Progress Roadmap Ekspor</h3>
                  <p className="text-slate-500 font-medium text-sm">Grafik kesiapan berdasarkan seluruh produk yang Anda input.</p>
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
                              <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-100">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.product_name}</p>
                                <p className="text-lg font-black text-slate-900">{payload[0].value}% Siap</p>
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
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl">
                    <History className="h-12 w-12 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">Belum ada data untuk ditampilkan</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Kesiapan</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.avgScore}%</p>
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
            <ArrowRight className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
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
        className="flex items-center gap-5 p-6 rounded-[1.5rem] bg-white border-2 border-slate-100 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer group"
      >
        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-black text-slate-900 text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-sm text-slate-500 font-bold leading-tight">{desc}</p>
        </div>
        <div className="p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
