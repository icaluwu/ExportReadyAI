'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  PenLine,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{ account_type: string; full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeFn: (() => void) | undefined;

    async function getSession() {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Fetch profile for account_type and editor status
          const { data } = await supabase
            .from('profiles')
            .select('account_type, full_name')
            .eq('id', currentUser.id)
            .single();
          setProfile(data);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            if (u) {
              const { data } = await supabase
                .from('profiles')
                .select('account_type, full_name')
                .eq('id', u.id)
                .single();
              setProfile(data);
            } else {
              setProfile(null);
            }
          }
        );
        unsubscribeFn = () => subscription.unsubscribe();
      } catch (err) {
        console.error('Error fetching user session:', err);
      } finally {
        setLoading(false);
      }
    }
    getSession();

    return () => {
      if (unsubscribeFn) unsubscribeFn();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild className="hidden sm:inline-flex font-semibold">
          <Link href="/login">Masuk</Link>
        </Button>
        <Button asChild className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 font-semibold">
          <Link href="/register">Daftar Gratis</Link>
        </Button>
      </div>
    );
  }

  const isEditor = profile?.account_type === 'editor' || profile?.account_type === 'admin' || user?.email === 'teukuvaickal@export-ready-ai.vercel.app';
  const isAdmin = profile?.account_type === 'admin' || user?.email === 'teukuvaickal@export-ready-ai.vercel.app';
  const displayName = profile?.full_name || user.user_metadata?.full_name || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost' }), 'relative h-10 w-auto flex items-center gap-2 pl-2 pr-1.5 rounded-full hover:bg-muted transition-all border border-transparent hover:border-border')}>
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-background shadow-sm">
          {initials}
          {/* Editor badge dot */}
          {isEditor && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-amber-500 rounded-full border-2 border-background flex items-center justify-center">
              <PenLine className="h-1.5 w-1.5 text-white" />
            </span>
          )}
        </div>
        <div className="hidden sm:block text-left mr-1">
          <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[100px]">
            {displayName}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {profile?.account_type === 'admin' ? '✦ Admin' : isEditor ? '✦ Editor' : 'Akun UMKM'}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground mr-1" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 mt-2 p-2 border border-border shadow-2xl glass rounded-2xl" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold leading-none text-foreground">{displayName}</p>
                {profile?.account_type === 'admin' ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                ) : isEditor ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                    <PenLine className="h-2 w-2" /> Editor
                  </span>
                ) : null}
              </div>
              <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2 bg-border" />

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-primary/5 focus:text-primary py-2.5 p-0">
          <Link href="/dashboard" className="flex items-center w-full px-1.5 py-1">
            <LayoutDashboard className="mr-3 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-primary/5 focus:text-primary py-2.5 p-0">
          <Link href="/blog" className="flex items-center w-full px-1.5 py-1">
            <BookOpen className="mr-3 h-4 w-4" />
            <span>Blog</span>
          </Link>
        </DropdownMenuItem>

        {isEditor && (
          <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-amber-500/10 focus:text-amber-600 py-2.5 p-0">
            <Link href="/editor/dashboard" className="flex items-center w-full px-1.5 py-1">
              <PenLine className="mr-3 h-4 w-4 text-amber-500" />
              <span className="font-bold">Editor Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        {isAdmin && (
          <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-primary/5 focus:text-primary py-2.5 p-0">
            <Link href="/admin/dashboard" className="flex items-center w-full px-1.5 py-1">
              <Settings className="mr-3 h-4 w-4 text-primary" />
              <span className="font-bold">Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-primary/5 focus:text-primary py-2.5 p-0">
          <Link href="/profile" className="flex items-center w-full px-1.5 py-1">
            <User className="mr-3 h-4 w-4" />
            <span>Profil Saya</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-primary/5 focus:text-primary py-2.5 p-0">
          <Link href="/profile/edit" className="flex items-center w-full px-1.5 py-1">
            <Settings className="mr-3 h-4 w-4" />
            <span>Edit Profil</span>
          </Link>
        </DropdownMenuItem>

        {/* Become Editor CTA — only for non-editors */}
        {!isEditor && (
          <>
            <DropdownMenuSeparator className="my-2 bg-border" />
            <DropdownMenuItem className="rounded-xl cursor-pointer focus:bg-amber-50 dark:focus:bg-amber-900/20 py-0 p-0">
              <Link href="/editor-onboarding" className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-500/20">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg shrink-0">
                  <PenLine className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-amber-700 dark:text-amber-300">Jadi Editor Blog</p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium">Tulis & publish artikel</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="my-2 bg-border" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-lg cursor-pointer focus:bg-destructive/10 focus:text-destructive text-destructive py-2.5"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
