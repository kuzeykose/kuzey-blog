import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import { OwnerActions } from './owner-actions'
import { TYPE_COLORS } from '../lib/constants'
import { formatUsd } from '../lib/format'
import type { EnrichedCard } from '../lib/types'

export function PageIntro({
  title = 'Pokémon cards',
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  return (
    <>
      <h1 className="font-semibold text-2xl tracking-tighter">{title}</h1>
      {children}
    </>
  )
}

export function SectionTabs({
  active,
  writable = false,
}: {
  active: 'overview' | 'collection'
  writable?: boolean
}) {
  const tabs = [
    { href: '/pokemon-card', id: 'overview', label: 'overview' },
    { href: '/pokemon-card/collection', id: 'collection', label: 'collection' },
  ] as const

  return (
    <div className="flex items-center justify-between gap-4 text-sm mt-4 mb-8">
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const on = tab.id === active
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={on ? 'page' : undefined}
              className={
                on
                  ? 'underline underline-offset-4 decoration-orange-600'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      <OwnerActions writable={writable} />
    </div>
  )
}

export function BackLink({ href = '/pokemon-card/collection' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-neutral-600 dark:text-neutral-400 underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-2"
    >
      ← collection
    </Link>
  )
}

export function PrivateBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 px-2.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-400 font-[family-name:var(--font-geist-mono),ui-monospace,monospace]">
      🔒 private · only you see this
    </span>
  )
}

export function SourceCredit() {
  return (
    <p className="mt-8 mb-16 text-sm text-neutral-600 dark:text-neutral-400">
      Card data and images from the{' '}
      <a
        href="https://pokemontcg.io"
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-2"
      >
        Pokémon TCG API
      </a>
      . Market prices are TCGplayer near-mint estimates, in USD.
    </p>
  )
}

export function TypeDot({ type }: { type?: string }) {
  const color = (type && TYPE_COLORS[type]) || '#A3A3A3'
  return (
    <span
      className="inline-block w-[7px] h-[7px] rounded-full mr-1.5 align-[1px]"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

export function CardArt({
  src,
  name,
  type,
}: {
  src?: string
  name: string
  type?: string
}) {
  const color = (type && TYPE_COLORS[type]) || '#A3A3A3'
  return (
    <div
      className="relative aspect-[63/88] overflow-hidden rounded-[4.5%/3.2%] bg-neutral-200 dark:bg-neutral-800"
      style={{
        backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${color} 30%, #d4d4d4), #d4d4d4 55%, #c4c4c4)`,
      }}
    >
      {src ? (
        // Official TCG scans; next/image needs sharp which is optional here
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-[6%] rounded-[3px] border border-white/35 dark:border-white/10" />
      )}
    </div>
  )
}

export function CardTile({
  card,
  href,
  selected = false,
  onSelect,
  meta,
}: {
  card: {
    id: string
    name: string
    image?: string
    type?: string
    line?: string
    price?: string
  }
  href?: string
  selected?: boolean
  onSelect?: () => void
  meta?: ReactNode
}) {
  const inner = (
    <>
      <div className={selected ? 'rounded-md outline outline-1 outline-orange-600 outline-offset-4' : ''}>
        <CardArt src={card.image} name={card.name} type={card.type} />
      </div>
      <div className="mt-2 text-sm tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
        {card.name}
      </div>
      {meta ?? (
        <div className="flex justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="truncate">{card.line}</span>
          {card.price ? (
            <span className="tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
              {card.price}
            </span>
          ) : null}
        </div>
      )}
    </>
  )

  const className = 'block min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded-md'

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    )
  }

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className} aria-pressed={selected}>
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}

export function tileFromEntry(card: EnrichedCard) {
  const name = card.tcg?.name ?? card.id
  const setName = card.tcg?.set.name ?? 'Unknown set'
  const shortSet = setName.split(' ')[0]
  return {
    id: card.id,
    name,
    image: card.tcg?.images?.small,
    type: card.tcg?.types?.[0],
    line: `${shortSet} · ${card.tcg?.number ?? '—'}`,
    price: formatUsd(card.quote.market),
  }
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-medium mb-3">{children}</h2>
}

export function ListRow({
  label,
  children,
}: {
  label: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex gap-2 mb-3 text-sm">
      <div className="w-[100px] shrink-0 text-neutral-600 dark:text-neutral-400 tabular-nums">
        {label}
      </div>
      <div className="min-w-0 flex-1 text-neutral-900 dark:text-neutral-100 tracking-tight">
        {children}
      </div>
    </div>
  )
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-9 rounded-full px-4 text-sm inline-flex items-center justify-center bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-9 rounded-full px-4 text-sm inline-flex items-center justify-center border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function OptionPill({
  selected,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-full px-2.5 py-0.5 text-sm border ${
        selected
          ? 'border-orange-600 text-neutral-900 dark:text-neutral-100'
          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600`}
    >
      {children}
    </button>
  )
}
