import { NextResponse } from "next/server"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export type ArticlesListResponseType = {
  articles: Array<{
    id: string
    title: string
    slug: string
    publishedAt: string
  }>
}

export async function GET(): Promise<
  NextResponse<ArticlesListResponseType | { error: string }>
> {
  try {
    const rows = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .orderBy(desc(articles.publishedAt))
      .limit(100)

    return NextResponse.json({
      articles: rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        publishedAt: r.publishedAt.toISOString(),
      })),
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
