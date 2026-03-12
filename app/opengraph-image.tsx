import { ImageResponse } from "next/og"

export const alt = "ETF 프리미엄 분석 플랫폼 - 한국 상장 미국 ETF 괴리율·매수매도 신호"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          padding: 48,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          ETF 프리미엄 분석 플랫폼
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          TIGER·KODEX·ACE 미국 ETF 실시간 괴리율·iNAV 분석, 매수/매도 신호, 전략 시뮬레이션
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: "#64748b",
          }}
        >
          무료 분석 도구
        </div>
      </div>
    ),
    { ...size },
  )
}
