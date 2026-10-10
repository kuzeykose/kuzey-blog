/** One distinct printing (pokemontcg.io card id). */
export type Match = {
  id: string
  name: string
  number: string
  set: string
  setId: string
  printedTotal: number
  rarity?: string
  image?: string
  score: number
  types?: string[]
  printings?: string[]
  quotes?: Record<string, number>
  updatedAt?: string | null
}

/**
 * best: SUGGESTION only, set only when confidence >= 0.9.
 * The user ALWAYS confirms/picks the printing from `candidates`
 * (best, if set, is candidates[0]).
 * candidates: distinct printings, highest score first (<= 8).
 * Scope: one card per photo, English cards only.
 * Photos are processed in memory and never stored.
 */
export type ScanResult = {
  best: Match | null
  candidates: Match[]
  confidence: number
  ocr: { name?: string; number?: string; total?: string }
  query?: string
}

export type RecognizeOptions = {
  apiKey?: string
}

export type NumberRead = {
  number: string
  total?: string
  kind: 'std' | 'subset' | 'promo'
  votes?: number
}
