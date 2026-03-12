import { SITE_URL } from "@/lib/site-config"

const WEB_SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ETF 프리미엄 분석 플랫폼",
  url: SITE_URL,
  description:
    "한국 상장 미국 ETF(TIGER, KODEX, ACE)의 실시간 괴리율(프리미엄)·iNAV 분석, 매수/매도 신호, 프리미엄 추이·전략 시뮬레이션을 제공하는 무료 분석 도구입니다.",
  inLanguage: "ko",
}

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(WEB_SITE_JSON_LD) }}
    />
  )
}
