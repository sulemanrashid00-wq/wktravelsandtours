import { siteConfig } from '@/config/site';
import { initialPackages } from '@/config/initialData';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;

  const staticRoutes = [
    '',
    '/packages',
    '/custom-trip',
    '/our-work',
    '/reviews',
    '/about',
    '/contact',
    '/profile',
    '/privacy-policy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' || route === '/packages' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/packages' ? 0.9 : 0.7,
  }));

  const packageRoutes = initialPackages.map((pkg) => ({
    url: `${baseUrl}/packages/${pkg.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...packageRoutes];
}

