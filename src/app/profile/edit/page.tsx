'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Save,
  Loader2,
  User,
  AtSign,
  FileText,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Globe,
  ArrowLeft,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    phoneNumber: '',
    socialInstagram: '',
    socialTwitter: '',
    socialLinkedin: '',
    socialGithub: '',
    socialWebsite: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setForm({
          fullName: profile.full_name || user.user_metadata?.full_name || '',
          username: profile.username || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatar_url || '',
          phoneNumber: profile.phone_number || '',
          socialInstagram: profile.social_instagram || '',
          socialTwitter: profile.social_twitter || '',
          socialLinkedin: profile.social_linkedin || '',
          socialGithub: profile.social_github || '',
          socialWebsite: profile.social_website || '',
        });
      } else {
        setForm(f => ({ ...f, fullName: user.user_metadata?.full_name || '' }));
      }
      setFetching(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!form.fullName.trim()) { toast.error('Nama lengkap wajib diisi.'); return; }
    if (form.username && !/^[a-z0-9_]{3,20}$/.test(form.username)) {
      toast.error('Username hanya boleh huruf kecil, angka, dan underscore (3-20 karakter).');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.fullName,
      username: form.username || null,
      bio: form.bio || null,
      avatar_url: form.avatarUrl || null,
      phone_number: form.phoneNumber || null,
      social_instagram: form.socialInstagram || null,
      social_twitter: form.socialTwitter || null,
      social_linkedin: form.socialLinkedin || null,
      social_github: form.socialGithub || null,
      social_website: form.socialWebsite || null,
    });

    setLoading(false);
    if (error) {
      if (error.message.includes('unique')) {
        toast.error('Username sudah digunakan. Pilih username lain.');
      } else {
        toast.error(error.message);
      }
      return;
    }

    setSaved(true);
    toast.success('Profil berhasil disimpan!');
    setTimeout(() => setSaved(false), 3000);
  }

  const SOCIAL_FIELDS = [
    { key: 'socialInstagram', icon: Instagram, label: 'Instagram', placeholder: 'https://instagram.com/username', color: 'text-pink-500' },
    { key: 'socialTwitter', icon: Twitter, label: 'X / Twitter', placeholder: 'https://x.com/username', color: 'text-sky-500' },
    { key: 'socialLinkedin', icon: Linkedin, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', color: 'text-blue-700' },
    { key: 'socialGithub', icon: Github, label: 'GitHub', placeholder: 'https://github.com/username', color: 'text-slate-700 dark:text-slate-300' },
    { key: 'socialWebsite', icon: Globe, label: 'Website / Portfolio', placeholder: 'https://yourwebsite.com', color: 'text-emerald-600' },
  ];

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container relative mx-auto px-4 py-12 max-w-2xl min-h-screen">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/8 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-28 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10" />

      <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-primary transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Profil
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Avatar Section */}
        <Card className="border border-white/70 dark:border-white/10 shadow-xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-md rounded-[2rem]">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" /> Foto Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-[1.4rem] overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 shadow-lg">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                ) : (
                  <span className="text-primary text-3xl font-black">{(form.fullName || '?')[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">URL Foto Profil</label>
                <Input
                  value={form.avatarUrl}
                  onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://... (URL publik gambar)"
                  className="bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Ukuran ideal: 1:1 (square), minimal 200x200px</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="border border-white/70 dark:border-white/10 shadow-xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-md rounded-[2rem]">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div>
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Nama lengkap Anda"
                  className="pl-10 h-11 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="username_anda"
                  className="pl-10 h-11 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 font-mono"
                  maxLength={20}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Hanya huruf kecil, angka, underscore. 3-20 karakter.</p>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Bio Singkat</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Ceritakan sedikit tentang Anda..."
                  className="pl-10 resize-none h-24 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600"
                  maxLength={200}
                />
              </div>
              <p className="text-right text-[10px] text-slate-300 mt-1">{form.bio.length}/200</p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="border border-white/70 dark:border-white/10 shadow-xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-md rounded-[2rem]">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Sosial Media & Links
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {SOCIAL_FIELDS.map(({ key, icon: Icon, label, placeholder, color }) => (
              <div key={key}>
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">{label}</label>
                <div className="relative">
                  <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${color}`} />
                  <Input
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="pl-10 h-11 bg-white/80 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className={`w-full h-12 font-black text-base rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
            saved
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              : 'bg-primary hover:bg-primary/95 shadow-primary/20'
          }`}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : saved ? (
            <><CheckCircle2 className="mr-2 h-5 w-5" /> Tersimpan!</>
          ) : (
            <><Save className="mr-2 h-5 w-5" /> Simpan Perubahan</>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
