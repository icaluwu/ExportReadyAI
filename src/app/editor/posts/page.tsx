'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Clock,
  Trash2,
  Loader2,
  CheckCircle2,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  view_count: number;
  content: string;
  category?: {
    name: string;
    color: string;
  };
}

function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));
}

const STATUS_MAP = {
  published: { label: 'Terbit', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: FileText },
  archived: { label: 'Arsip', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
};

export default function EditorPostsPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  async function loadPosts(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, published_at, view_count, content, category:blog_categories(name, color)')
        .eq('author_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPosts((data as unknown as BlogPost[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat artikel.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        loadPosts(user.id);
      }
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini secara permanen?')) return;
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Artikel berhasil dihapus!');
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus artikel.';
      toast.error(msg);
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2" aria-label="Breadcrumb">
            <Link href="/editor/dashboard" className="hover:text-primary transition-colors">Editor Hub</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 dark:text-slate-400">Artikel Saya</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" /> Artikel Saya
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Kelola dan edit seluruh artikel yang telah Anda tulis.</p>
        </div>
        <Button asChild className="h-12 px-6 font-black bg-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          <Link href="/editor/posts/new" className="gap-2">
            <Plus className="h-5 w-5" /> Tulis Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari artikel berdasarkan judul..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-slate-900 border-none shadow-sm rounded-xl focus-visible:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'published', 'draft', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 h-11 rounded-xl text-xs font-black capitalize transition-all border ${
                filterStatus === status
                  ? 'bg-primary border-primary text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'all' ? 'Semua' : status === 'published' ? 'Terbit' : status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500">Memuat artikel Anda...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 py-16 text-center rounded-2xl">
          <CardContent>
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="font-black text-slate-700 dark:text-slate-300 mb-2">Tidak ada artikel</h3>
            <p className="text-slate-400 text-sm mb-6">Mulai tulis artikel baru dan bagikan pengetahuan Anda!</p>
            <Button asChild className="font-black bg-primary rounded-xl">
              <Link href="/editor/posts/new">
                Tulis Artikel Pertama
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPosts.map(post => {
              const st = STATUS_MAP[post.status] || STATUS_MAP.draft;
              const StIcon = st.icon;
              return (
                <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full ${st.color}`}>
                        <StIcon className="h-2.5 w-2.5" />
                        {st.label}
                      </span>
                      {post.category && (
                        <span
                          className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: post.category.color + '15', color: post.category.color }}
                        >
                          {post.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {post.published_at && (
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(post.published_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      )}
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {post.view_count || 0} Tayangan</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {estimateReadTime(post.content)} Menit Baca</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {post.status === 'published' && (
                      <Button asChild variant="outline" className="h-9 px-4 font-bold border-2 text-xs rounded-xl dark:border-slate-700 dark:text-slate-300">
                        <Link href={`/blog/${post.slug}`}>
                          Lihat
                        </Link>
                      </Button>
                    )}
                    <Button asChild className="h-9 px-4 font-bold bg-primary hover:bg-primary/95 text-white text-xs rounded-xl shadow-md shadow-primary/10">
                      <Link href={`/editor/posts/${post.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(post.id)}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
