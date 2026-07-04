'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  PenLine,
  BookOpen,
  Phone,
  FileText,
  CheckCircle2,
  ArrowRight,
  X,
  AlertTriangle,
  Loader2,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Editor Application Modal ──────────────────────────────
function EditorModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [step, setStep] = useState<'disclaimer' | 'phone' | 'done'>('disclaimer');
  const [agreed, setAgreed] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (!phone || phone.length < 8) { toast.error('Nomor HP tidak valid.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000)); // simulate
    setOtpSent(true);
    setLoading(false);
    toast.success(`Kode OTP dikirim ke ${phone} (MVP: gunakan 123456)`);
  }

  async function verifyAndApply() {
    if (otp.length < 6) { toast.error('Masukkan 6 digit kode OTP.'); return; }
    const isValid = otp === '123456' || otp.length === 6;
    if (!isValid) { toast.error('Kode OTP salah.'); return; }
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({ id: userId, phone_number: phone, phone_verified: true });
      const { error } = await supabase.from('editor_applications').upsert({
        user_id: userId,
        status: 'pending',
        disclaimer_accepted: true,
        disclaimer_accepted_at: new Date().toISOString(),
        phone_number: phone,
        phone_verified: true,
      }, { onConflict: 'user_id' });
      if (error) throw error;
      setStep('done');
    } catch (e: any) {
      toast.error(e.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <PenLine className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-slate-50 text-base">Daftar sebagai Editor</h2>
              <p className="text-xs text-slate-400 font-medium">Akun Anda + hak tulis artikel blog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Pills */}
        <div className="flex items-center gap-1.5 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          {[
            { key: 'disclaimer', label: 'Disclaimer', icon: FileText },
            { key: 'phone', label: 'Verifikasi HP', icon: Phone },
            { key: 'done', label: 'Selesai', icon: CheckCircle2 },
          ].map(({ key, label, icon: Icon }, i, arr) => {
            const isActive = step === key;
            const isDone = ['disclaimer', 'phone', 'done'].indexOf(step) > i;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-black transition-all ${
                  isActive ? 'bg-amber-500 text-white' :
                  isDone ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="h-3 w-3" />{label}
                </div>
                {i < arr.length - 1 && <div className={`h-px w-4 ${isDone ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'}`} />}
              </div>
            );
          })}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ── STEP: DISCLAIMER ── */}
            {step === 'disclaimer' && (
              <motion.div key="disc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Satu akun bisa menjadi user biasa <strong>sekaligus</strong> editor blog. Tidak perlu akun berbeda.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-52 overflow-y-auto space-y-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                  <p className="font-black text-slate-700 dark:text-slate-300">Pernyataan Tanggung Jawab Penulis</p>
                  {[
                    ['Tanggung Jawab Konten', 'Setiap artikel yang Anda publish adalah sepenuhnya tanggung jawab pribadi Anda. ExportReady AI tidak bertanggung jawab atas isi konten.'],
                    ['Keaslian Konten', 'Anda menjamin konten merupakan karya asli dan tidak melanggar hak kekayaan intelektual pihak lain.'],
                    ['Konten Terlarang', 'Dilarang mempublikasikan konten SARA, hoaks, fitnah, pornografi, atau yang melanggar hukum Indonesia.'],
                    ['Moderasi', 'Tim ExportReady AI berhak menghapus konten yang tidak sesuai pedoman komunitas.'],
                    ['Sanksi', 'Pelanggaran dapat mengakibatkan penangguhan atau penghapusan akses editor secara permanen.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-2">
                      <span className="font-black text-amber-500 shrink-0">•</span>
                      <span><strong className="text-slate-700 dark:text-slate-300">{title}:</strong> {desc}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setAgreed(!agreed)}
                    className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      agreed ? 'bg-amber-500 border-amber-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-amber-400'
                    }`}
                  >
                    {agreed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Saya menyetujui dan bersedia bertanggung jawab penuh atas konten yang saya publikasikan.
                  </span>
                </label>

                <Button
                  onClick={() => { if (!agreed) { toast.error('Centang persetujuan dulu.'); return; } setStep('phone'); }}
                  className="w-full h-10 font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                >
                  Lanjut <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* ── STEP: PHONE ── */}
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Nomor HP</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+62 812 3456 7890"
                    disabled={otpSent}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  />
                </div>

                {!otpSent ? (
                  <Button onClick={sendOtp} disabled={loading} className="w-full h-10 font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Kirim OTP <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                      ✅ OTP terkirim ke <strong>{phone}</strong><br />
                      <span className="opacity-60">(MVP: gunakan kode <strong>123456</strong>)</span>
                    </div>
                    <input
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6 digit OTP"
                      maxLength={6}
                      className="w-full h-12 px-4 text-center text-xl font-black tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    />
                    <Button onClick={verifyAndApply} disabled={loading || otp.length < 6} className="w-full h-10 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verifikasi & Ajukan</>}
                    </Button>
                    <button onClick={() => { setOtpSent(false); setOtp(''); }} className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium">
                      Ubah nomor HP
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP: DONE ── */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-50 text-lg mb-1">Permohonan Dikirim!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Tim kami akan mereview dan menghubungi Anda dalam <strong>1–3 hari kerja</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-center text-xs text-slate-400 py-2">
                  <div className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Disclaimer ✓</div>
                  <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-blue-500" /> HP Terverifikasi ✓</div>
                  <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-emerald-500" /> Menunggu Admin</div>
                </div>
                <Button onClick={onClose} className="w-full h-10 font-black bg-primary hover:bg-primary/90 rounded-xl">
                  Tutup
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main UserMenu ─────────────────────────────────────────
export function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
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

      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          const u = session?.user ?? null;
          setUser(u);
          if (u) {
            const { data } = await supabase.from('profiles').select('account_type, full_name').eq('id', u.id).single();
            setProfile(data);
          } else {
            setProfile(null);
          }
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

  const isEditor = profile?.account_type === 'editor' || profile?.account_type === 'admin';
  const displayName = profile?.full_name || user.user_metadata?.full_name || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
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
              {isEditor ? '✦ Editor' : 'Akun UMKM'}
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
                  {isEditor && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                      <PenLine className="h-2 w-2" /> Editor
                    </span>
                  )}
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
              <DropdownMenuItem
                className="rounded-xl cursor-pointer focus:bg-amber-50 dark:focus:bg-amber-900/20 py-0 p-0"
                onSelect={(e) => { e.preventDefault(); setShowEditorModal(true); }}
              >
                <div className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-500/20">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg shrink-0">
                    <PenLine className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-amber-700 dark:text-amber-300">Jadi Editor Blog</p>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium">Tulis & publish artikel</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                </div>
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

      {/* Editor Application Modal */}
      <AnimatePresence>
        {showEditorModal && (
          <EditorModal
            onClose={() => setShowEditorModal(false)}
            userId={user.id}
          />
        )}
      </AnimatePresence>
    </>
  );
}
