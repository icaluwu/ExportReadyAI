import type { MetadataRoute } from 'next'
import { getServerSiteUrl } from '@/lib/site-url'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getServerSiteUrl()
  const now = new Date()

  // Static routes — always present, even if DB is unreachable at build time
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/blog',
    '/assessment',
    '/login',
    '/register',
    '/materi-belajar',
    '/sertifikasi',
    '/kebijakan-privasi',
    '/syarat-ketentuan',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : path === '/blog' ? 0.9 : 0.8,
  }))

  // Dynamic blog posts — best-effort; never break the sitemap on DB failure.
  // Lazy-import so a missing/invalid env var doesn't crash the module at build.
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(100)

    const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticRoutes, ...blogRoutes]
  } catch (error) {
    console.warn('[sitemap] Falling back to static-only routes:', error)
    return staticRoutes
  }
}
