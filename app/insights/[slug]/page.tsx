"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"

type ArticleType = {
  id: string
  title: string
  slug: string
  content: string
  publishedAt: string
}

export default function InsightDetailPage() {
  const params = useParams()
  const slug = typeof params.slug === "string" ? params.slug : ""
  const t = useTranslations("insights")
  const [article, setArticle] = useState<ArticleType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    fetch(`/api/articles/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) {
          setError(true)
          return null
        }
        return res.json()
      })
      .then((data: ArticleType | null) => {
        setArticle(data ?? null)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

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

  if (loading) {
    return (
      <main className="flex flex-1 flex-col bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-500 dark:text-gray-400">...</p>
        </div>
      </main>
    )
  }

  if (error || !article) {
    return (
      <main className="flex flex-1 flex-col bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-500 dark:text-gray-400">
            {t("notFound")}
          </p>
          <Link
            href="/insights"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t("backToList")}
          </Link>
        </div>
      </main>
    )
  }

  const paragraphs = article.content.split(/\n\n+/).filter(Boolean)

  return (
    <main
      className="flex flex-1 flex-col bg-background py-12 px-4 sm:px-6 lg:px-8"
      role="main"
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/insights"
          className="inline-block text-sm text-gray-600 dark:text-gray-400 hover:underline mb-6"
        >
          ← {t("backToList")}
        </Link>
        <article aria-label={article.title}>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl mb-2">
            {article.title}
          </h1>
          <time
            dateTime={article.publishedAt}
            className="block text-sm text-gray-500 dark:text-gray-400 mb-8"
          >
            {t("publishedOn")}: {formatDate(article.publishedAt)}
          </time>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
              >
                {p}
              </p>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}
