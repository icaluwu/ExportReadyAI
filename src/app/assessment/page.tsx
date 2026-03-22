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
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
});

type FormValues = z.infer<typeof formSchema>;

export default function AssessmentPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
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
    },
  });

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        form.setValue('email', session.user.email || '');
      }
    }
    getSession();
  }, [form]);

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
      router.push(`/results/${result.assessmentId}`);
    } catch (error: any) {
      clearInterval(messageInterval);
      setIsSubmitting(false);
      toast.error(error.message || "Terjadi kesalahan saat memproses data. Silakan coba lagi.");
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
            <h2 className="text-2xl font-bold text-slate-900">Menganalisis Data</h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-slate-600 font-medium italic"
              >
                "{loadingMessages[loadingMessageIndex]}"
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="text-sm text-slate-400">Mohon tunggu sebentar, AI kami sedang bekerja sangat keras untuk Anda.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container relative mx-auto px-4 py-12 max-w-4xl min-h-screen">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Kesiapan Ekspor UMKM</h1>
          <p className="text-lg text-slate-500 font-medium">Lengkapi 4 langkah sederhana untuk membuka peluang pasar dunia.</p>
        </motion.div>
      </div>

      <div className="mb-12 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-sm font-bold text-primary uppercase tracking-widest">Langkah {step} / 4</span>
          <span className="text-sm font-bold text-slate-400 capitalize">{Math.round((step / 4) * 100)}% Selesai</span>
        </div>
        <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(27,58,107,0.3)]"
          />
        </div>
        <div className="flex justify-between px-2 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs transition-all duration-500 ${
                i < step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                i === step ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 
                'bg-white text-slate-300 border border-slate-100'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i}
            </div>
          ))}
        </div>
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
                <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Profil Produk</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Informasi dasar produk ekspor Anda.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-slate-700">Nama Produk</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Keripik Tempe Organik" className="h-12 bg-white/50 border-slate-200 focus:border-primary transition-all shadow-sm" {...field} />
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
                          <FormLabel className="font-bold text-slate-700">Kategori Produk</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-white/50 border-slate-200">
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
                          <FormLabel className="font-bold text-slate-700">Deskripsi Singkat Produk</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Jelaskan keunggulan dan bahan baku utama produk Anda..." 
                              className="min-h-[120px] bg-white/50 border-slate-200 focus:border-primary transition-all shadow-sm resize-none"
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
                          <FormLabel className="flex items-center gap-2 font-bold text-slate-700">
                            Kode HS (Harmonized System)
                            <span className="text-slate-300 cursor-help" title="Kode internasional untuk klasifikasi produk. Bisa dikosongkan jika belum tahu.">
                              <Info className="h-4 w-4" />
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Opsional (Contoh: 1905.90)" className="h-12 bg-white/50 border-slate-200 focus:border-primary transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormDescription className="text-slate-400 italic">Opsional, membantu AI dalam analisis regulasi pasar.</FormDescription>
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
                <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <Factory className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Kapasitas Bisnis</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Informasi operasional dan finansial.</CardDescription>
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
                            <FormLabel className="font-bold text-slate-700">Kapasitas Produksi / Bulan</FormLabel>
                            <FormControl>
                              <Input type="number" className="h-12 bg-white/50 border-slate-200" {...field} value={field.value as any} />
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
                            <FormLabel className="font-bold text-slate-700">Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-white/50 border-slate-200">
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
                          <FormLabel className="font-bold text-slate-700">Harga Jual per Unit (IDR)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                              <Input 
                                type="text" 
                                className="pl-12 h-14 text-lg font-bold bg-white/50 border-slate-200 shadow-inner" 
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
                        <FormItem className="flex items-center justify-between rounded-[1.5rem] border bg-slate-50/50 p-6 shadow-sm">
                          <div className="space-y-1">
                            <FormLabel className="text-lg font-bold text-slate-800">Kehadiran Online</FormLabel>
                            <FormDescription className="font-medium text-slate-500">
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
                          <FormLabel className="font-bold text-slate-700">Pengalaman Ekspor Sebelumnya</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-white/50 border-slate-200">
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
                <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Sertifikasi & Standar</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Kelengkapan dokumen dan legalitas.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="certifications"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-slate-700 mb-4 block">Sertifikasi yang Dimiliki</FormLabel>
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
                                          : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200 shadow-none!'
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
                                            isSelected ? 'border-primary bg-primary text-white' : 'border-slate-200'
                                          }`}
                                        />
                                      </FormControl>
                                      <FormLabel className={`font-bold cursor-pointer text-sm w-full transition-colors ${
                                        isSelected ? 'text-primary' : 'text-slate-600'
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
                          <FormLabel className="font-bold text-slate-700">Apakah produk memenuhi standar internasional?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-white/50 border-slate-200">
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
                <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-visible">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-2xl shadow-sm border border-primary/5">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Target Pasar & Laporan</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Langkah terakhir menuju pasar global.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="targetMarkets"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-slate-700 mb-4 block">Negara Tujuan yang Diminati</FormLabel>
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
                                          : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200 shadow-none!'
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
                                            isSelected ? 'border-primary bg-primary text-white' : 'border-slate-200'
                                          }`}
                                        />
                                      </FormControl>
                                      <FormLabel className={`font-bold cursor-pointer w-full text-sm transition-colors ${
                                        isSelected ? 'text-primary' : 'text-slate-600'
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
                          <FormLabel className="font-bold text-slate-700">Email untuk Menerima Laporan</FormLabel>
                          <FormControl>
                            <Input placeholder="anda@perusahaan.com" type="email" className="h-14 text-lg bg-white shadow-inner border-slate-200 rounded-2xl" {...field} />
                          </FormControl>
                          <FormDescription className="text-slate-400 font-medium">Analisis akan dikirimkan ke email ini.</FormDescription>
                          <FormMessage />
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
              <Button type="button" variant="outline" onClick={prevStep} className="h-14 px-8 rounded-2xl font-bold border-2 hover:bg-white">
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
