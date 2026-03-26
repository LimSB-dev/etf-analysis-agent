import { notFound } from "next/navigation"
import { headers } from "next/headers"

import { BROKER_DEEP_LINK_OPTIONS } from "@/lib/broker-deep-links"

export const dynamic = "force-dynamic"

type PagePropsType = {
  params: Promise<{ brokerId: string; code: string }>
}

type BrokerFallbackTargetsType = {
  iosStoreUrl: string
  androidStoreUrl: string
  webUrl: string
}

const BROKER_FALLBACK_TARGETS: Record<string, BrokerFallbackTargetsType> = {
  naver: {
    iosStoreUrl: "https://apps.apple.com/kr/app/naver/id393499958",
    androidStoreUrl:
      "https://play.google.com/store/apps/details?id=com.nhn.android.search",
    webUrl: "https://m.stock.naver.com/domestic/stock",
  },
  toss: {
    iosStoreUrl: "https://apps.apple.com/kr/app/%ED%86%A0%EC%8A%A4/id839333328",
    androidStoreUrl:
      "https://play.google.com/store/apps/details?id=viva.republica.toss",
    webUrl: "https://tossinvest.com/stocks",
  },
}

function normalizeSixDigitCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.length !== 6) {
    return null
  }
  return digits
}

export default async function BrokerGoPage({ params }: PagePropsType) {
  const { brokerId, code: rawCode } = await params
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent") ?? ""
  const code = normalizeSixDigitCode(rawCode)
  if (!code) {
    notFound()
  }
  const opt = BROKER_DEEP_LINK_OPTIONS.find((o) => o.id === brokerId)
  if (!opt) {
    notFound()
  }
  const target = opt.build(code)
  const safeLabel = opt.labelKo
  const fallbackTargets = BROKER_FALLBACK_TARGETS[brokerId]
  const isIos = /iPhone|iPad|iPod/i.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)
  const fallbackUrl = fallbackTargets
    ? isIos
      ? fallbackTargets.iosStoreUrl
      : isAndroid
        ? fallbackTargets.androidStoreUrl
        : fallbackTargets.webUrl
    : null

  return (
    <main
      className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10"
      data-testid="test-broker-go-main"
    >
      <h1 className="text-lg font-semibold" data-testid="test-broker-go-heading">
        앱 열기
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        잠시 후 <b>{safeLabel}</b> 앱으로 이동합니다. 이동이 안 되면 아래 버튼을 눌러
        주세요.
      </p>
      <a
        className="mt-6 inline-flex w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        href={target}
        data-testid="test-broker-go-open-app"
      >
        {safeLabel} 열기
      </a>
      {fallbackUrl ? (
        <a
          className="mt-3 inline-flex w-fit rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900"
          href={fallbackUrl}
          data-testid="test-broker-go-fallback-store"
        >
          앱이 없으면 스토어로 이동
        </a>
      ) : null}
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `(function () {
            var appUrl = ${JSON.stringify(target)};
            var fallbackUrl = ${JSON.stringify(fallbackUrl)};
            var fallbackTimer = null;

            function clearFallbackTimer() {
              if (fallbackTimer !== null) {
                clearTimeout(fallbackTimer);
                fallbackTimer = null;
              }
            }

            document.addEventListener("visibilitychange", function () {
              if (document.hidden) {
                clearFallbackTimer();
              }
            });

            window.addEventListener("pagehide", clearFallbackTimer);

            if (fallbackUrl) {
              fallbackTimer = setTimeout(function () {
                window.location.href = fallbackUrl;
              }, 1200);
            }

            setTimeout(function () {
              window.location.href = appUrl;
            }, 50);
          })();`,
        }}
      />
    </main>
  )
}

