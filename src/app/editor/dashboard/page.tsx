import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import {
  PenLine,
  BookOpen,
  Eye,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}

export default async function EditorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch this editor's posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, status, published_at, view_count, content, category:blog_categories(name, color)')
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const totalPosts = posts?.length || 0;
  const published = posts?.filter(p => p.status === 'published').length || 0;
  const drafts = posts?.filter(p => p.status === 'draft').length || 0;
  const totalViews = posts?.reduce((acc, p) => acc + (p.view_count || 0), 0) || 0;

  const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    published: { label: 'Terbit', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: FileText },
    archived: { label: 'Arsip', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Halo, {profile?.full_name || 'Editor'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Kelola artikel dan pantau performa konten Anda.</p>
        </div>
        <Button asChild className="h-12 px-8 font-black bg-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
          <Link href="/editor/posts/new" className="gap-2">
            <Plus className="h-5 w-5" /> Tulis Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Artikel', value: totalPosts, icon: BookOpen, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
          { label: 'Terbit', value: published, icon: CheckCircle2, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' },
          { label: 'Draft', value: drafts, icon: FileText, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
          { label: 'Total Tayangan', value: totalViews.toLocaleString('id-ID'), icon: Eye, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-50">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Posts Table */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-50">Artikel Saya</CardTitle>
          {posts && posts.length > 0 && (
            <Link href="/editor/posts" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!posts || posts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PenLine className="h-7 w-7 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="font-black text-slate-700 dark:text-slate-300 mb-2">Belum ada artikel</h3>
              <p className="text-slate-400 text-sm mb-6">Mulai tulis artikel pertama Anda sekarang!</p>
              <Button asChild className="font-black bg-primary rounded-xl">
                <Link href="/editor/posts/new" className="gap-2">
                  <Plus className="h-4 w-4" /> Tulis Artikel
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {posts.slice(0, 10).map((post) => {
                const st = STATUS_MAP[post.status] || STATUS_MAP.draft;
                const StIcon = st.icon;
                return (
                  <div key={post.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${st.color}`}>
                          <StIcon className="h-2.5 w-2.5" />
                          {st.label}
                        </span>
                        {post.category && (
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: (post.category as any).color + '15', color: (post.category as any).color }}
                          >
                            {(post.category as any).name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm truncate">{post.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        {post.published_at && (
                          <span>{new Date(post.published_at).toLocaleDateString('id-ID')}</span>
                        )}
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.view_count || 0}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {estimateReadTime(post.content || '')} mnt</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {post.status === 'published' && (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-xs font-bold text-slate-400 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
                        >
                          Lihat
                        </Link>
                      )}
                      <Link
                        href={`/editor/posts/${post.id}/edit`}
                        className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Tips */}
      <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/10 dark:border-primary/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 dark:text-slate-200 mb-1 text-sm">💡 Tips SEO untuk Artikel Anda</h4>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-medium">
              <li>• Gunakan keyword utama di judul, meta description, dan 2-3 kali di body</li>
              <li>• Panjang artikel ideal: 1.000–2.500 kata untuk ranking optimal</li>
              <li>• Tambahkan gambar dengan alt text yang relevan</li>
              <li>• Isi Meta Description (maks. 160 karakter) untuk CTR yang lebih tinggi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
