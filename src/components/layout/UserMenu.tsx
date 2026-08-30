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
    return <div className="h-7 w-7 rounded-md bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="cta" asChild className="hidden sm:inline-flex">
          <Link href="/login">Masuk</Link>
        </Button>
        <Button size="cta" asChild className="px-3.5 text-sm sm:px-5 sm:text-[0.9375rem]">
          <Link href="/register">Daftar Gratis</Link>
        </Button>
      </div>
    );
  }

  const isEditor = profile?.account_type === 'editor' || profile?.account_type === 'admin';
  const isAdmin = profile?.account_type === 'admin';
  const displayName = profile?.full_name || user.user_metadata?.full_name || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost' }), 'relative h-10 w-auto flex items-center gap-2 pl-1.5 pr-1.5 rounded-lg border border-transparent hover:border-border hover:bg-muted transition-colors')}>
        <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-[0.6875rem] font-semibold">
          {initials}
          {isEditor && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background bg-accent">
              <PenLine className="h-1.5 w-1.5 text-accent-foreground" />
            </span>
          )}
        </div>
        <div className="hidden sm:block text-left mr-1">
          <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[100px]">
            {displayName}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {profile?.account_type === 'admin' ? 'Admin' : isEditor ? 'Editor' : 'Akun UMKM'}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground mr-1" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60 mt-2 p-2 border border-border shadow-lg glass rounded-xl" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold leading-none text-foreground">{displayName}</p>
                {profile?.account_type === 'admin' ? (
                  <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary-foreground">
                    Admin
                  </span>
                ) : isEditor ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-accent-foreground">
                    <PenLine className="h-2 w-2" /> Editor
                  </span>
                ) : null}
              </div>
              <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2 bg-border" />

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-muted focus:text-foreground py-2.5 p-0">
          <Link href="/dashboard" className="flex items-center w-full px-1.5 py-1">
            <LayoutDashboard className="mr-3 h-4 w-4 text-muted-foreground" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-muted focus:text-foreground py-2.5 p-0">
          <Link href="/blog" className="flex items-center w-full px-1.5 py-1">
            <BookOpen className="mr-3 h-4 w-4 text-muted-foreground" />
            <span>Blog</span>
          </Link>
        </DropdownMenuItem>

        {isEditor && (
          <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-accent/10 focus:text-foreground py-2.5 p-0">
            <Link href="/editor/dashboard" className="flex items-center w-full px-1.5 py-1">
              <PenLine className="mr-3 h-4 w-4 text-accent" />
              <span className="font-semibold">Editor Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        {isAdmin && (
          <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-primary/8 focus:text-primary py-2.5 p-0">
            <Link href="/admin/dashboard" className="flex items-center w-full px-1.5 py-1">
              <Settings className="mr-3 h-4 w-4 text-primary" />
              <span className="font-semibold">Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-muted focus:text-foreground py-2.5 p-0">
          <Link href="/profile" className="flex items-center w-full px-1.5 py-1">
            <User className="mr-3 h-4 w-4 text-muted-foreground" />
            <span>Profil Saya</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-muted focus:text-foreground py-2.5 p-0">
          <Link href="/profile/edit" className="flex items-center w-full px-1.5 py-1">
            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
            <span>Edit Profil</span>
          </Link>
        </DropdownMenuItem>

        {!isEditor && (
          <>
            <DropdownMenuSeparator className="my-2 bg-border" />
            <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-transparent py-0 p-0">
              <Link
                href="/editor-onboarding"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-[var(--paper-alt)] px-2 py-2.5 transition-colors hover:border-accent/40"
              >
                <div className="shrink-0 rounded-md bg-accent/12 p-1.5">
                  <PenLine className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">Jadi Editor Blog</p>
                  <p className="text-[10px] text-muted-foreground">Tulis &amp; publish artikel</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
