import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { RunePriceProvider } from "@/context/RunePriceContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kamaskope - Calculadora de Runas Dofus y Precios de Forjamagia",
  description: "Calculadora de runas y precios de forjamagia para Dofus. Optimiza tus ganancias rompiendo objetos y gestionando tus recursos con coeficientes actualizados.",
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    title: "Kamaskope - Calculadora de Runas Dofus y Precios de Forjamagia",
    description: "Calculadora de runas y precios de forjamagia para Dofus. Optimiza tus ganancias rompiendo objetos y gestionando tus recursos con coeficientes actualizados.",
    url: "https://kamaskope.icksir.com/",
    siteName: "Kamaskope",
    images: [
      {
        url: "https://kamaskope.icksir.com/logo.svg",
        width: 32,
        height: 32,
        alt: "Kamaskope Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kamaskope - Calculadora de Runas Dofus y Precios de Forjamagia",
    description: "Calculadora de runas y precios de forjamagia para Dofus. Optimiza tus ganancias rompiendo objetos y gestionando tus recursos con coeficientes actualizados.",
    images: ["https://kamaskope.icksir.com/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <LanguageProvider>
          <RunePriceProvider>
            {children}
          </RunePriceProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
