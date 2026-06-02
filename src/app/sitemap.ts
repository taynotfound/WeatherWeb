import type { MetadataRoute } from 'next';

const SITE = 'https://upload-dot-head-expo.trycloudflare.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE}/#forecast`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE}/#map`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${SITE}/#alerts`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
  ];
}
