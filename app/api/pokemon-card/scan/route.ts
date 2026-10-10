import { NextResponse } from 'next/server'
import { cleanRawText, matchScan } from 'app/pokemon-card/lib/scan/match'
import type { NumberRead, ScanQuery } from 'app/pokemon-card/lib/scan/types'
import { tcgApiKey } from 'app/pokemon-card/lib/tcg-key'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asRead(value: unknown): NumberRead | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const number = asString(row.number)
  if (!number) return null
  const kind = row.kind === 'subset' || row.kind === 'promo' || row.kind === 'std' ? row.kind : undefined
  const total = asString(row.total) || undefined
  return { number, total, kind: kind ?? (total ? 'std' : 'promo') }
}

function parseQuery(body: unknown): ScanQuery | null {
  if (!body || typeof body !== 'object') return null
  const raw = body as Record<string, unknown>
  const name = asString(raw.name) || undefined
  const primary = asRead({ number: raw.number, total: raw.total, kind: raw.kind })
  const alts = Array.isArray(raw.alts)
    ? raw.alts.map(asRead).filter((read): read is NumberRead => Boolean(read))
    : undefined
  const agreement = typeof raw.agreement === 'number' && Number.isFinite(raw.agreement) ? raw.agreement : undefined
  const rawText = cleanRawText(raw.rawText)
  if (!name && !primary && !rawText.length) return null
  return {
    name,
    number: primary?.number,
    total: primary?.total,
    kind: primary?.kind,
    alts,
    agreement,
    rawText: rawText.length ? rawText : undefined,
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'name or number required' }, { status: 400 })
  }

  const query = parseQuery(body)
  if (!query) {
    return NextResponse.json({ error: 'name or number required' }, { status: 400 })
  }

  try {
    const result = await matchScan(query, { apiKey: tcgApiKey() || undefined })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
