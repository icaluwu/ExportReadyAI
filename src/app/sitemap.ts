import type { MetadataRoute } from 'next'
import { getServerSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getServerSiteUrl()
  const now = new Date()

  // Static routes
  const staticRoutes = [
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
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : path === '/blog' ? 0.9 : 0.8,
  }))

  // Dynamic blog posts
  try {
    const supabase = await createClient()
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(100)

    const blogRoutes = (posts ?? []).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticRoutes, ...blogRoutes]
  } catch {
    return staticRoutes
  }
}
