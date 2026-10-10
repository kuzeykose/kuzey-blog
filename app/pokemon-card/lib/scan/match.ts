import { TCG_API } from '../constants'
import { availablePrintings } from '../prices'
import { tcgApiHeaders, tcgApiKey } from '../tcg-key'
import type { TcgCard } from '../types'
import { buildQueries, readsFromQuery, scoreMatch } from './parse'
import type { Match, RecognizeOptions, ScanQuery, ScanResult } from './types'

export const BEST_THRESHOLD = 0.9
export { buildQueries, scoreMatch } from './parse'

const CACHE_TTL = 24 * 3600 * 1000
const queryCache = new Map<string, { t: number; data: TcgCard[] }>()

async function queryCards(q: string, apiKey?: string): Promise<TcgCard[]> {
  const hit = queryCache.get(q)
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.data

  const headers = apiKey ? { ...tcgApiHeaders(), 'X-Api-Key': apiKey } : tcgApiHeaders()
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(
      `${TCG_API}/cards?q=${encodeURIComponent(q)}&pageSize=50&select=id,name,number,set,images,rarity,types,tcgplayer`,
      { headers }
    )
    if (res.ok) {
      const body = (await res.json()) as { data?: TcgCard[] }
      const data = body.data ?? []
      queryCache.set(q, { t: Date.now(), data })
      return data
    }
    if (res.status === 429 || res.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt))
      continue
    }
    return []
  }
  return []
}

export function toMatch(card: TcgCard, score: number): Match {
  const printings = availablePrintings(card)
  const quotes: Record<string, number> = {}
  for (const key of printings) {
    const market = card.tcgplayer?.prices?.[key]?.market
    if (market != null) quotes[key] = market
  }
  return {
    id: card.id,
    name: card.name,
    number: card.number,
    set: card.set?.name ?? '',
    setId: card.set?.id ?? '',
    printedTotal: card.set?.printedTotal ?? 0,
    rarity: card.rarity,
    image: card.images?.small,
    score,
    types: card.types,
    printings,
    quotes,
    updatedAt: card.tcgplayer?.updatedAt ?? null,
  }
}

export function rankCards(cards: TcgCard[], query: ScanQuery): Match[] {
  return cards
    .map((card) => toMatch(card, scoreMatch({ ...card, printedTotal: card.set?.printedTotal }, query)))
    .sort((a, b) => b.score - a.score)
}

export async function matchScan(query: ScanQuery, opts: RecognizeOptions = {}): Promise<ScanResult> {
  const apiKey = opts.apiKey || tcgApiKey() || undefined
  const pick = readsFromQuery(query)[0]
  const tries = buildQueries(query)
  const seen = new Map<string, TcgCard>()
  let used: string | undefined

  for (const q of tries) {
    const rows = await queryCards(q, apiKey)
    for (const card of rows) {
      if (!seen.has(card.id)) seen.set(card.id, card)
    }
    if (rows.length) used ??= q
    if (seen.size && seen.size <= 5 && pick) break
  }

  const scored = rankCards(Array.from(seen.values()), query)
  const top = scored[0]
  const gap = top ? top.score - (scored[1]?.score ?? 0) : 0
  const confidence = top ? Number(Math.min(1, top.score - (gap < 0.1 ? 0.15 : 0)).toFixed(2)) : 0

  return {
    best: confidence >= BEST_THRESHOLD ? top : null,
    candidates: scored.slice(0, 8),
    confidence,
    ocr: { name: query.name, number: query.number, total: query.total },
    query: used,
  }
}
