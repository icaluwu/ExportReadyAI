'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  LogOut, 
  History, 
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
      <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <Link href="/login">Masuk</Link>
        </Button>
        <Button asChild className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/10">
          <Link href="/register">Daftar</Link>
        </Button>
      </div>
    );
  }

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "relative h-10 w-auto flex items-center gap-2 pl-2 pr-1 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold ring-2 ring-white shadow-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left mr-1">
          <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
            {user.user_metadata?.full_name || 'User'}
          </p>
          <p className="text-[10px] text-slate-500 leading-tight">UMKM Member</p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 mr-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 p-2 border-none shadow-2xl glass rounded-2xl" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-slate-900">{user.user_metadata?.full_name}</p>
              <p className="text-xs leading-none text-slate-500 truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2 bg-slate-100" />
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
        <DropdownMenuSeparator className="my-2 bg-slate-100" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="rounded-lg cursor-pointer focus:bg-red-50 focus:text-red-600 text-red-600 py-2.5"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
