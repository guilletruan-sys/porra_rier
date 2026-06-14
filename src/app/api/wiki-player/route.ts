// src/app/api/wiki-player/route.ts
// Looks up a football player on Wikipedia by name. Returns thumbnail image
// URL + current club extracted from the article infobox.
// Cached 24h since this info changes rarely.
import { NextResponse } from 'next/server'

export const revalidate = 86400

const UA = 'PorraTaladros/1.0 (contact: guilletruan@gmail.com)'

interface SearchResult {
  query?: { search?: { title: string }[] }
}

interface SummaryPage {
  title?: string
  thumbnail?: { source: string }
  originalimage?: { source: string }
}

interface ParseResult {
  parse?: { wikitext?: { '*': string } }
}

function unwrapWikiLink(s: string): string {
  const m = s.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/)
  if (m) return (m[2] ?? m[1]).trim()
  return s.replace(/<!--.*?-->/g, '').replace(/<ref[^>]*>.*?<\/ref>/g, '').trim()
}

function extractCurrentClub(wikitext: string): string | null {
  // Match `| currentclub = <value up to end of line>`
  const m = wikitext.match(/\|\s*currentclub\s*=\s*([^\n]+)/i)
  if (!m) return null
  const raw = m[1].trim()
  const club = unwrapWikiLink(raw)
  if (!club || club.length > 80) return null
  return club
}

async function searchTitle(name: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${name} footballer`)}&srlimit=1&format=json`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = (await res.json()) as SearchResult
  return data.query?.search?.[0]?.title ?? null
}

async function fetchSummary(title: string): Promise<SummaryPage | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { 'User-Agent': UA }, next: { revalidate: 86400 } },
  )
  if (!res.ok) return null
  return (await res.json()) as SummaryPage
}

async function fetchWikitextSection0(title: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&section=0`
  const res = await fetch(url, { headers: { 'User-Agent': UA }, next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = (await res.json()) as ParseResult
  return data.parse?.wikitext?.['*'] ?? null
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const name = url.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  try {
    // 1. First try summary with the exact name
    let title: string | null = name.replace(/ /g, '_')
    let summary = await fetchSummary(title)
    // 2. If 404, search Wikipedia for "<name> footballer"
    if (!summary) {
      title = await searchTitle(name)
      if (!title) return NextResponse.json({ thumbnail: null, club: null })
      summary = await fetchSummary(title)
    }
    const thumbnail = summary?.thumbnail?.source ?? null

    // 3. Pull wikitext section 0 (lead + infobox) and parse currentclub
    let club: string | null = null
    if (title) {
      const wikitext = await fetchWikitextSection0(title)
      if (wikitext) club = extractCurrentClub(wikitext)
    }

    return NextResponse.json({ thumbnail, club, title })
  } catch (err) {
    console.error('API /wiki-player error:', err)
    return NextResponse.json({ thumbnail: null, club: null }, { status: 200 })
  }
}
