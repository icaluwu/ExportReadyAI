'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  ChevronLeft, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setFullName(session.user.user_metadata?.full_name || '');
      setEmail(session.user.email || '');
      setLoading(false);
    }
    getUser();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates: any = {
        data: { full_name: fullName }
      };

      // Email update
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: `${window.location.origin}/profile` }
        );
        if (emailError) throw emailError;
        toast.success('Permintaan konfirmasi telah dikirim ke email baru dan lama Anda. Silakan cek kotak masuk keduanya.');
      }

      // Password update
      if (password) {
        if (password !== confirmPassword) {
          toast.error('Password tidak cocok');
          setSaving(false);
          return;
        }
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) throw passwordError;
      }

      // Metadata update (Name)
      const { error: metadataError } = await supabase.auth.updateUser(updates);
      if (metadataError) throw metadataError;

      toast.success('Profil berhasil diperbaharui');
      router.refresh();
      setTimeout(() => router.push('/profile'), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbaharui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container relative mx-auto px-4 py-16 max-w-2xl min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-8 group"
        >
          <div className="p-2 rounded-full glass group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Kembali ke Profil
        </Link>

        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Edit Profil</h1>
        <p className="text-slate-500 font-medium mb-12">Perbaharui informasi akun dan keamanan Anda.</p>

        <form onSubmit={handleUpdateProfile} className="space-y-8">
          <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden p-8 px-10">
            <CardHeader className="p-0 mb-8 px-2">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <User className="h-5 w-5 text-primary" /> Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Nama Lengkap</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-none bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-900 shadow-inner"
                    placeholder="Contoh: John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Alamat Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-none bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-900 shadow-inner"
                    placeholder="name@example.com"
                  />
                </div>
                {email !== user?.email && (
                  <div className="bg-amber-50 rounded-xl p-4 mt-4 space-y-2 border border-amber-100">
                    <p className="text-xs text-amber-600 font-bold flex items-center gap-1.5 leading-tight">
                      <AlertCircle className="h-4 w-4 shrink-0" /> PENTING: Untuk mengubah email, Anda harus mengonfirmasi link yang dikirimkan ke KEDUA email (email lama dan email baru).
                    </p>
                    <p className="text-[10px] text-amber-500 font-medium">Link akan kedaluwarsa jika tidak dikonfirmasi segera.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl glass rounded-[2.5rem] overflow-hidden p-8 px-10">
            <CardHeader className="p-0 mb-8 px-2">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" /> Keamanan Akun
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">Kosongkan jika tidak ingin mengubah password.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pass" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Password Baru</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-12 pr-12 rounded-2xl border-none bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-900 shadow-inner"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Konfirmasi Password Baru</Label>
                <div className="relative group">
                  <CheckCircle2 className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                    confirmPassword && password === confirmPassword ? 'text-emerald-500' : 'text-slate-300 group-focus-within:text-primary'
                  }`} />
                  <Input 
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-none bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-900 shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={saving}
              className="flex-grow bg-primary h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all gap-2"
            >
              {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
              Simpan Perubahan
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="h-16 px-10 rounded-2xl border-2 font-bold text-slate-600"
              onClick={() => router.push('/profile')}
            >
              Batalkan
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
