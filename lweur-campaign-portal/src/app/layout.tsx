import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from '@/components/providers';
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loveworld Europe Campaign Portal | Adopt a Language & Sponsor Translation",
  description: "Support Loveworld Europe's mission to broadcast Christian content across 60 languages in Europe. Adopt a language or sponsor translation for £150/month to reach 750 million souls.",
  keywords: ["Loveworld Europe", "Christian Television", "Language Adoption", "Translation Sponsorship", "Europe", "Broadcasting", "Faith"],
  authors: [{ name: "Loveworld Europe" }],
  creator: "Loveworld Europe",
  publisher: "Loveworld Europe",
  robots: "index, follow",
  openGraph: {
    title: "Loveworld Europe Campaign Portal",
    description: "Support our mission to reach 750 million souls across Europe through Christian television in 60 languages.",
    url: "https://give.loveworldeurope.org",
    siteName: "Loveworld Europe Campaign Portal",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loveworld Europe Campaign Portal",
    description: "Support our mission to reach 750 million souls across Europe through Christian television in 60 languages.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <Providers>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
