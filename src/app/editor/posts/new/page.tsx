'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Save,
  Send,
  ArrowLeft,
  Image,
  Tag,
  AlignLeft,
  Globe,
  Loader2,
  Eye,
  Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'seo'>('write');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    categoryId: '',
    metaTitle: '',
    metaDescription: '',
    ogImageUrl: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
    });
    supabase.from('blog_categories').select('id, name, color').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, [router]);

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function handleTitleChange(val: string) {
    setForm(f => ({
      ...f,
      title: val,
      slug: f.slug || generateSlug(val),
      metaTitle: f.metaTitle || val,
    }));
  }

  async function saveDraft() {
    if (!form.title.trim()) { toast.error('Judul artikel wajib diisi.'); return; }
    setSaving(true);
    const { error } = await supabase.from('blog_posts').insert({
      author_id: user.id,
      category_id: form.categoryId || null,
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      excerpt: form.excerpt,
      content: form.content,
      meta_title: form.metaTitle || form.title,
      meta_description: form.metaDescription,
      og_image_url: form.ogImageUrl || null,
      status: 'draft',
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Draft berhasil disimpan!');
    router.push('/editor/dashboard');
  }

  async function publishPost() {
    if (!form.title.trim()) { toast.error('Judul artikel wajib diisi.'); return; }
    if (!form.content.trim() || form.content.length < 100) { toast.error('Konten artikel terlalu pendek (minimal 100 karakter).'); return; }
    if (!form.metaDescription.trim()) { toast.error('Meta description wajib diisi untuk SEO.'); return; }
    setLoading(true);
    const { error } = await supabase.from('blog_posts').insert({
      author_id: user.id,
      category_id: form.categoryId || null,
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      excerpt: form.excerpt,
      content: form.content,
      meta_title: form.metaTitle || form.title,
      meta_description: form.metaDescription,
      og_image_url: form.ogImageUrl || null,
      status: 'published',
      published_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Artikel berhasil dipublikasikan!');
    router.push('/editor/dashboard');
  }

  const metaDescLen = form.metaDescription.length;
  const titleLen = form.title.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/editor/dashboard" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-200">Artikel Baru</h1>
            <p className="text-xs text-slate-400">Tulis, sesuaikan SEO, lalu terbitkan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={saving || loading}
            className="h-9 px-4 font-black text-sm border-2 dark:border-slate-700 dark:text-slate-300"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1.5" /> Simpan Draft</>}
          </Button>
          <Button
            onClick={publishPost}
            disabled={loading || saving}
            className="h-9 px-4 font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Publish</>}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Editor */}
        <div className="space-y-4">
          {/* Title */}
          <Input
            value={form.title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Judul Artikel yang Menarik..."
            className="text-2xl font-black h-16 border-none bg-white dark:bg-slate-900 shadow-sm rounded-2xl px-6 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus-visible:ring-primary/30"
          />

          {/* Tab: Write / SEO */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-1">
            {[
              { key: 'write', label: 'Tulis Konten', icon: AlignLeft },
              { key: 'seo', label: 'Pengaturan SEO', icon: Globe },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {activeTab === 'write' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Excerpt */}
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5" /> Ringkasan (Excerpt)
                  </label>
                  <Textarea
                    value={form.excerpt}
                    onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                    placeholder="Ringkasan singkat artikel yang muncul di daftar blog..."
                    className="resize-none h-20 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    maxLength={300}
                  />
                  <p className="text-right text-[10px] text-slate-300 mt-1">{form.excerpt.length}/300</p>
                </CardContent>
              </Card>

              {/* Content */}
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                    Konten Artikel (HTML / Markdown)
                  </label>
                  <Textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="<h2>Pendahuluan</h2><p>Mulai menulis artikel Anda di sini...</p>"
                    className="resize-none min-h-[400px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><Info className="h-3 w-3" /> Mendukung HTML dan teks biasa</p>
                    <p className="text-[10px] text-slate-300">{form.content.split(/\s+/).filter(Boolean).length} kata</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'seo' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                <CardContent className="p-6 space-y-5">
                  {/* Slug */}
                  <div>
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">URL Slug</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 font-mono shrink-0">/blog/</span>
                      <Input
                        value={form.slug}
                        onChange={e => setForm(f => ({ ...f, slug: generateSlug(e.target.value) }))}
                        placeholder="url-artikel-anda"
                        className="font-mono text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Meta Title */}
                  <div>
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Meta Title</label>
                    <Input
                      value={form.metaTitle}
                      onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                      placeholder="Judul yang tampil di hasil pencarian Google..."
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      maxLength={60}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[10px] font-bold ${titleLen > 60 ? 'text-red-500' : titleLen > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {titleLen > 60 ? '⚠ Terlalu panjang' : titleLen > 50 ? '✓ Ideal' : '→ Ideal: 50-60 karakter'}
                      </p>
                      <p className="text-[10px] text-slate-300">{form.metaTitle.length}/60</p>
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                      Meta Description <span className="text-red-400">*</span>
                    </label>
                    <Textarea
                      value={form.metaDescription}
                      onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                      placeholder="Deskripsi singkat yang muncul di bawah judul di Google... (maks. 160 karakter)"
                      className="resize-none h-24 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      maxLength={160}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[10px] font-bold ${metaDescLen > 160 ? 'text-red-500' : metaDescLen > 140 ? 'text-amber-500' : metaDescLen > 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {metaDescLen > 160 ? '⚠ Terlalu panjang' : metaDescLen > 140 ? '✓ Sempurna' : '→ Ideal: 140-160 karakter'}
                      </p>
                      <p className="text-[10px] text-slate-300">{metaDescLen}/160</p>
                    </div>
                  </div>

                  {/* OG Image */}
                  <div>
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5" /> URL Gambar (OG Image)
                    </label>
                    <Input
                      value={form.ogImageUrl}
                      onChange={e => setForm(f => ({ ...f, ogImageUrl: e.target.value }))}
                      placeholder="https://... (1200x630px untuk tampilan terbaik di sosmed)"
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                    {form.ogImageUrl && (
                      <img src={form.ogImageUrl} alt="Preview" className="mt-2 rounded-xl aspect-video object-cover w-full max-h-32 border border-slate-100 dark:border-slate-700" onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                  </div>

                  {/* SERP Preview */}
                  <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Eye className="h-3 w-3" /> Preview Google</p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm leading-tight">{form.metaTitle || form.title || 'Judul Artikel Anda'}</p>
                    <p className="text-emerald-700 dark:text-emerald-400 text-[11px] font-mono mt-0.5">exportreadyai.com/blog/{form.slug || 'url-artikel'}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">{form.metaDescription || 'Meta description Anda akan muncul di sini...'}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Category */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Kategori
              </label>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setForm(f => ({ ...f, categoryId: f.categoryId === cat.id ? '' : cat.id }))}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all text-left ${
                      form.categoryId === cat.id
                        ? 'text-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    style={form.categoryId === cat.id ? { backgroundColor: cat.color } : {}}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Checklist Artikel</p>
              <div className="space-y-2">
                {[
                  { label: 'Judul diisi', ok: !!form.title },
                  { label: 'Konten > 100 kata', ok: form.content.split(/\s+/).filter(Boolean).length > 100 },
                  { label: 'Excerpt diisi', ok: !!form.excerpt },
                  { label: 'Meta description diisi', ok: !!form.metaDescription },
                  { label: 'Kategori dipilih', ok: !!form.categoryId },
                  { label: 'Gambar OG diisi', ok: !!form.ogImageUrl },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2 text-xs font-bold">
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] ${ok ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                      {ok ? '✓' : '○'}
                    </span>
                    <span className={ok ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
