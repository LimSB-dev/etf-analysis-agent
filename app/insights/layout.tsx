import type { Metadata } from "next"
import { SITE_URL } from "@/lib/site-config"

const title = "투자 인사이트"
const description =
  "AI가 매일 작성하는 투자·ETF 관련 짧은 글입니다. 괴리율, NAV, 매매 타이밍 등."

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: `${SITE_URL}/insights`,
    siteName: "ETF 프리미엄 분석 플랫폼",
    title: `${title} | ETF 프리미엄 분석`,
    description,
  },
  alternates: { canonical: `${SITE_URL}/insights` },
}

export default function InsightsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
