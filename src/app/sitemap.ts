import type { MetadataRoute } from 'next'
import { getServerSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getServerSiteUrl()
  const now = new Date()

  const routes = [
    '',
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
    priority: path === '' ? 1 : 0.8,
  }))

  return routes
}

