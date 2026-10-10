import type { NumberRead } from './types'

const STOP = /^(basic|stage|evolves|from|hp|put|on|the|v|ex|gx|vmax|vstar|trainer|gallery)$/i

export function levenshtein(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const next = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = next
    }
  }
  return d[b.length]
}

export function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function nameSim(a: string, b: string) {
  const left = normalizeName(a)
  const right = normalizeName(b)
  if (!left || !right) return 0
  const words = [right, ...right.split(/(?=ex$|vstar$|vmax$|gx$)/)]
  return Math.max(
    ...words.map((word) => 1 - levenshtein(left, word) / Math.max(left.length, word.length)),
    right.startsWith(left) && left.length >= 4 ? 0.95 : 0
  )
}

export function pickNameToken(text: string) {
  return text
    .replace(/[^A-Za-z'.\-é ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.test(word))
    .sort((a, b) => b.length - a.length)[0]
}

/**
 * Parse one OCR'd bottom strip. `totals` = known set.printedTotal values
 * used to trim trailing junk ("42/1460" -> 42/146) and to repair "/"
 * misread as 7 or 1 ("2017165" -> 201/165).
 */
export function parseNumbers(text: string, totals?: Set<number>): NumberRead[] {
  const cleaned = text
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/(?<=\d)[Zz]|[Zz](?=\d)/g, '2')
    .replace(/\s*\/\s*/g, '/')
    .replace(/G\s+G/g, 'GG')

  const okTotal = (value: string) => !totals || totals.has(Number(value))
  const out: NumberRead[] = []

  for (const match of Array.from(cleaned.matchAll(/(TG|1G|GG)\s?(\d{2})\/(?:TG|1G|GG)?\s?(\d{2})/gi))) {
    out.push({
      number: match[1].toUpperCase().replace('1G', 'TG') + match[2],
      total: String(Number(match[3])),
      kind: 'subset',
    })
  }

  const pushStd = (number: string, total: string) => {
    for (const len of [3, 2]) {
      const next = total.slice(0, len)
      if (next.length === len && okTotal(next)) {
        out.push({ number: String(Number(number)), total: String(Number(next)), kind: 'std' })
        return
      }
    }
  }

  for (const match of Array.from(cleaned.matchAll(/(?<![A-Z\d])(\d{1,3})\/(\d{2,4})/gi))) {
    pushStd(match[1], match[2])
  }
  if (!out.length) {
    for (const match of Array.from(cleaned.matchAll(/(?<!\d)(\d{3})[71](\d{3})(?!\d)/g))) {
      pushStd(match[1], match[2])
    }
  }
  if (!out.length) {
    for (const match of Array.from(cleaned.matchAll(/\b(SVP|SWSH|SM|XY|BW|DP|HGSS)\s?-?(\d{1,3})\b/gi))) {
      out.push({
        number: match[1].toUpperCase() + match[2].padStart(3, '0'),
        kind: 'promo',
      })
    }
  }

  return out
}

export function voteNumber(reads: NumberRead[]) {
  const tally = new Map<string, NumberRead & { votes: number }>()
  for (const read of reads) {
    const key = `${read.number}|${read.total ?? ''}`
    const existing = tally.get(key) ?? { ...read, votes: 0 }
    existing.votes += 1
    tally.set(key, existing)
  }

  const plausible = (read: NumberRead) =>
    read.kind !== 'std' ||
    (Number(read.number) >= 1 &&
      Number(read.number) <= Number(read.total) * 1.6 &&
      Number(read.total) >= 10)

  const ranked = Array.from(tally.values())
    .filter(plausible)
    .sort((a, b) => b.votes - a.votes || b.number.length - a.number.length)

  return {
    pick: ranked[0],
    agreement: ranked[0] ? ranked[0].votes / reads.length : 0,
    alts: ranked.slice(1, 3),
  }
}
