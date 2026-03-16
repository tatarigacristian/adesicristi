import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Alex_Brush, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const alexBrush = Alex_Brush({
  variable: "--font-script",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Ade & Cristi - 4 Iulie 2026",
  description: "Sunteți invitați la nunta noastră!",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${cormorant.variable} ${alexBrush.variable} ${montserrat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
