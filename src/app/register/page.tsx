'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, User, ArrowRight, Phone, PenLine, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  phone: z.string().optional(),
  accountType: z.enum(['user', 'editor']),
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [lastEmail, setLastEmail] = useState<string>('');
  const [accountType, setAccountType] = useState<'user' | 'editor'>('user');
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      accountType: 'user',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setLastEmail(values.email);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          account_type: values.accountType,
          phone_number: values.phone || null,
        },
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${values.accountType === 'editor' ? '/editor-onboarding' : '/dashboard'}`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      if (values.accountType === 'editor') {
        toast.success('Akun editor berhasil dibuat! Silakan verifikasi email Anda untuk melanjutkan proses pendaftaran editor.');
      } else {
        toast.success('Pendaftaran berhasil! Silakan cek email Anda (inbox/spam) untuk verifikasi.');
      }
      router.push('/login');
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/70 dark:border-white/10 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.55)] dark:shadow-[0_28px_60px_-38px_rgba(0,0,0,0.6)] bg-white/70 dark:bg-slate-800/80 dark:backdrop-blur-md rounded-[2rem]">
          <CardHeader className="space-y-1 text-center pb-8 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-700/30 rounded-t-[2rem]">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Buat Akun Baru</CardTitle>
            <CardDescription>Bergabung dengan komunitas ExportReady AI</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-8 pb-8">

            {/* Account Type Selector */}
            <div className="mb-6">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Tipe Akun</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setAccountType('user'); form.setValue('accountType', 'user'); }}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
                    accountType === 'user'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {accountType === 'user' && (
                    <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                  )}
                  <div className={`p-2 rounded-xl ${accountType === 'user' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-black ${accountType === 'user' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>User Biasa</p>
                    <p className="text-[10px] text-slate-400 font-medium">Gunakan chatbot & assessment</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setAccountType('editor'); form.setValue('accountType', 'editor'); }}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
                    accountType === 'editor'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {accountType === 'editor' && (
                    <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-amber-500" />
                  )}
                  <div className={`p-2 rounded-xl ${accountType === 'editor' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <PenLine className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-black ${accountType === 'editor' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>Editor Blog</p>
                    <p className="text-[10px] text-slate-400 font-medium">Tulis & publish artikel</p>
                  </div>
                </button>
              </div>

              <AnimatePresence>
                {accountType === 'editor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                      <ShieldCheck className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                        Akun editor memerlukan verifikasi email + nomor HP, serta persetujuan disclaimer tanggung jawab konten.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <AnimatePresence>
                  {accountType === 'editor' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              Nomor HP
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded-full">Wajib untuk editor</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  placeholder="+62 812 3456 7890"
                                  className="pl-10 h-11 bg-white/80 dark:bg-slate-700/60 border-amber-200 dark:border-amber-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-500 transition-all shadow-sm"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className={`w-full h-11 font-black shadow-lg transition-all active:scale-[0.98] ${
                    accountType === 'editor'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-primary hover:bg-primary/95 shadow-primary/15'
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {accountType === 'editor' ? 'Daftar sebagai Editor' : 'Daftar Sekarang'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
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

            <div className="mt-6 pt-6 border-t dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
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
