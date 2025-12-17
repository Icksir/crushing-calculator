import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { LanguageProvider, Language, translations } from "@/context/LanguageContext";
import { RunePriceProvider } from "@/context/RunePriceContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ahora metadata es una función asíncrona que genera los metadatos dinámicamente
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const langValue = lang || 'es'; // Fallback a español si no se especifica
  const t = (key: string) => translations[langValue]?.[key] || key;

  return {
    metadataBase: new URL('https://kamaskope.icksir.com'),
    title: t('meta_title'),
    description: t('meta_description'),
    icons: {
      icon: '/logo.svg',
    },
    alternates: {
      canonical: './',
      languages: {
        'en': '/en',
        'es': '/es',
        'fr': '/fr',
        'x-default': '/es',
      },
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      url: "https://kamaskope.icksir.com/",
      siteName: "Kamaskope",
      images: [
        {
          url: "https://kamaskope.icksir.com/logo.svg",
          width: 32,
          height: 32,
          alt: t('logo_alt_text'),
        },
      ],
      locale: langValue === 'es' ? 'es_ES' : langValue === 'en' ? 'en_US' : 'fr_FR',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t('meta_title'),
      description: t('meta_description'),
      images: ["https://kamaskope.icksir.com/logo.svg"],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html lang={lang} className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <LanguageProvider initialLanguage={lang as Language}>
          <RunePriceProvider>
            {children}
          </RunePriceProvider>
        </LanguageProvider>
        <footer className="w-full py-4 text-center text-sm text-muted-foreground bg-background/95 border-t">
          <p>Las imágenes pertenecen a Ankama.</p>
        </footer>
      </body>
    </html>
  );
}
