'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Send, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
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

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    categoryId: '',
    metaTitle: '',
    metaDescription: '',
    ogImageUrl: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [{ data: post }, { data: cats }] = await Promise.all([
        supabase.from('blog_posts').select('*').eq('id', postId).eq('author_id', user.id).single(),
        supabase.from('blog_categories').select('id, name, color'),
      ]);

      if (!post) { toast.error('Artikel tidak ditemukan.'); router.push('/editor/dashboard'); return; }
      if (cats) setCategories(cats);

      setForm({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        categoryId: post.category_id || '',
        metaTitle: post.meta_title || '',
        metaDescription: post.meta_description || '',
        ogImageUrl: post.og_image_url || '',
        status: post.status || 'draft',
      });
      setFetching(false);
    }
    load();
  }, [postId, router]);

  function generateSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }

  async function saveChanges(newStatus?: 'draft' | 'published') {
    setLoading(true);
    const updates: any = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      excerpt: form.excerpt,
      content: form.content,
      category_id: form.categoryId || null,
      meta_title: form.metaTitle || form.title,
      meta_description: form.metaDescription,
      og_image_url: form.ogImageUrl || null,
      status: newStatus || form.status,
    };
    if (newStatus === 'published' && form.status !== 'published') {
      updates.published_at = new Date().toISOString();
    }

    const { error } = await supabase.from('blog_posts').update(updates).eq('id', postId);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(newStatus === 'published' ? 'Artikel berhasil dipublikasikan!' : 'Perubahan disimpan!');
    router.push('/editor/dashboard');
  }

  async function deletePost() {
    if (!confirm('Yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setLoading(true);
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Artikel berhasil dihapus.');
    router.push('/editor/dashboard');
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/editor/dashboard" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-200">Edit Artikel</h1>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{form.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => saveChanges('draft')}
            disabled={loading}
            className="h-9 px-4 font-black text-sm border-2 dark:border-slate-700 dark:text-slate-300"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1.5" /> Simpan</>}
          </Button>
          <Button
            onClick={() => saveChanges('published')}
            disabled={loading}
            className="h-9 px-4 font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Publish</>}
          </Button>
          <Button
            variant="ghost"
            onClick={deletePost}
            disabled={loading}
            className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="text-2xl font-black h-16 border-none bg-white dark:bg-slate-900 shadow-sm rounded-2xl px-6"
          />

          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Slug URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 font-mono shrink-0">/blog/</span>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: generateSlug(e.target.value) }))} className="font-mono text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Ringkasan</label>
                <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} className="resize-none h-20 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" maxLength={300} />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Konten</label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="resize-none min-h-[350px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Meta Description</label>
                <Textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} className="resize-none h-20 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" maxLength={160} />
                <p className="text-right text-[10px] text-slate-300 mt-1">{form.metaDescription.length}/160</p>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">URL Gambar (OG)</label>
                <Input value={form.ogImageUrl} onChange={e => setForm(f => ({ ...f, ogImageUrl: e.target.value }))} placeholder="https://..." className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Category */}
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 h-fit">
          <CardContent className="p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Kategori</p>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(f => ({ ...f, categoryId: f.categoryId === cat.id ? '' : cat.id }))}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all text-left ${form.categoryId === cat.id ? 'text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  style={form.categoryId === cat.id ? { backgroundColor: cat.color } : {}}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
