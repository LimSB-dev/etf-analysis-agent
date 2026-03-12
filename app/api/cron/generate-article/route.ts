/**
 * CRON: 매일 1회 호출 시 AI가 투자 관련 글 1편 생성 후 DB에 저장
 * - GEMINI_API_KEY(무료), CRON_SECRET 필수
 * - 당일 이미 글이 있으면 스킵
 * - Google AI Studio에서 API 키 무료 발급: https://aistudio.google.com/app/apikey
 */

import { NextRequest, NextResponse } from "next/server"
import { and, eq, gte, lt } from "drizzle-orm"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"

const GEMINI_MODEL = "gemini-1.5-flash"

const TOPICS_KO = [
  "ETF 괴리율을 활용한 매매 타이밍",
  "NAV와 iNAV의 차이와 활용법",
  "미국 지수 ETF 장단점",
  "프리미엄 할인 시 매수 전략",
  "추적오차가 적은 ETF 고르기",
  "환율 변동이 ETF 수익에 미치는 영향",
  "분배금과 ETF 선택",
  "장 마감 전 괴리율 확인의 중요성",
]

function getTopicForToday(): string {
  const start = new Date(Date.UTC(2025, 0, 1))
  const today = new Date()
  const diff = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  return TOPICS_KO[diff % TOPICS_KO.length] ?? TOPICS_KO[0]
}

function slugify(title: string, date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const base = title
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")
    .slice(0, 80) || "article"
  return `${base}-${y}-${m}-${d}`
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    )
  }
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace(/Bearer\s+/i, "")
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured. Get a free key at https://aistudio.google.com/app/apikey" },
      { status: 503 },
    )
  }

  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayEnd = new Date(todayStart)
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1)

  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(
      and(
        gte(articles.publishedAt, todayStart),
        lt(articles.publishedAt, todayEnd),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "already_has_article_today",
    })
  }

  const topic = getTopicForToday()
  const prompt = `당신은 한국 투자자에게 유익한 콘텐츠를 쓰는 전문가입니다.
아래 주제로 짧은 투자/ETF 관련 글을 한국어로 작성해 주세요.
반드시 JSON만 반환하고, 다른 설명은 넣지 마세요.
형식: {"title": "제목 (20자 이내)", "content": "본문 (400자 이상 800자 이내, 단락 구분은 \\n\\n)"}

주제: ${topic}`

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
  let res: Response
  try {
    res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 1024,
        },
      }),
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Gemini request failed", detail: err },
      { status: 502 },
    )
  }

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json(
      { error: "Gemini API error", detail: text },
      { status: 502 },
    )
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawContent || typeof rawContent !== "string") {
    return NextResponse.json(
      { error: "Gemini returned no content" },
      { status: 502 },
    )
  }

  let jsonStr = rawContent.trim()
  const codeBlock = /^```(?:json)?\s*([\s\S]*?)```\s*$/
  const match = jsonStr.match(codeBlock)
  if (match) {
    jsonStr = match[1].trim()
  }
  let parsed: { title?: string; content?: string }
  try {
    parsed = JSON.parse(jsonStr) as { title?: string; content?: string }
  } catch {
    return NextResponse.json(
      { error: "Gemini response was not valid JSON" },
      { status: 502 },
    )
  }

  const title = String(parsed.title ?? topic).slice(0, 512).trim() || topic
  const content = String(parsed.content ?? "").trim()
  if (!content) {
    return NextResponse.json(
      { error: "Gemini returned empty content" },
      { status: 502 },
    )
  }

  let slug = slugify(title, now)
  const existingSlug = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1)
  if (existingSlug.length > 0) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  await db.insert(articles).values({
    title,
    slug,
    content,
    locale: "ko",
    publishedAt: now,
  })

  return NextResponse.json({
    ok: true,
    slug,
    title,
  })
}
