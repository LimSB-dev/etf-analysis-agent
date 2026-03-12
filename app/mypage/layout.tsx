import type { Metadata } from "next"
import { SITE_URL } from "@/lib/site-config"

const title = "마이페이지"
const description =
  "관심 ETF 리스트와 매수·매도 프리미엄 기준을 설정하고, 텔레그램 알림을 연결하세요. ETF 프리미엄 분석 플랫폼."

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${SITE_URL}/mypage`,
    siteName: "ETF 프리미엄 분석 플랫폼",
    title: `${title} | ETF 프리미엄 분석 플랫폼`,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ETF 프리미엄 분석 플랫폼 - 마이페이지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ETF 프리미엄 분석 플랫폼`,
    description,
  },
  alternates: { canonical: `${SITE_URL}/mypage` },
  robots: { index: false, follow: true },
}

export default function MypageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
