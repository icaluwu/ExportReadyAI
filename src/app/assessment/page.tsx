'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Info,
  Loader2,
  Package,
  Factory,
  ShieldCheck,
  Target,
  ArrowRight,
  Clock,
  Save,
  Sparkles
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const formSchema = z.object({
  // Step 1
  productName: z.string().min(2, 'Nama produk minimal 2 karakter'),
  category: z.string().min(1, 'Pilih kategori produk'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  hsCode: z.string().optional(),
  
  // Step 2
  capacity: z.coerce.number().min(1, 'Kapasitas minimal 1'),
  capacityUnit: z.string().min(1, 'Pilih unit'),
  price: z.coerce.number().min(1, 'Harga minimal 1'),
  hasOnlinePresence: z.boolean().default(false),
  exportExperience: z.string().min(1, 'Pilih pengalaman ekspor'),
  
  // Step 3
  certifications: z.array(z.string()).default([]),
  meetsInternationalStandards: z.string().min(1, 'Pilih salah satu'),
  hasTrademark: z.boolean().default(false),
  
  // Step 4
  targetMarkets: z.array(z.string()).min(1, 'Pilih minimal satu negara tujuan'),
  exportMotivation: z.string().optional(),
  email: z.string().email('Email tidak valid'),
  privacyAccepted: z.boolean().refine(Boolean, 'Persetujuan kebijakan wajib diberikan'),
});

type FormValues = z.infer<typeof formSchema>;

const DRAFT_KEY = 'exportready-assessment-draft';

// Perkiraan sisa waktu pengisian per langkah
const STEP_ETA = ['Â± 5 menit', 'Â± 4 menit', 'Â± 2 menit', 'Â± 1 menit'];

export default function AssessmentPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hsLoading, setHsLoading] = useState(false);
  const [hsCandidates, setHsCandidates] = useState<Array<{ code: string; title: string; confidence: string; reason: string }>>([]);
  const [hsNote, setHsNote] = useState('');
  const router = useRouter();

  const loadingMessages = [
    "AI sedang menganalisis produk Anda...",
    "Mencari peluang pasar terbaik...",
    "Menyusun roadmap ekspor...",
    "Mengevaluasi kompetisi global...",
    "Menghitung skor kesiapan ekspor..."
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      productName: '',
      category: '',
      description: '',
      hsCode: '',
      capacity: 0,
      capacityUnit: 'pcs',
      price: 0,
      hasOnlinePresence: false,
      exportExperience: '',
      certifications: [],
      meetsInternationalStandards: '',
      hasTrademark: false,
      targetMarkets: [],
      exportMotivation: '',
      email: '',
      privacyAccepted: false,
    },
  });

  useEffect(() => {
    async function getSession() {
      try {
        if (!isSupabaseConfigured()) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          if (!form.getValues('email')) {
            form.setValue('email', session.user.email || '');
          }
        }
      } catch (err) {
        console.error('Error fetching session in assessment page:', err);
      }
    }
    getSession();
  }, [form]);

  // Restore draft (auto-saved) once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.values && draft.values.productName) {
          form.reset({ ...form.getValues(), ...draft.values });
          if (draft.step >= 1 && draft.step <= 4) setStep(draft.step);
          toast.info('Draft assessment sebelumnya dimuat kembali.');
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    setDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft whenever values or step change
  useEffect(() => {
    if (!draftLoaded) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: form.getValues(), step }));
    const sub = form.watch((values) => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, step }));
    });
    return () => sub.unsubscribe();
  }, [form, step, draftLoaded]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    // Cycle loading messages
    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.userMessage || 'Gagal mengirim assessment');
      }

      clearInterval(messageInterval);
      localStorage.removeItem(DRAFT_KEY);
      const tokenFragment = result.accessToken ? '#token=' + result.accessToken : '';
      router.push('/results/' + result.assessmentId + tokenFragment);
    } catch (error: any) {
      clearInterval(messageInterval);
      setIsSubmitting(false);
      toast.error(error.message || "Terjadi kesalahan saat memproses data. Silakan coba lagi.");
    }
  }

  async function findHsCode() {
    const isValid = await form.trigger(['productName', 'description']);
    if (!isValid) {
      toast.error('Isi dulu nama produk dan deskripsi agar AI bisa mencari kode HS.');
      return;
    }
    setHsLoading(true);
    setHsCandidates([]);
    try {
      const res = await fetch('/api/hs-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.getValues('productName'),
          category: form.getValues('category'),
          description: form.getValues('description'),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal mencari kode HS.');
      setHsCandidates(result.candidates || []);
      setHsNote(result.note || '');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mencari kode HS.');
    } finally {
      setHsLoading(false);
    }
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ['productName', 'category', 'description'];
    if (step === 2) fieldsToValidate = ['capacity', 'capacityUnit', 'price', 'exportExperience'];
    if (step === 3) fieldsToValidate = ['meetsInternationalStandards'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const categories = [
    "Makanan & Minuman",
    "Kerajinan",
    "Fashion",
    "Pertanian",
    "Elektronik",
    "Lainnya"
  ];

  const targetCountries = [
    "Malaysia", "Singapura", "Jepang", "Amerika Serikat", 
    "Australia", "Timur Tengah", "Eropa", "Tidak tahu"
  ];

  const certs = [
    "BPOM", "SNI", "Halal MUI", "ISO", "MSDS", 
    "Phytosanitary", "Certificate of Origin"
  ];

  if (isSubmitting) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md p-12 glass rounded-[3rem] shadow-2xl"
        >
          <div className="relative w-24 h-24 mx-auto">
            <Loader2 className="w-24 h-24 text-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Menganalisis Data</h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-muted-foreground font-medium italic"
              >
                "{loadingMessages[loadingMessageIndex]}"
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="text-sm text-muted-foreground/80">Mohon tunggu sebentar, AI kami sedang bekerja sangat keras untuk Anda.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container relative mx-auto px-4 py-10 max-w-4xl min-h-screen">

      <div className="mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">Cek Kesiapan Ekspor</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">Lengkapi 4 langkah sederhana untuk membuka peluang pasar dunia.</p>
        </motion.div>
      </div>

      <div className="mb-10 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-bold text-primary uppercase tracking-widest">Langkah {step} / 4</span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground/80">
            <Clock className="h-3.5 w-3.5" /> Sisa {STEP_ETA[step - 1]}
          </span>
        </div>
        <div className="relative h-3 w-full bg-card/70 rounded-full overflow-hidden shadow-inner border border-border/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(27,58,107,0.25)]"
          />
        </div>
        <div className="flex justify-between px-2 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs transition-all duration-500 ${
                i < step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40' : 
                i === step ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' : 
                'bg-card text-muted-foreground/50 border border-border'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i}
            </div>
          ))}
        </div>
        <p className="flex items-center justify-center gap-1.5 pt-4 text-xs font-medium text-muted-foreground/70">
          <Save className="h-3 w-3" /> Jawaban tersimpan otomatis di perangkat iniâ€”aman jika halaman tertutup.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border border-border/60 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)] bg-card/70 rounded-[2rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-foreground">Profil Produk</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">Informasi dasar produk ekspor Anda.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground/90">Nama Produk</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Keripik Tempe Organik" className="h-12 bg-card/80 border-border focus:border-primary transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground/90">Kategori Produk</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-card/80 border-border">
                                <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass border-none shadow-2xl rounded-2xl">
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="focus:bg-primary/5 py-3 rounded-xl">{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground/90">Deskripsi Singkat Produk</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Jelaskan keunggulan dan bahan baku utama produk Anda..." 
                              className="min-h-[120px] bg-card/80 border-border focus:border-primary transition-all shadow-sm resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hsCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold text-foreground/90">
                            Kode HS (Harmonized System)
                            <span className="text-muted-foreground/60 cursor-help" title="Kode internasional untuk klasifikasi produk. Bisa dikosongkan jika belum tahu.">
                              <Info className="h-4 w-4" />
                            </span>
                          </FormLabel>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <FormControl>
                              <Input placeholder="Opsional (Contoh: 1905.90)" className="h-12 bg-card/80 border-border focus:border-primary transition-all shadow-sm" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={findHsCode}
                              disabled={hsLoading}
                              className="h-12 shrink-0 rounded-xl border-2 font-bold gap-2 text-primary border-primary/30 hover:bg-primary/5"
                            >
                              {hsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              {hsLoading ? 'Mencari...' : 'Cari dengan AI'}
                            </Button>
                          </div>
                          {hsCandidates.length > 0 && (
                            <div className="mt-3 space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                              <p className="text-xs font-black uppercase tracking-widest text-primary">Kandidat dari AI â€” klik untuk pakai</p>
                              {hsCandidates.map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    form.setValue('hsCode', c.code, { shouldDirty: true });
                                    toast.success(`Kode HS ${c.code} dipilih.`);
                                  }}
                                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary hover:bg-card ${
                                    field.value === c.code ? 'border-primary bg-card shadow-sm' : 'border-border bg-card/60'
                                  }`}
                                >
                                  <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground shrink-0">{c.code}</span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-bold text-foreground">{c.title} <span className="text-[10px] font-black uppercase text-muted-foreground">({c.confidence})</span></span>
                                    <span className="block text-xs font-medium text-muted-foreground">{c.reason}</span>
                                  </span>
                                </button>
                              ))}
                              {hsNote && <p className="text-[11px] italic text-muted-foreground">{hsNote}</p>}
                            </div>
                          )}
                          <FormDescription className="text-muted-foreground/80 italic">Opsional, membantu AI dalam analisis regulasi pasar.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border border-border/60 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)] bg-card/70 rounded-[2rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <Factory className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-foreground">Kapasitas Bisnis</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">Informasi operasional dan finansial.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-foreground/90">Kapasitas Produksi / Bulan</FormLabel>
                            <FormControl>
                              <Input type="number" className="h-12 bg-card/80 border-border" {...field} value={field.value as any} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="capacityUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-foreground/90">Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-card/80 border-border">
                                  <SelectValue placeholder="Pilih unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="glass border-none shadow-2xl rounded-2xl">
                                <SelectItem value="pcs" className="focus:bg-primary/5 py-3 rounded-xl">Pcs / Biji</SelectItem>
                                <SelectItem value="kg" className="focus:bg-primary/5 py-3 rounded-xl">Kg</SelectItem>
                                <SelectItem value="liter" className="focus:bg-primary/5 py-3 rounded-xl">Liter</SelectItem>
                                <SelectItem value="meter" className="focus:bg-primary/5 py-3 rounded-xl">Meter</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground/90">Harga Jual per Unit (IDR)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 font-bold">Rp</span>
                              <Input 
                                type="text" 
                                className="pl-12 h-14 text-lg font-bold bg-card/80 border-border shadow-inner" 
                                placeholder="0"
                                value={field.value ? new Intl.NumberFormat('id-ID').format(Number(field.value)) : ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  field.onChange(val ? Number(val) : 0);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasOnlinePresence"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-[1.5rem] border border-border/50 bg-card/60 p-6 shadow-sm">
                          <div className="space-y-1">
                            <FormLabel className="text-lg font-bold text-foreground">Kehadiran Online</FormLabel>
                            <FormDescription className="font-medium text-muted-foreground">
                              Sudah memiliki website atau marketplace aktif.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="scale-125"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exportExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground/90">Pengalaman Ekspor Sebelumnya</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-card/80 border-border">
                                <SelectValue placeholder="Pilih pengalaman" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass border-none shadow-2xl rounded-2xl">
                              <SelectItem value="Belum pernah" className="focus:bg-primary/5 py-3 rounded-xl">Belum pernah ekspor</SelectItem>
                              <SelectItem value="Pernah mencoba" className="focus:bg-primary/5 py-3 rounded-xl">Pernah mencoba (kecil-kecilan)</SelectItem>
                              <SelectItem value="Sudah rutin ekspor" className="focus:bg-primary/5 py-3 rounded-xl">Sudah rutin ekspor resmi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border border-border/60 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)] bg-card/70 rounded-[2rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-foreground">Sertifikasi & Standar</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">Kelengkapan dokumen dan legalitas.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="certifications"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground/90 mb-4 block">Sertifikasi yang Dimiliki</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {certs.map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="certifications"
                                render={({ field }) => {
                                  const isSelected = field.value?.includes(item);
                                  return (
                                    <FormItem
                                      key={item}
                                      className={`flex flex-row items-center space-x-3 space-y-0 rounded-2xl border-2 p-4 transition-all ${
                                        isSelected 
                                          ? 'bg-primary/5 border-primary shadow-sm' 
                                          : 'bg-card/70 border-border/70 hover:bg-card hover:border-border shadow-none!'
                                      }`}
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), item])
                                              : field.onChange(
                                                  (field.value || []).filter(
                                                    (value: string) => value !== item
                                                  )
                                                )
                                          }}
                                          className={`h-5 w-5 rounded-lg transition-colors ${
                                            isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                                          }`}
                                        />
                                      </FormControl>
                                      <FormLabel className={`font-bold cursor-pointer text-sm w-full transition-colors ${
                                        isSelected ? 'text-primary' : 'text-muted-foreground'
                                      }`}>
                                        {item}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="meetsInternationalStandards"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground/90">Apakah produk memenuhi standar internasional?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-card/80 border-border">
                                <SelectValue placeholder="Pilih salah satu" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass border-none shadow-2xl rounded-2xl">
                              <SelectItem value="Ya, sudah memenuhi" className="focus:bg-primary/5 py-3 rounded-xl">Ya, sudah memenuhi</SelectItem>
                              <SelectItem value="Belum, sedang proses" className="focus:bg-primary/5 py-3 rounded-xl">Sedang dalam proses</SelectItem>
                              <SelectItem value="Tidak tahu" className="focus:bg-primary/5 py-3 rounded-xl">Kurang yakin / Belum tahu</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border border-border/60 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.55)] bg-card/70 rounded-[2rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-foreground">Target Pasar & Laporan</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">Langkah terakhir menuju pasar global.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="targetMarkets"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground/90 mb-4 block">Negara Tujuan yang Diminati</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {targetCountries.map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="targetMarkets"
                                render={({ field }) => {
                                  const isSelected = field.value?.includes(item);
                                  return (
                                    <FormItem
                                      key={item}
                                      className={`flex flex-row items-center space-x-3 space-y-0 rounded-2xl border-2 p-4 transition-all ${
                                        isSelected 
                                          ? 'bg-primary/5 border-primary shadow-sm' 
                                          : 'bg-card/70 border-border/70 hover:bg-card hover:border-border shadow-none!'
                                      }`}
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), item])
                                              : field.onChange(
                                                  (field.value || []).filter(
                                                    (value: string) => value !== item
                                                  )
                                                )
                                          }}
                                          className={`h-5 w-5 rounded-full transition-colors ${
                                            isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                                          }`}
                                        />
                                      </FormControl>
                                      <FormLabel className={`font-bold cursor-pointer w-full text-sm transition-colors ${
                                        isSelected ? 'text-primary' : 'text-muted-foreground'
                                      }`}>
                                        {item}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-foreground/90">Email untuk Menerima Laporan</FormLabel>
                          <FormControl>
                            <Input placeholder="anda@perusahaan.com" type="email" className="h-14 text-lg bg-card/80 shadow-inner border-border rounded-2xl" {...field} />
                          </FormControl>
                          <FormDescription className="text-muted-foreground/80 font-medium">Analisis akan dikirimkan ke email ini.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="privacyAccepted"
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                              aria-label="Setujui kebijakan privasi dan syarat penggunaan"
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium leading-relaxed">
                              Saya menyetujui <a className="font-bold text-primary underline" href="/kebijakan-privasi" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</a> dan <a className="font-bold text-primary underline" href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer">Syarat & Ketentuan</a>.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between pt-6 pb-20">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} className="h-14 px-8 rounded-2xl font-bold border-2 hover:bg-card">
                <ChevronLeft className="mr-2 h-5 w-5" /> Kembali
              </Button>
            ) : <div />}
            
            {step < 4 ? (
              <Button type="button" onClick={nextStep} className="h-14 px-10 bg-primary font-bold rounded-2xl shadow-xl shadow-primary/20 hover:translate-x-1 transition-transform">
                Lanjut <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button type="submit" className="h-14 px-12 bg-primary font-bold rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sedang Memproses...
                  </>
                ) : (
                  <>
                    Dapatkan Analisis AI <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
