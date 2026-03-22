import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { 
  History, 
  ArrowRight, 
  BarChart3,
  Award,
  LayoutDashboard,
  Zap,
  Plus,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AssessmentList from './AssessmentList';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch assessment history
  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container relative mx-auto px-4 py-16 max-w-6xl min-h-screen">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* User Info Sidebar */}
        <aside className="w-full lg:w-96 space-y-8 sticky top-24">
          <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden group">
            <div className="h-32 bg-slate-900 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent" />
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            </div>
            <CardContent className="pt-0 -mt-16 flex flex-col items-center pb-10 px-8">
              <div className="h-32 w-32 rounded-[2.5rem] bg-white p-2 shadow-2xl mb-6 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="h-full w-full rounded-[2rem] bg-primary flex items-center justify-center text-white text-5xl font-black border-4 border-slate-50 shadow-inner">
                  {user.user_metadata?.full_name?.[0] || user.email?.[0].toUpperCase()}
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">{user.user_metadata?.full_name || 'User UMKM'}</h2>
              <p className="text-sm text-slate-400 font-bold tracking-tight mb-8">{user.email}</p>
              
              <div className="w-full space-y-4 pt-6 border-t border-slate-100/50">
                <Button variant="outline" className="w-full h-11 rounded-xl border-2 font-bold text-slate-700 hover:bg-white transition-all shadow-sm" asChild>
                  <Link href="/profile/edit" className="gap-2">
                    <Settings className="h-4 w-4 text-slate-400" /> Edit Profil
                  </Link>
                </Button>
                <Button variant="outline" className="w-full h-11 rounded-xl border-2 font-bold text-slate-700 hover:bg-white transition-all shadow-sm" asChild>
                  <Link href="/dashboard" className="gap-2">
                    <LayoutDashboard className="h-4 w-4 text-primary" /> Lihat Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-8 glass rounded-[2rem] border-primary/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform">
              <Award className="h-24 w-24 text-primary" />
            </div>
            <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
               <Zap className="h-4 w-4" /> Power Tip
            </h4>
            <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
              "Lakukan assessment setiap bulan untuk melihat progress kesiapan ekspor produk Anda."
            </p>
          </div>
        </aside>

        {/* Main Content: History */}
        <main className="flex-grow space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <History className="h-10 w-10 text-primary" /> Riwayat Analisis
              </h1>
              <p className="text-slate-500 font-medium mt-1">Kelola data dan pantau pertumbuhan global Anda.</p>
            </div>
            <Button asChild className="h-14 px-8 rounded-2xl font-black bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-all">
               <Link href="/assessment" className="gap-2">
                 <Plus className="h-5 w-5" /> New Assessment
               </Link>
            </Button>
          </div>

          {!assessments || assessments.length === 0 ? (
            <Card className="glass border-dashed border-2 border-slate-300 shadow-none p-20 text-center rounded-[3rem]">
              <CardContent className="flex flex-col items-center">
                <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 rotate-12">
                  <BarChart3 className="h-12 w-12 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Perjalanan Ekspor Dimulai Di Sini</h3>
                <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
                  Lakukan penilaian pertama Anda dan temukan potensi pasar global yang menanti produk UMKM Anda.
                </p>
                <Button size="lg" className="h-16 px-12 rounded-2xl font-black text-lg bg-primary" asChild>
                  <Link href="/assessment" className="gap-3">
                    Mulai Sekarang <ArrowRight className="h-6 w-6" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AssessmentList assessments={assessments as any} />
          )}
        </main>
      </div>
    </div>
  );
}
