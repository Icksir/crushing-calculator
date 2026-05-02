import type { MetadataRoute } from 'next';

const BASE_URL = 'https://kamaskope.icksir.com';
const LANGS = ['es', 'en', 'fr', 'pt'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return LANGS.map((lang) => ({
    url: `${BASE_URL}/${lang}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: lang === 'fr' || lang === 'es' ? 1.0 : 0.9,
    alternates: {
      languages: {
        es: `${BASE_URL}/es`,
        en: `${BASE_URL}/en`,
        fr: `${BASE_URL}/fr`,
        pt: `${BASE_URL}/pt`,
        'x-default': `${BASE_URL}/es`,
      },
    },
  }));
}
