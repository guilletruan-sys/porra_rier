// src/app/api/team/[tla]/news/route.ts
import { NextResponse } from 'next/server'
import { TLA_TO_EXCEL_NAME } from '@/lib/team-map'

export const revalidate = 1800 // 30 min

interface NewsItem {
  title: string
  link: string
  source: string
  pubDate: string
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
}

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(block)
    const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(block)
    const pubMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)
    const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/.exec(block)
    items.push({
      title: decodeEntities(stripCdata(titleMatch?.[1] ?? '')),
      link: decodeEntities(stripCdata(linkMatch?.[1] ?? '')),
      source: decodeEntities(stripCdata(sourceMatch?.[1] ?? '')),
      pubDate: decodeEntities(stripCdata(pubMatch?.[1] ?? '')),
    })
  }
  return items
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tla: string }> },
) {
  const { tla } = await params
  const teamName = TLA_TO_EXCEL_NAME[tla.toUpperCase()]
  if (!teamName) {
    return NextResponse.json({ error: 'Unknown TLA' }, { status: 400 })
  }
  const query = encodeURIComponent(`${teamName} mundial 2026`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=es&gl=ES&ceid=ES:es`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PorraTaladros/1.0)' },
      next: { revalidate: 1800 },
    })
    if (!res.ok) throw new Error(`Google News ${res.status}`)
    const xml = await res.text()
    const items = parseRss(xml).slice(0, 5)
    return NextResponse.json({ items })
  } catch (err) {
    console.error('API /team/[tla]/news error:', err)
    return NextResponse.json({ items: [], error: 'Failed to fetch news' }, { status: 200 })
  }
}
