import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import { LanguageProvider} from "@/context/LanguageContext";
import { RunePriceProvider } from "@/context/RunePriceContext";
import { translations, Language } from "@/constants/translations";
// 1. IMPORTAMOS EL COMPONENTE
import MaintenanceBanner from "@/components/MaintenanceBanner"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Language }>;
}): Promise<Metadata> {
    // ... (Todo tu código de metadata se queda EXACTAMENTE IGUAL) ...
    const { lang } = await params;
    const supportedLangs = ['es', 'en', 'fr'];
    const currentLang = supportedLangs.includes(lang) ? lang : 'es';
    const t = (key: string) => translations?.[currentLang]?.[key] || key;

    return {
        metadataBase: new URL('https://kamaskope.icksir.com'),
        title: t('meta_title'),
        description: t('meta_description'),
        icons: { icon: '/logo.svg' },
        alternates: {
            canonical: `./${currentLang}`,
            languages: { 'en': '/en', 'es': '/es', 'fr': '/fr', 'x-default': '/es' },
        },
        openGraph: {
            title: t('meta_title'),
            description: t('meta_description'),
            url: "https://kamaskope.icksir.com/",
            siteName: "Kamaskope",
            images: [{ url: "https://kamaskope.icksir.com/logo.svg", width: 32, height: 32, alt: t('logo_alt_text') }],
            locale: currentLang === 'es' ? 'es_ES' : currentLang === 'en' ? 'en_US' : 'fr_FR',
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
    <html lang={lang || 'es'} className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans flex flex-col min-h-screen`}>
        <LanguageProvider initialLanguage={(lang as Language) || 'es'}>
          <RunePriceProvider>
            
            {/* 2. AQUÍ VA EL BANNER */}
            {/* Si tienes un <Navbar /> aquí, pon el banner justo debajo de él */}
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