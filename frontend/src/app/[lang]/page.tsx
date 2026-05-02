import { Language } from '@/constants/translations';
import Calculator from './Calculator.client';
import SeoHero from '@/components/seo/SeoHero';
import SeoFooter from '@/components/seo/SeoFooter';

const SUPPORTED_LANGS = new Set<Language>(['es', 'en', 'fr', 'pt']);

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const validLang: Language = SUPPORTED_LANGS.has(lang as Language)
    ? (lang as Language)
    : 'es';

  return (
    <>
      <SeoHero lang={validLang} />
      <Calculator />
      <SeoFooter lang={validLang} />
    </>
  );
}
