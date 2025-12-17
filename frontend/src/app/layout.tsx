import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kamaskope",
  description: "Calculadora de runas Dofus",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
