import { PRINTING_ORDER } from './constants'
import type { MarketQuote, TcgCard } from './types'

export function quoteFor(card: TcgCard | null | undefined, preferred?: string | null): MarketQuote {
  const prices = card?.tcgplayer?.prices ?? {}
  const updatedAt = card?.tcgplayer?.updatedAt ?? null

  if (preferred && prices[preferred]?.market != null) {
    return { market: prices[preferred].market ?? null, variant: preferred, updatedAt }
  }

  for (const key of PRINTING_ORDER) {
    const market = prices[key]?.market
    if (market != null) {
      return { market, variant: key, updatedAt }
    }
  }

  for (const [key, value] of Object.entries(prices)) {
    if (value?.market != null) {
      return { market: value.market, variant: key, updatedAt }
    }
  }

  return { market: null, variant: preferred ?? null, updatedAt }
}

export function availablePrintings(card: TcgCard | null | undefined) {
  const prices = card?.tcgplayer?.prices ?? {}
  const keys = Object.keys(prices)
  const ranked = PRINTING_ORDER.filter((key) => keys.includes(key))
  const extra = keys.filter((key) => !PRINTING_ORDER.includes(key))
  return [...ranked, ...extra]
}

export function lineValue(quantity: number, market: number | null) {
  if (market == null) return null
  return market * quantity
}
