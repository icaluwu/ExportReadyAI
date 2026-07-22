'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { supabase, getFriendlyAuthErrorMessage } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSiteUrl } from '@/lib/site-url';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const formSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  termsAccepted: z.boolean().refine(Boolean, 'Persetujuan wajib diberikan'),
});

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [lastEmail, setLastEmail] = useState<string>('');
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      termsAccepted: false,
    },
  });

  useEffect(() => {
    async function checkSession() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    }
    checkSession();
  }, [router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setLastEmail(values.email);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            account_type: 'user',
          },
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });

      if (error) {
        toast.error(getFriendlyAuthErrorMessage(error));
        setLoading(false);
      } else {
        toast.success('Pendaftaran berhasil! Silakan cek email Anda (inbox/spam) untuk verifikasi.');
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!lastEmail) {
      toast.error('Isi email terlebih dulu, lalu klik Daftar.')
      return
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: lastEmail,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
    })
    if (error) {
      toast.error(getFriendlyAuthErrorMessage(error))
      return
    }
    toast.success('Email verifikasi sudah dikirim ulang. Cek inbox/spam.')
  }

  return (
    <div className="container relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/8 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-28 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/70 dark:border-white/10 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] dark:shadow-[0_28px_60px_-38px_rgba(0,0,0,0.6)] bg-white/70 dark:bg-slate-800/80 dark:backdrop-blur-md rounded-[2rem]">
          <CardHeader className="space-y-1 text-center pb-8 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-700/30 rounded-t-[2rem]">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Buat Akun Baru</CardTitle>
            <CardDescription>Bergabung dengan komunitas ExportReady AI</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8 pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Rizdi Putra"
                            className="pl-10 h-11 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary transition-all shadow-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="nama@email.com"
                            className="pl-10 h-11 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary transition-all shadow-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="password"
                            className="pl-10 h-11 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary transition-all shadow-sm"
                            placeholder="••••••••"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          aria-label="Setujui kebijakan privasi dan syarat penggunaan"
                        />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="text-xs font-medium leading-relaxed">
                          Saya menyetujui <Link href="/kebijakan-privasi" className="font-bold text-primary underline">Kebijakan Privasi</Link> dan <Link href="/syarat-ketentuan" className="font-bold text-primary underline">Syarat & Ketentuan</Link>.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 font-black shadow-lg shadow-primary/15 bg-primary hover:bg-primary/95 transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resendVerification}
                  className="w-full h-11 font-black border-2 bg-white/60 hover:bg-white dark:bg-slate-700/40 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-600/60"
                  disabled={loading}
                >
                  Kirim Ulang Email Verifikasi
                </Button>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-black text-primary hover:underline underline-offset-4">
                Masuk Saja
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
