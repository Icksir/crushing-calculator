import { translations, Language } from '@/constants/translations';

interface SeoHeroProps {
  lang: Language;
}

export default function SeoHero({ lang }: SeoHeroProps) {
  const t = (key: string) => translations[lang]?.[key] || key;

  return (
    <section className="sr-only" aria-label={t('seo_h1')}>
      <h1>{t('seo_h1')}</h1>
      <p>{t('seo_intro_p1')}</p>
      <p>{t('seo_intro_p2')}</p>
    </section>
  );
}
