'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { isSupabaseConfigured, supabase, SUPABASE_CONFIG_ERROR } from '@/lib/supabase';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const formSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [loading, setLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const callbackError = searchParams.get('error');
    if (callbackError) {
      toast.error('Gagal login. Silakan coba lagi.');
    }
  }, [searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isSupabaseConfigured()) {
      toast.error(SUPABASE_CONFIG_ERROR);
      return;
    }
    setLoading(true);
    setEmailForResend(values.email);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Login berhasil!');
      router.push('/dashboard');
      router.refresh();
    }
  }

  async function resendVerification() {
    if (!isSupabaseConfigured()) {
      toast.error(SUPABASE_CONFIG_ERROR);
      return;
    }
    if (!emailForResend) {
      toast.error('Masukkan email Anda dulu.')
      return
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailForResend,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
    })

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Email verifikasi sudah dikirim ulang. Cek inbox/spam.')
  }

  return (
    <div className="container relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/8 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-28 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/70 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] bg-white/70 rounded-[2rem]">
          <CardHeader className="space-y-1 text-center pb-8 border-b border-white/60 bg-white/40">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Selamat Datang Kembali</CardTitle>
            <CardDescription>Masuk ke akun ExportReady AI Anda</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                            className="pl-10 h-11 bg-white/80 border-slate-200 focus:border-primary transition-all shadow-sm"
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
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline underline-offset-4">
                          Lupa password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            type="password" 
                            className="pl-10 h-11 bg-white/80 border-slate-200 focus:border-primary transition-all shadow-sm"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
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
                    <>Masuk <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resendVerification}
                  className="w-full h-11 font-black border-2 bg-white/60 hover:bg-white"
                  disabled={loading}
                >
                  Kirim Ulang Email Verifikasi
                </Button>
              </form>
            </Form>
            
            <div className="mt-8 pt-6 border-t text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-black text-primary hover:underline underline-offset-4">
                Daftar Sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
