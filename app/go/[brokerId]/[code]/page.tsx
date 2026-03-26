import { notFound } from "next/navigation"

import { BROKER_DEEP_LINK_OPTIONS } from "@/lib/broker-deep-links"

export const dynamic = "force-dynamic"

type PagePropsType = {
  params: Promise<{ brokerId: string; code: string }>
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

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10">
      <h1 className="text-lg font-semibold">앱 열기</h1>
      <p className="mt-2 text-sm text-gray-600">
        잠시 후 <b>{safeLabel}</b> 앱으로 이동합니다. 이동이 안 되면 아래 버튼을 눌러
        주세요.
      </p>
      <a
        className="mt-6 inline-flex w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        href={target}
      >
        {safeLabel} 열기
      </a>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `setTimeout(function(){ window.location.href = ${JSON.stringify(
            target,
          )}; }, 50);`,
        }}
      />
    </main>
  )
}

