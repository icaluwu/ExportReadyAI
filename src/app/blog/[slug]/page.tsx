import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import {
  Clock,
  Eye,
  ChevronRight,
  Calendar,
  Tag,
  ArrowLeft,
  Share2,
  PenLine,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, meta_title, meta_description, excerpt, og_image_url, published_at, slug')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return { title: 'Artikel Tidak Ditemukan | ExportReady AI' };
  }

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || '';

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${slug}`,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      images: post.og_image_url ? [{ url: post.og_image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.og_image_url ? [post.og_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(id, name, slug, color),
      author:profiles!blog_posts_author_id_fkey(
        id, username, full_name, bio, avatar_url,
        social_instagram, social_twitter, social_linkedin, social_website,
        account_type
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) notFound();

  // Increment view count (fire-and-forget)
  supabase.from('blog_posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', post.id).then(() => {});

  // Fetch related posts
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, og_image_url, published_at')
    .eq('status', 'published')
    .eq('category_id', post.category_id)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3);

  const author = post.author as any;
  const category = post.category as any;
  const readTime = estimateReadTime(post.content);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  // Article JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.og_image_url ? [post.og_image_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: author?.full_name || 'Editor',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ExportReady AI',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.ico` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/blog/${slug}` },
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/blog/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Hero */}
        <div className="relative bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="container mx-auto max-w-4xl px-4 pt-10 pb-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              {category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <Link href={`/blog?category=${category.slug}`} className="hover:text-primary transition-colors">{category.name}</Link>
                </>
              )}
            </nav>

            {/* Category */}
            {category && (
              <Link href={`/blog?category=${category.slug}`}>
                <Badge
                  className="mb-4 font-black border-0 text-xs px-3 py-1"
                  style={{ backgroundColor: category.color + '15', color: category.color }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {category.name}
                </Badge>
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                  {(author?.full_name || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <span className="font-black text-slate-700 dark:text-slate-300">{author?.full_name || 'Editor'}</span>
                  {author?.account_type === 'editor' && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      <PenLine className="h-2.5 w-2.5" /> Editor
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : ''}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {readTime} menit baca
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.view_count?.toLocaleString('id-ID') || 0} tayangan
              </div>
            </div>
          </div>
        </div>

        {/* OG Image */}
        {post.og_image_url && (
          <div className="container mx-auto max-w-4xl px-4 -mt-2 mb-0">
            <img
              src={post.og_image_url}
              alt={post.title}
              className="w-full aspect-video object-cover rounded-2xl shadow-xl"
            />
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
            {/* Article Body */}
            <article
              className="prose prose-slate dark:prose-invert prose-lg max-w-none
                prose-headings:font-black prose-headings:tracking-tight
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-lg
                prose-blockquote:border-primary prose-blockquote:font-medium prose-blockquote:not-italic
                prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-slate-900 prose-pre:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Author Card */}
              <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="h-16 bg-gradient-to-br from-primary/60 to-blue-500/60" />
                <CardContent className="px-5 pb-6 -mt-8">
                  <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border-2 border-white dark:border-slate-700 flex items-center justify-center text-primary text-2xl font-black mb-3">
                    {(author?.full_name || 'A')[0].toUpperCase()}
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-slate-50 mb-0.5">{author?.full_name || 'Editor'}</h3>
                  {author?.username && <p className="text-xs text-slate-400 font-bold mb-2">@{author.username}</p>}
                  {author?.account_type === 'editor' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full mb-3">
                      <PenLine className="h-3 w-3" /> Editor Terverifikasi
                    </span>
                  )}
                  {author?.bio && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">{author.bio}</p>}
                  <div className="flex items-center gap-2">
                    {author?.social_instagram && (
                      <a href={author.social_instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-900/30 text-slate-400 hover:text-pink-500 transition-all">
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {author?.social_twitter && (
                      <a href={author.social_twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 transition-all">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {author?.social_linkedin && (
                      <a href={author.social_linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-700 transition-all">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {author?.social_website && (
                      <a href={author.social_website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-all">
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Share */}
              <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Share2 className="h-3.5 w-3.5" /> Bagikan
                  </h4>
                  <div className="flex gap-2">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${siteUrl}/blog/${slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-700 transition-all"
                    >
                      <Twitter className="h-3.5 w-3.5" /> X
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${siteUrl}/blog/${slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-blue-700 text-white text-xs font-black hover:bg-blue-800 transition-all"
                    >
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Back */}
              <Link
                href="/blog"
                className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali ke Blog
              </Link>
            </aside>
          </div>

          {/* Related Posts */}
          {related && related.length > 0 && (
            <div className="mt-16 pt-12 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-6">Artikel Terkait</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((rel) => (
                  <Link key={rel.id} href={`/blog/${rel.slug}`} className="group">
                    <div className="h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                      {rel.og_image_url ? (
                        <img src={rel.og_image_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PenLine className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {rel.published_at ? new Date(rel.published_at).toLocaleDateString('id-ID') : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
