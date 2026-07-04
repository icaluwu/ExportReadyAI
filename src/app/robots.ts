import type { MetadataRoute } from 'next'
import { getServerSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private areas out of search index
        disallow: ['/editor/', '/editor-onboarding', '/profile/', '/dashboard/', '/results/', '/payment/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
