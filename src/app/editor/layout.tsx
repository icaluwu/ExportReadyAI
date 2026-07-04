import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { PenLine, BookOpen, LayoutDashboard, Settings, LogOut, BarChart3, Home, Users } from 'lucide-react';

export const metadata: Metadata = {
  robots: 'noindex, nofollow', // Keep editor area private
};

const NAV_ITEMS = [
  { href: '/editor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/editor/posts', label: 'Artikel Saya', icon: BookOpen },
  { href: '/editor/posts/new', label: 'Tulis Artikel', icon: PenLine },
  { href: '/editor/analytics', label: 'Analitik', icon: BarChart3 },
  { href: '/profile', label: 'Profil', icon: Users },
  { href: '/dashboard', label: 'Main Dashboard', icon: Home },
];

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if user is editor or has approved application
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, full_name, username, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: application } = await supabase
    .from('editor_applications')
    .select('status')
    .eq('user_id', user.id)
    .single();

  const isEditor = profile?.account_type === 'editor' || profile?.account_type === 'admin';
  const isApproved = application?.status === 'approved';

  if (!isEditor && !isApproved) {
    redirect('/editor-onboarding');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900 dark:bg-slate-900 text-white flex flex-col shadow-2xl hidden lg:flex">
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center">
              <PenLine className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-black text-sm text-white">ExportReady</span>
              <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest -mt-0.5">Editor Hub</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold text-sm group"
            >
              <Icon className="h-4 w-4 group-hover:text-primary transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0">
              {(profile?.full_name || user.email || 'E')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">{profile?.full_name || user.email}</p>
              <p className="text-[10px] font-bold text-amber-400">✦ Editor</p>
            </div>
            <Link href="/auth/signout" className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
              <LogOut className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
            <PenLine className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-black text-sm">Editor Hub</span>
        </Link>
        <div className="flex items-center gap-2 overflow-x-auto">
          {NAV_ITEMS.slice(0, 4).map(({ href, icon: Icon }) => (
            <Link key={href} href={href} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
