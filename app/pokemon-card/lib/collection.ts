import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { CONDITIONS, type CollectionEntry, type CollectionFile, type EnrichedCard } from './types'
import { fetchCardById, fetchCardsByIds } from './tcg'
import { quoteFor } from './prices'

export const COLLECTION_PATH = path.join(process.cwd(), 'data/pokemon-card.json')

export function isWritable() {
  return process.env.NODE_ENV === 'development'
}

export function readCollection(): CollectionFile {
  const raw = readFileSync(COLLECTION_PATH, 'utf8')
  const parsed = JSON.parse(raw) as CollectionFile
  const cards = Array.isArray(parsed.cards) ? parsed.cards : []
  return { cards: cards.filter(isEntry) }
}

function isEntry(value: CollectionEntry): value is CollectionEntry {
  return (
    Boolean(value) &&
    typeof value.id === 'string' &&
    typeof value.quantity === 'number' &&
    CONDITIONS.includes(value.condition) &&
    typeof value.added === 'string'
  )
}

export async function getEnrichedCollection(): Promise<EnrichedCard[]> {
  const { cards } = readCollection()
  const tcgById = await fetchCardsByIds(cards.map((card) => card.id))
  return cards.map((entry) => {
    const tcg = tcgById.get(entry.id) ?? null
    return {
      ...entry,
      tcg,
      quote: quoteFor(tcg, entry.printing),
    }
  })
}

export async function getEnrichedCard(id: string): Promise<EnrichedCard | null> {
  const entry = readCollection().cards.find((card) => card.id === id)
  if (!entry) return null
  const tcg = await fetchCardById(id)
  return {
    ...entry,
    tcg,
    quote: quoteFor(tcg, entry.printing),
  }
}

export function writeCollection(file: CollectionFile) {
  writeFileSync(COLLECTION_PATH, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
}

export function upsertCard(
  incoming: CollectionEntry,
  mode: 'add' | 'edit'
): CollectionFile {
  const file = readCollection()
  const index = file.cards.findIndex((card) => card.id === incoming.id)

  if (index === -1) {
    file.cards.unshift({
      ...incoming,
      added: incoming.added || new Date().toISOString().slice(0, 10),
    })
    writeCollection(file)
    return file
  }

  const current = file.cards[index]
  const quantity =
    mode === 'add' ? current.quantity + incoming.quantity : incoming.quantity

  if (quantity <= 0) {
    file.cards.splice(index, 1)
  } else {
    file.cards[index] = {
      ...current,
      quantity,
      condition: incoming.condition,
      printing: incoming.printing ?? current.printing,
      notes: incoming.notes ?? current.notes,
    }
  }

  writeCollection(file)
  return file
}

export function collectionTotals(cards: EnrichedCard[]) {
  const unique = cards.length
  const copies = cards.reduce((sum, card) => sum + card.quantity, 0)
  const value = cards.reduce((sum, card) => {
    return sum + (card.quote.market != null ? card.quote.market * card.quantity : 0)
  }, 0)
  const sets = new Set(
    cards.map((card) => card.tcg?.set.id).filter((id): id is string => Boolean(id))
  )
  return { unique, copies, value, sets: sets.size }
}
