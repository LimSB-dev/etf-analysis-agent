"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

type ArticleItemType = {
  id: string
  title: string
  slug: string
  publishedAt: string
}

export default function InsightsPage() {
  const t = useTranslations("insights")
  const [articles, setArticles] = useState<ArticleItemType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data: { articles: ArticleItemType[] }) => {
        setArticles(data.articles ?? [])
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return iso
    }
  }

  return (
    <main
      className="flex flex-1 flex-col bg-background py-12 px-4 sm:px-6 lg:px-8"
      role="main"
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl mb-1">
          {t("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("description")}
        </p>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            ...
          </p>
        ) : articles.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            {t("noArticles")}
          </p>
        ) : (
          <ul className="space-y-4 list-none p-0 m-0">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/insights/${a.slug}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {a.title}
                  </h2>
                  <time
                    dateTime={a.publishedAt}
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t("publishedOn")}: {formatDate(a.publishedAt)}
                  </time>
                  <span className="block mt-2 text-sm text-blue-600 dark:text-blue-400">
                    {t("readMore")} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
