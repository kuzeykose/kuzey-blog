import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CardTile,
  ListRow,
  PageIntro,
  SectionTabs,
  SectionTitle,
  SourceCredit,
  TypeDot,
  tileFromEntry,
} from './components/ui'
import { collectionTotals, getEnrichedCollection, isWritable } from './lib/collection'
import { formatCount, formatShortDate, formatUsd } from './lib/format'
import { TYPE_COLORS } from './lib/constants'
import type { EnrichedCard } from './lib/types'

export const revalidate = 86400

export const metadata = {
  title: 'Pokémon cards',
  description: 'A small record of what’s in my binders. Prices are estimates.',
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  if (view === 'collection') redirect('/pokemon-card/collection')

  const cards = await getEnrichedCollection()
  const totals = collectionTotals(cards)
  const writable = isWritable()

  const bySet = aggregate(
    cards,
    (card) => card.tcg?.set.name ?? 'Unknown set',
    (card) => (card.quote.market ?? 0) * card.quantity
  )
  const byType = aggregate(
    cards,
    (card) => card.tcg?.types?.[0] ?? 'Trainer',
    (card) => card.quantity
  )
  const byRarity = aggregate(
    cards,
    (card) => card.tcg?.rarity ?? 'Unknown',
    (card) => card.quantity
  )
  const typeTotal = byType.reduce((sum, item) => sum + item.value, 0) || 1
  const mostValuable = [...cards]
    .sort((a, b) => (b.quote.market ?? 0) * b.quantity - (a.quote.market ?? 0) * a.quantity)
    .slice(0, 5)
  const recent = [...cards].sort((a, b) => b.added.localeCompare(a.added)).slice(0, 4)
  const maxSet = Math.max(...bySet.map((item) => item.value), 1)

  return (
    <section>
      <PageIntro>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          A small record of what&apos;s in my binders. Prices are estimates.
        </p>
      </PageIntro>
      <SectionTabs active="overview" writable={writable} />

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="grid grid-cols-3 gap-4">
          <Stat
            label="cards"
            value={formatCount(totals.copies)}
            hint={`${formatCount(totals.unique)} unique`}
          />
          <Stat label="Est. value" value={formatUsd(totals.value)} hint="near mint · USD" />
          <Stat label="Sets" value={formatCount(totals.sets)} hint="in the binders" />
        </div>
      </div>

      <hr className="my-8 border-neutral-200 dark:border-neutral-800" />

      <SectionTitle>By set</SectionTitle>
      <div className="mb-2">
        {bySet.map((item) => (
          <div key={item.key} className="mb-3">
            <ListRow label={formatUsd(item.value)}>{item.key}</ListRow>
            <div className="h-1 rounded-sm bg-neutral-200 dark:bg-neutral-800 -mt-1">
              <i
                className="block h-full rounded-sm bg-neutral-600 dark:bg-neutral-400"
                style={{ width: `${Math.max(4, (item.value / maxSet) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
        <div>
          <SectionTitle>By type</SectionTitle>
          {byType.map((item) => (
            <ListRow
              key={item.key}
              label={
                <span>
                  <TypeDot type={TYPE_COLORS[item.key] ? item.key : undefined} />
                  {item.key}
                </span>
              }
            >
              {Math.round((item.value / typeTotal) * 100)}%
            </ListRow>
          ))}
        </div>
        <div>
          <SectionTitle>By rarity</SectionTitle>
          {byRarity.map((item) => (
            <ListRow key={item.key} label={item.key}>
              {formatCount(item.value)}
            </ListRow>
          ))}
        </div>
      </div>

      <hr className="my-8 border-neutral-200 dark:border-neutral-800" />

      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-base font-medium">Most valuable</h2>
        <Link
          href="/pokemon-card/collection?sort=value"
          className="text-sm text-neutral-600 dark:text-neutral-400 underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-2"
        >
          see all
        </Link>
      </div>
      {mostValuable.map((card) => (
        <Link key={card.id} href={`/pokemon-card/${card.id}`} className="block">
          <ListRow label={formatUsd(card.quote.market)}>
            {card.tcg?.name ?? card.id}
            <span className="text-neutral-600 dark:text-neutral-400">
              {' '}
              · {card.tcg?.set.name ?? 'Unknown set'} {card.tcg?.number ?? ''}
            </span>
          </ListRow>
        </Link>
      ))}

      <hr className="my-8 border-neutral-200 dark:border-neutral-800" />

      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-base font-medium">Recently added</h2>
        <Link
          href="/pokemon-card/collection?sort=added"
          className="text-sm text-neutral-600 dark:text-neutral-400 underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-2"
        >
          see all
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
        {recent.map((card) => {
          const tile = tileFromEntry(card)
          return (
            <CardTile
              key={card.id}
              href={`/pokemon-card/${card.id}`}
              card={tile}
              meta={
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  Added {formatShortDate(card.added)}
                </div>
              }
            />
          )
        })}
      </div>

      <SourceCredit />
    </section>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div>
      <div className="text-sm text-neutral-600 dark:text-neutral-400">{label}</div>
      <div className="text-xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-neutral-600 dark:text-neutral-400">{hint}</div>
    </div>
  )
}

function aggregate(
  cards: EnrichedCard[],
  keyOf: (card: EnrichedCard) => string,
  valueOf: (card: EnrichedCard) => number
) {
  const map = new Map<string, number>()
  for (const card of cards) {
    const key = keyOf(card)
    map.set(key, (map.get(key) ?? 0) + valueOf(card))
  }
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value)
}
