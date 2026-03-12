import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export type ArticleDetailResponseType = {
  id: string
  title: string
  slug: string
  content: string
  publishedAt: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse<ArticleDetailResponseType | { error: string }>> {
  const { slug } = await params
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  }

  try {
    const rows = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      publishedAt: row.publishedAt.toISOString(),
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
