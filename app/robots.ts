import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/terms',
          '/privacy',
          '/public-deals',
        ],
        disallow: [
          '/assistant',
          '/clients',
          '/prompts',
          '/ai-services',
          '/admin',
          '/subscription',
          '/affiliation',
          '/feedback',
          '/api/',
          '/sign-in',
          '/sign-up',
        ],
      },
    ],
    sitemap: 'https://mia.community/sitemap.xml',
  }
}