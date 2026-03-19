"use client"

import { useTranslations } from "next-intl"

export default function AboutPage() {
  const t = useTranslations("about")

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
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base mb-8">
            {t("description")}
          </p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t("sectionWhatTitle")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("sectionWhatContent")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t("sectionFeaturesTitle")}
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>{t("featurePremium")}</li>
              <li>{t("featureSignal")}</li>
              <li>{t("featureTrend")}</li>
              <li>{t("featureStrategy")}</li>
              <li>{t("featureCompare")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t("sectionTargetTitle")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("sectionTargetContent")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t("sectionDisclaimerTitle")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t("sectionDisclaimerContent")}
            </p>
          </section>
        </article>
      </div>
    </main>
  )
}
