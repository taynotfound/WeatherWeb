import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://upload-dot-head-expo.trycloudflare.com/sitemap.xml',
  };
}
