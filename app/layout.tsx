import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { I18nProvider } from "@/components/I18nProvider";
import { StoreProvider } from "@/components/StoreProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { StructuredData } from "@/components/StructuredData";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const siteTitle = "ETF 프리미엄 분석 플랫폼 | TIGER·KODEX·ACE 미국 ETF 괴리율·매수매도 신호";
const siteDescription =
  "한국 상장 미국 ETF(TIGER, KODEX, ACE)의 실시간 괴리율(프리미엄)·iNAV 분석, 매수/매도 신호, 프리미엄 추이·전략 시뮬레이션을 제공하는 무료 분석 도구입니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteTitle,
    template: "%s | ETF 프리미엄 분석",
  },
  description: siteDescription,
  keywords: [
    "ETF",
    "프리미엄",
    "괴리율",
    "NAV",
    "iNAV",
    "TIGER",
    "KODEX",
    "ACE",
    "미국나스닥100",
    "S&P500",
    "반도체",
    "매수신호",
    "매도신호",
    "ETF 분석",
  ],
  authors: [{ name: "Canary Lab", url: "https://canary-lab.vercel.app" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "ETF 프리미엄 분석 플랫폼",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ETF 프리미엄 분석 플랫폼 - 한국 상장 미국 ETF 괴리율·매수매도 신호",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <StructuredData />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <StoreProvider>
            <I18nProvider>
              <AuthProvider>
                <div className="flex min-h-screen flex-col max-w-4xl justify-center mx-auto">
                  <SiteHeader />
                  {children}
                  <Footer />
                </div>
              </AuthProvider>
              <Analytics />
            </I18nProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
