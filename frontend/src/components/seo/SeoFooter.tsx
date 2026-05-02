import { translations, Language } from '@/constants/translations';

const BASE_URL = 'https://kamaskope.icksir.com';

interface SeoFooterProps {
  lang: Language;
}

export default function SeoFooter({ lang }: SeoFooterProps) {
  const t = (key: string) => translations[lang]?.[key] || key;

  const faqItems = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
    { q: t('faq_q6'), a: t('faq_a6') },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('breadcrumb_home'),
        item: `${BASE_URL}/${lang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('breadcrumb_calculator'),
        item: `${BASE_URL}/${lang}`,
      },
    ],
  };

  const altLangs: Array<{ hrefLang: string; lang: Language }> = [
    { hrefLang: 'es', lang: 'es' },
    { hrefLang: 'en', lang: 'en' },
    { hrefLang: 'fr', lang: 'fr' },
    { hrefLang: 'pt', lang: 'pt' },
  ];

  return (
    <footer className="sr-only" aria-label="SEO content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="Language alternatives">
        {altLangs.map(({ hrefLang, lang: altLang }) => (
          <a key={hrefLang} href={`${BASE_URL}/${altLang}`} hrefLang={hrefLang}>
            {altLang}
          </a>
        ))}
        <a href={`${BASE_URL}/es`} hrefLang="x-default">es</a>
      </nav>

      <section>
        <h2>{t('seo_features_title')}</h2>
        <ul>
          <li>{t('seo_feature_1')}</li>
          <li>{t('seo_feature_2')}</li>
          <li>{t('seo_feature_3')}</li>
          <li>{t('seo_feature_4')}</li>
        </ul>
      </section>

      <section>
        <h2>{t('seo_how_title')}</h2>
        <ol>
          <li>{t('seo_step_1')}</li>
          <li>{t('seo_step_2')}</li>
          <li>{t('seo_step_3')}</li>
          <li>{t('seo_step_4')}</li>
        </ol>
      </section>

      <section>
        <h2>{t('faq_title')}</h2>
        {faqItems.map(({ q, a }, i) => (
          <details key={i}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </footer>
  );
}
