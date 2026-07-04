import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  History,
  ArrowRight,
  BarChart3,
  Award,
  LayoutDashboard,
  Zap,
  Plus,
  Settings,
  PenLine,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AssessmentList from './AssessmentList';

export const metadata: Metadata = {
  title: 'Profil Saya | ExportReady AI',
  robots: 'noindex',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch extended profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch assessment history
  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const isEditor = profile?.account_type === 'editor' || profile?.account_type === 'admin';
  const displayName = profile?.full_name || user.user_metadata?.full_name || 'User';
  const username = profile?.username;
  const initials = displayName[0]?.toUpperCase() || '?';

  const SOCIAL_LINKS = [
    { key: 'social_instagram', icon: Instagram, href: profile?.social_instagram, label: 'Instagram', color: 'hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20' },
    { key: 'social_twitter', icon: Twitter, href: profile?.social_twitter, label: 'X / Twitter', color: 'hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20' },
    { key: 'social_linkedin', icon: Linkedin, href: profile?.social_linkedin, label: 'LinkedIn', color: 'hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
    { key: 'social_github', icon: Github, href: profile?.social_github, label: 'GitHub', color: 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700' },
    { key: 'social_website', icon: Globe, href: profile?.social_website, label: 'Website', color: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
  ].filter(s => s.href);

  return (
    <div className="container relative mx-auto px-4 py-16 max-w-6xl min-h-screen">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* ── User Info Sidebar ── */}
        <aside className="w-full lg:w-96 space-y-6 sticky top-24">

          {/* Profile Card */}
          <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden group">
            {/* Banner */}
            <div className="h-28 bg-gradient-to-br from-slate-800 via-primary/40 to-blue-600/40 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
            </div>

            <CardContent className="pt-0 -mt-14 flex flex-col items-center pb-8 px-8">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="h-28 w-28 rounded-[1.8rem] bg-white dark:bg-slate-800 p-2 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-full w-full rounded-[1.4rem] object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-[1.4rem] bg-primary flex items-center justify-center text-white text-4xl font-black border-4 border-slate-50 shadow-inner">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Editor Badge on avatar */}
                {isEditor && (
                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white rounded-full p-1.5 shadow-lg border-2 border-white dark:border-slate-800">
                    <PenLine className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Name + Badge */}
              <div className="text-center mb-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">{displayName}</h2>
                {username && (
                  <p className="text-sm text-slate-400 font-bold tracking-tight">@{username}</p>
                )}
              </div>

              {/* Editor Badge */}
              {isEditor && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-black mb-3">
                  <PenLine className="h-3 w-3" />
                  Editor Terverifikasi
                  <Award className="h-3 w-3 ml-0.5" />
                </div>
              )}

              {/* Email */}
              <p className="text-xs text-slate-400 font-bold tracking-tight mb-4">{user.email}</p>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed mb-4 px-2">
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              {SOCIAL_LINKS.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  {SOCIAL_LINKS.map(({ key, icon: Icon, href, label, color }) => (
                    <a
                      key={key}
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 transition-all duration-200 ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="w-full space-y-3 pt-5 border-t border-slate-100/50 dark:border-slate-700/50">
                <Button variant="outline" className="w-full h-11 rounded-xl border-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm" asChild>
                  <Link href="/profile/edit" className="gap-2">
                    <Settings className="h-4 w-4 text-slate-400" /> Edit Profil
                  </Link>
                </Button>
                <Button variant="outline" className="w-full h-11 rounded-xl border-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm" asChild>
                  <Link href="/dashboard" className="gap-2">
                    <LayoutDashboard className="h-4 w-4 text-primary" /> Lihat Dashboard
                  </Link>
                </Button>
                {isEditor && (
                  <Button className="w-full h-11 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all" asChild>
                    <Link href="/editor/dashboard" className="gap-2">
                      <PenLine className="h-4 w-4" /> Editor Dashboard
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Power Tip / Editor Stats */}
          {isEditor ? (
            <div className="p-6 glass rounded-[2rem] border-amber-500/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                <PenLine className="h-24 w-24 text-amber-500" />
              </div>
              <h4 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <PenLine className="h-4 w-4" /> Tips Editor
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed italic">
                "Artikel dengan 1.500+ kata dan meta description yang tepat mendapatkan 3x lebih banyak klik organik dari Google."
              </p>
            </div>
          ) : (
            <div className="p-6 glass rounded-[2rem] border-primary/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                <Award className="h-24 w-24 text-primary" />
              </div>
              <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" /> Power Tip
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed italic">
                "Lakukan assessment setiap bulan untuk melihat progress kesiapan ekspor produk Anda."
              </p>
            </div>
          )}
        </aside>

        {/* ── Main Content: History ── */}
        <main className="flex-grow space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-4">
                <History className="h-10 w-10 text-primary" /> Riwayat Analisis
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Kelola data dan pantau pertumbuhan global Anda.</p>
            </div>
            <Button asChild className="h-14 px-8 rounded-2xl font-black bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Link href="/assessment" className="gap-2">
                <Plus className="h-5 w-5" /> New Assessment
              </Link>
            </Button>
          </div>

          {!assessments || assessments.length === 0 ? (
            <Card className="glass border-dashed border-2 border-slate-300 dark:border-slate-700 shadow-none p-20 text-center rounded-[3rem]">
              <CardContent className="flex flex-col items-center">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-8 rotate-12">
                  <BarChart3 className="h-12 w-12 text-slate-200 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-4 tracking-tight">Perjalanan Ekspor Dimulai Di Sini</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-sm mx-auto font-medium">
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
