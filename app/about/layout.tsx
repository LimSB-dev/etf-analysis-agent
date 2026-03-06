import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "서비스 소개 | ETF 프리미엄 분석 플랫폼",
  description:
    "한국 상장 미국 ETF(TIGER, KODEX, ACE)의 프리미엄·NAV 분석, 매수/매도 신호, 프리미엄 추이·전략 시뮬레이션을 제공하는 무료 분석 도구입니다.",
  openGraph: {
    title: "서비스 소개 | ETF 프리미엄 분석 플랫폼",
    description:
      "한국 상장 미국 ETF의 프리미엄·NAV 분석, 매수/매도 신호, 프리미엄 추이·전략 시뮬레이션을 제공하는 무료 분석 도구입니다.",
  },
}

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
