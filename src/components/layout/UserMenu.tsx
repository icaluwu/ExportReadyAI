'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
        }
      );

      return () => subscription.unsubscribe();
    }
    getSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
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

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "relative h-10 w-auto flex items-center gap-2 pl-2 pr-1.5 rounded-full hover:bg-muted transition-all border border-transparent hover:border-border")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-background shadow-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left mr-1">
          <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[100px]">
            {user.user_metadata?.full_name || 'User'}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">Akun UMKM</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground mr-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 p-2 border border-border shadow-2xl glass rounded-2xl" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-foreground">{user.user_metadata?.full_name}</p>
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
