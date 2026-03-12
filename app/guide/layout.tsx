import type { Metadata } from "next"
import { SITE_URL } from "@/lib/site-config"

const title = "ETF 투자 기초 가이드"
const description =
  "ETF 투자 전 꼭 알아야 할 NAV, iNAV, 괴리율(프리미엄), 추적오차 개념을 정리한 가이드입니다. 삼성펀드 KODEX 가이드 참고."

export const metadata: Metadata = {
  title,
  description,
  keywords: ["ETF", "NAV", "iNAV", "괴리율", "프리미엄", "추적오차", "투자 가이드"],
  openGraph: {
    type: "article",
    locale: "ko_KR",
    url: `${SITE_URL}/guide`,
    siteName: "ETF 프리미엄 분석 플랫폼",
    title: `${title} | NAV, iNAV, 괴리율, 추적오차`,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ETF 투자 기초 가이드 - NAV, iNAV, 괴리율, 추적오차",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | NAV, iNAV, 괴리율, 추적오차`,
    description,
  },
  alternates: { canonical: `${SITE_URL}/guide` },
}

export default function GuideLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
