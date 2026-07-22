import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { BookOpen, Clock, Tag, ChevronRight, PenLine, Rss, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Blog Ekspor UMKM | ExportReady AI',
  description: 'Artikel, panduan, dan insight terbaru seputar ekspor UMKM Indonesia — regulasi, strategi pasar global, sertifikasi, dan kisah sukses eksportir.',
  keywords: [
    'blog ekspor', 'panduan ekspor UMKM', 'regulasi ekspor Indonesia',
    'strategi ekspor', 'sertifikasi ekspor', 'pasar global Indonesia',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog Ekspor UMKM | ExportReady AI',
    description: 'Artikel dan insight terbaru seputar ekspor UMKM Indonesia.',
    url: '/blog',
    type: 'website',
  },
};

// Revalidate the blog listing every 5 minutes (ISR) so new/edited posts appear
// without re-running the heavy Supabase query on every request.
export const revalidate = 300;

/** Estimate read time from excerpt/preview text (avoids fetching full content). */
function estimateReadTime(text: string): number {
  if (!text) return 1;
  const words = text.split(/\s+/).length;
  // Excerpt is a summary; assume ~4x longer full article, ~200 wpm.
  return Math.max(1, Math.ceil((words * 4) / 200));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');

  // Fetch posts (note: content intentionally omitted — it's large and only needed
  // on the detail page; read-time is estimated from the excerpt)
  let query = supabase
    .from('blog_posts')
    .select(`
      id, title, slug, excerpt, og_image_url, published_at, view_count,
      author_id,
      category:blog_categories(id, name, slug, color)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (category) {
    const cat = categories?.find(c => c.slug === category);
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  }

  const { data: rawPosts } = await query.limit(24);
  const authorIds = [...new Set((rawPosts ?? []).map((post) => post.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', authorIds)
    : { data: [] };
  const authorsById = new Map((authors ?? []).map((author) => [author.id, author]));
  const posts = (rawPosts ?? []).map((post) => ({
    ...post,
    author: authorsById.get(post.author_id) ?? null,
  }));

  const featuredPost = posts[0];
  const restPosts = posts.slice(1);

  return (
    <>
      {/* JSON-LD Blog structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Blog ExportReady AI',
            description: 'Artikel dan insight seputar ekspor UMKM Indonesia',
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/blog`,
            publisher: {
              '@type': 'Organization',
              name: 'ExportReady AI',
            },
          }),
        }}
      />

      <div className="min-h-screen">
        {/* Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_70%)]" />

          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Rss className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-black text-emerald-300 uppercase tracking-widest">Blog</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Insight Ekspor untuk
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                UMKM Indonesia
              </span>
            </h1>
            <p className="text-lg text-slate-300 font-medium max-w-xl mb-8">
              Regulasi, strategi pasar global, sertifikasi, dan kisah sukses — ditulis oleh para ahli ekspor.
            </p>

            {/* Search */}
            <form method="GET" action="/blog" className="flex items-center gap-3 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Cari artikel..."
                  className="w-full pl-10 pr-4 h-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all active:scale-95"
              >
                Cari
              </button>
            </form>
          </div>
        </section>

        {/* Category Filter */}
        <section className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              <Link
                href="/blog"
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black transition-all ${
                  !category
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semua
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black transition-all ${
                    category === cat.slug
                      ? 'text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  style={category === cat.slug ? { backgroundColor: cat.color } : {}}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-5xl px-4 py-12">
          {!posts || posts.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">Belum ada artikel</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {q ? `Tidak ada artikel untuk pencarian "${q}"` : 'Artikel akan segera hadir. Nantikan!'}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && !q && !category && (
                <Link href={`/blog/${featuredPost.slug}`} className="block mb-12 group">
                  <Card className="overflow-hidden border-none shadow-2xl rounded-[2rem] hover:shadow-primary/10 transition-all duration-300 group-hover:-translate-y-1">
                    <div className="grid md:grid-cols-5">
                      {featuredPost.og_image_url ? (
                        <div className="md:col-span-2 h-56 md:h-auto overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={featuredPost.og_image_url}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="md:col-span-2 h-56 md:h-auto bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-white/50" />
                        </div>
                      )}
                      <CardContent className="md:col-span-3 p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full uppercase tracking-widest">✦ Artikel Terbaru</span>
                          {featuredPost.category && (
                            <Badge
                              style={{ backgroundColor: (featuredPost.category as any).color + '20', color: (featuredPost.category as any).color }}
                              className="font-black border-0 text-xs"
                            >
                              {(featuredPost.category as any).name}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3 group-hover:text-primary transition-colors leading-tight">
                          {featuredPost.title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                              {((featuredPost.author as any)?.full_name || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-700 dark:text-slate-300">{(featuredPost.author as any)?.full_name || 'Editor'}</p>
                              <p className="text-xs text-slate-400">{featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                            <Clock className="h-3.5 w-3.5" />
                            {estimateReadTime(featuredPost.excerpt)} mnt baca
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Post Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(q || category ? posts : restPosts).map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                    <Card className="h-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 rounded-2xl group-hover:-translate-y-1">
                      <div className="h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {post.og_image_url ? (
                          <img
                            src={post.og_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        {post.category && (
                          <span
                            className="inline-block text-[11px] font-black px-2.5 py-1 rounded-full mb-3 uppercase tracking-wide"
                            style={{
                              backgroundColor: (post.category as any).color + '15',
                              color: (post.category as any).color,
                            }}
                          >
                            {(post.category as any).name}
                          </span>
                        )}
                        <h3 className="font-black text-slate-900 dark:text-slate-50 text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                              {((post.author as any)?.full_name || 'A')[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{(post.author as any)?.full_name || 'Editor'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                            <Clock className="h-3 w-3" />
                            {estimateReadTime(post.excerpt)} mnt
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* CTA for writers */}
          <div className="mt-20 p-10 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-2">Jadi Kontributor Blog</h3>
              <p className="text-slate-400 mb-6 font-medium max-w-sm mx-auto">
                Bagikan keahlian ekspor Anda. Daftar sebagai editor dan bantu ribuan UMKM Indonesia berkembang.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                Daftar sebagai Editor <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
