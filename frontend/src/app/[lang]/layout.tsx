import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import { LanguageProvider} from "@/context/LanguageContext";
import { RunePriceProvider } from "@/context/RunePriceContext";
import { translations, Language } from "@/constants/translations";
import MaintenanceBanner from "@/components/MaintenanceBanner";

const BASE_URL = 'https://kamaskope.icksir.com';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const supportedLangs = ['es', 'en', 'fr', 'pt'];
    const currentLang = supportedLangs.includes(lang) ? lang : 'es';
    const t = (key: string) => translations?.[currentLang as Language]?.[key] || key;

    const ogLocaleMap: Record<string, string> = { es: 'es_ES', en: 'en_US', fr: 'fr_FR', pt: 'pt_BR' };
    const ogLocale = ogLocaleMap[currentLang] ?? 'es_ES';

    return {
        metadataBase: new URL(BASE_URL),
        title: t('meta_title'),
        description: t('meta_description'),
        keywords: t('meta_keywords'),
        applicationName: 'Kamaskope',
        category: 'utilities',
        alternates: {
            canonical: `/${currentLang}`,
            languages: {
                'es': `${BASE_URL}/es`,
                'en': `${BASE_URL}/en`,
                'fr': `${BASE_URL}/fr`,
                'pt': `${BASE_URL}/pt`,
                'x-default': `${BASE_URL}/es`,
            },
        },
        openGraph: {
            title: t('meta_title'),
            description: t('meta_description'),
            url: `${BASE_URL}/${currentLang}`,
            siteName: "Kamaskope",
            images: [{ url: `/og/og-${currentLang}.png`, width: 1200, height: 630, alt: t('logo_alt_text') }],
            locale: ogLocale,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: t('meta_title'),
            description: t('meta_description'),
            images: [`/og/og-${currentLang}.png`],
        },
    };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const supportedLangs: Language[] = ['es', 'en', 'fr', 'pt'];
  const validLang = supportedLangs.includes(lang as Language) ? (lang as Language) : 'es';

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Kamaskope',
    url: `${BASE_URL}/${validLang}`,
    inLanguage: ['fr-FR', 'es-ES', 'en-US', 'pt-BR'],
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    description: translations[validLang]?.meta_description || translations.es.meta_description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    publisher: {
      '@type': 'Organization',
      name: 'Kamaskope',
      url: BASE_URL,
    },
  };

  return (
    <html lang={validLang} className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans flex flex-col min-h-screen`}>
        <Script
          id="jsonld-webapp"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <LanguageProvider initialLanguage={validLang}>
          <RunePriceProvider>
            <MaintenanceBanner />
            <div className="flex-grow">
                {children}
            </div>
          </RunePriceProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
