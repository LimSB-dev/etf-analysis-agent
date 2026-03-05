import { EtfCalculator } from "@/components/etf-calculator"

export default function Page() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5392145622568260"
        crossOrigin="anonymous"
      />
      <div className="max-w-3xl mx-auto">
        <EtfCalculator />
      </div>
    </main>
  )
}
