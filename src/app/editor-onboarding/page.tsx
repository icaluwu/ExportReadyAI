'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Phone,
  CheckCircle2,
  ArrowRight,
  Loader2,
  FileText,
  AlertTriangle,
  PenLine,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const STEPS = [
  { id: 1, label: 'Disclaimer', icon: FileText },
  { id: 2, label: 'Verifikasi HP', icon: Phone },
  { id: 3, label: 'Selesai', icon: CheckCircle2 },
];

export default function EditorOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      // Pre-fill phone if already registered
      if (user.user_metadata?.phone_number) {
        setPhone(user.user_metadata.phone_number);
      }
    });
  }, [router]);

  async function handleDisclaimerAgree() {
    if (!agreed) {
      toast.error('Anda harus menyetujui disclaimer terlebih dahulu.');
      return;
    }
    setStep(2);
  }

  async function sendOtp() {
    if (!phone || phone.length < 10) {
      toast.error('Masukkan nomor HP yang valid.');
      return;
    }
    setLoading(true);
    // In production, integrate with Twilio/WhatsApp API here
    // For MVP: simulate OTP sent
    await new Promise(r => setTimeout(r, 1200));
    setOtpSent(true);
    setLoading(false);
    toast.success(`Kode OTP telah dikirim ke ${phone} (simulasi MVP)`);
  }

  async function verifyOtp() {
    if (!otp || otp.length < 4) {
      toast.error('Masukkan kode OTP yang dikirimkan.');
      return;
    }
    setLoading(true);

    // MVP: accept any 6-digit OTP as valid (replace with real verification)
    const isValid = otp === '123456' || otp.length === 6;

    if (!isValid) {
      toast.error('Kode OTP tidak valid. Coba lagi.');
      setLoading(false);
      return;
    }

    try {
      // Update profile with phone number
      await supabase.from('profiles').upsert({
        id: user.id,
        phone_number: phone,
        phone_verified: true,
      });

      // Create/update editor application
      const { error: appError } = await supabase
        .from('editor_applications')
        .upsert({
          user_id: user.id,
          status: 'pending',
          disclaimer_accepted: true,
          disclaimer_accepted_at: new Date().toISOString(),
          phone_number: phone,
          phone_verified: true,
        }, { onConflict: 'user_id' });

      if (appError) throw appError;

      setStep(3);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-lg">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <motion.div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : isDone
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                  layout
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 rounded-full transition-colors ${isDone ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: DISCLAIMER ─── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Card className="border border-white/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-[2rem]">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-2xl">
                      <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">Disclaimer Editor</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Baca & setujui sebelum melanjutkan</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-6 max-h-72 overflow-y-auto space-y-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Pernyataan Tanggung Jawab Penulis</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Dengan mendaftar sebagai Editor di platform ExportReady AI, Anda menyetujui hal-hal berikut:
                    </p>
                    <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="font-black text-amber-500 shrink-0">1.</span>
                        <span><strong className="text-slate-800 dark:text-slate-200">Tanggung Jawab Konten:</strong> Setiap artikel, tulisan, atau konten yang Anda publikasikan adalah sepenuhnya tanggung jawab pribadi Anda sebagai penulis. ExportReady AI tidak bertanggung jawab atas kebenaran, akurasi, atau dampak hukum dari konten yang Anda tulis.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black text-amber-500 shrink-0">2.</span>
                        <span><strong className="text-slate-800 dark:text-slate-200">Keaslian Konten:</strong> Anda menjamin bahwa setiap konten yang diunggah merupakan karya asli Anda dan tidak melanggar hak kekayaan intelektual pihak lain.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black text-amber-500 shrink-0">3.</span>
                        <span><strong className="text-slate-800 dark:text-slate-200">Konten Terlarang:</strong> Anda dilarang mempublikasikan konten yang mengandung SARA, hoaks, fitnah, pornografi, atau konten yang melanggar hukum Indonesia.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black text-amber-500 shrink-0">4.</span>
                        <span><strong className="text-slate-800 dark:text-slate-200">Moderasi:</strong> Tim ExportReady AI berhak meninjau, mengedit, atau menghapus konten yang dianggap tidak sesuai dengan pedoman komunitas, tanpa pemberitahuan sebelumnya.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black text-amber-500 shrink-0">5.</span>
                        <span><strong className="text-slate-800 dark:text-slate-200">Akurasi Informasi:</strong> Anda bertanggung jawab atas keakuratan informasi regulasi, hukum, atau bisnis yang Anda sampaikan dalam artikel.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black text-amber-500 shrink-0">6.</span>
                        <span><strong className="text-slate-800 dark:text-slate-200">Sanksi:</strong> Pelanggaran terhadap aturan ini dapat mengakibatkan penangguhan atau penghapusan akun editor Anda secara permanen.</span>
                      </li>
                    </ol>
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Peraturan ini berlaku sejak tanggal persetujuan dan dapat diperbarui sewaktu-waktu. Versi terbaru selalu berlaku.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group mb-6">
                    <div
                      onClick={() => setAgreed(!agreed)}
                      className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        agreed
                          ? 'bg-amber-500 border-amber-500'
                          : 'border-slate-300 dark:border-slate-600 group-hover:border-amber-400'
                      }`}
                    >
                      {agreed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Saya telah membaca, memahami, dan <strong className="text-slate-800 dark:text-slate-200">menyetujui seluruh isi disclaimer</strong> di atas. Saya bersedia bertanggung jawab penuh atas setiap konten yang saya publikasikan.
                    </span>
                  </label>

                  <Button
                    onClick={handleDisclaimerAgree}
                    disabled={!agreed}
                    className="w-full h-12 font-black bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Saya Setuju & Lanjutkan <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── STEP 2: PHONE VERIFICATION ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <Card className="border border-white/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-[2rem]">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-2xl">
                      <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">Verifikasi Nomor HP</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Konfirmasi identitas Anda</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-black text-slate-700 dark:text-slate-300 mb-2 block">Nomor HP (dengan kode negara)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+62 812 3456 7890"
                          className="pl-10 h-12 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                          disabled={otpSent}
                        />
                      </div>
                    </div>

                    {!otpSent ? (
                      <Button
                        onClick={sendOtp}
                        disabled={loading}
                        className="w-full h-12 font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-xl"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <>Kirim Kode OTP <ArrowRight className="ml-2 h-4 w-4" /></>
                        )}
                      </Button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                          ✅ Kode OTP terkirim ke <strong>{phone}</strong>. Cek SMS Anda.
                          <br /><span className="text-xs opacity-70">(MVP: gunakan kode <strong>123456</strong>)</span>
                        </div>

                        <div>
                          <label className="text-sm font-black text-slate-700 dark:text-slate-300 mb-2 block">Masukkan Kode OTP</label>
                          <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6 digit kode OTP"
                            className="h-12 text-center text-xl font-black tracking-widest bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                            maxLength={6}
                          />
                        </div>

                        <Button
                          onClick={verifyOtp}
                          disabled={loading || otp.length < 6}
                          className="w-full h-12 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-xl"
                        >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <>Verifikasi & Lanjutkan <ArrowRight className="ml-2 h-4 w-4" /></>
                          )}
                        </Button>

                        <button
                          onClick={() => { setOtpSent(false); setOtp(''); }}
                          className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
                        >
                          Ubah nomor HP
                        </button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── STEP 3: SUCCESS ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border border-white/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-2xl rounded-[2rem]">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </motion.div>

                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3">Pendaftaran Editor Berhasil!</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-2 font-medium leading-relaxed">
                    Permohonan Anda telah kami terima dan sedang dalam proses review oleh tim ExportReady AI.
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">
                    Kami akan menghubungi Anda melalui email dan nomor HP yang terdaftar dalam 1-3 hari kerja.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {[
                      { icon: ShieldCheck, label: 'Disclaimer', color: 'text-amber-500' },
                      { icon: Phone, label: 'HP Terverifikasi', color: 'text-blue-500' },
                      { icon: Star, label: 'Review Admin', color: 'text-emerald-500' },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5">
                        <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 text-center">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="w-full h-12 font-black bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
                    >
                      <PenLine className="mr-2 h-4 w-4" /> Ke Dashboard Saya
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/blog')}
                      className="w-full h-12 font-black border-2 dark:border-slate-600 dark:text-slate-300"
                    >
                      Lihat Blog
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
