import type { MetadataRoute } from 'next'
import { getServerSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

