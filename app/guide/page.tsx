"use client"

import { useTranslations } from "next-intl"

const SAMSUNG_GUIDE_URL = "https://www.samsungfund.com/etf/insight/guide/view03.do"

export default function GuidePage() {
  const t = useTranslations("guide")

  return (
    <main
      className="flex flex-1 flex-col bg-background py-12 px-4 sm:px-6 lg:px-8"
      role="main"
    >
      <div className="max-w-3xl mx-auto">
        <article
          className="prose prose-gray dark:prose-invert max-w-none"
          aria-label={t("title")}
        >
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl mb-1">
            {t("title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {t("subtitle")}
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-10">
            {t("description")}
          </p>

          <section className="mb-10" aria-labelledby="guide-nav-inav">
            <h2
              id="guide-nav-inav"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              {t("sectionNavInavTitle")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("sectionNavInavIntro")}
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2">
              {t("navDefinitionTitle")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("navDefinition")}
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2">
              {t("inavDefinitionTitle")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("inavDefinition")}
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>{t("navInavSummary1")}</li>
              <li>{t("navInavSummary2")}</li>
            </ul>
          </section>

          <section className="mb-10" aria-labelledby="guide-premium-tracking">
            <h2
              id="guide-premium-tracking"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              {t("sectionPremiumTrackingTitle")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("sectionPremiumTrackingIntro")}
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2">
              {t("premiumDefinitionTitle")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              {t("premiumDefinition")}
            </p>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1.5 inline-block my-2">
              {t("premiumFormula")}
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2">
              {t("trackingErrorDefinitionTitle")}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("trackingErrorDefinition")}
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
              <li>{t("premiumTrackingSummary1")}</li>
              <li>{t("premiumTrackingSummary2")}</li>
            </ul>
          </section>

          <section className="mb-10" aria-labelledby="guide-service-usage">
            <h2
              id="guide-service-usage"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              {t("sectionServiceUsageTitle")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("sectionServiceUsageIntro")}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>{t("serviceUsagePremium")}</li>
              <li>{t("serviceUsageSignal")}</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 leading-relaxed">
              {t("serviceUsageDisclaimer")}
            </p>
          </section>

          <section className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {t("referenceSource")}
            </h3>
            <a
              href={SAMSUNG_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("referenceSamsungGuide")}
            </a>
            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1" aria-hidden>
              ({t("externalLink")})
            </span>
          </section>
        </article>
      </div>
    </main>
  )
}
