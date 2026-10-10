import type { NumberRead, ScanQuery } from './types'

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
  if (!out.length && totals) {
    // "/" misread as 7, 1 or 4, often with stray "," "." "%" (full-art italics): "1997,165" -> 199/165, "2564193" -> 256/193.
    // Scan digit runs for <n:1-3><sep><total:2-3>, keep only known totals and plausible n (<= 1.6 x total).
    for (const run of cleaned.replace(/(?<=\d)[,.%'](?=\d)/g, '').match(/\d{5,}/g) ?? []) {
      const found: NumberRead[] = []
      for (let i = 0; i < run.length; i++) {
        for (const nl of [3, 2, 1]) {
          const sep = run[i + nl]
          if (sep !== '7' && sep !== '1' && sep !== '4') continue
          for (const tl of [3, 2]) {
            const n = run.slice(i, i + nl), t = run.slice(i + nl + 1, i + nl + 1 + tl)
            if (n.length !== nl || t.length !== tl) continue
            if (totals.has(Number(t)) && Number(t) >= 10 && Number(n) >= 1 && Number(n) <= Number(t) * 1.6) {
              found.push({ number: String(Number(n)), total: String(Number(t)), kind: 'std' })
            }
          }
        }
      }
      // keep only the longest-number window(s) of a run (avoid "99/165" from "1997165")
      const maxLen = Math.max(0, ...found.map((r) => r.number.length))
      out.push(...found.filter((r) => r.number.length === maxLen).slice(0, 1))
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

  // A dropped leading digit ("99/165" vs "199/165") supports the longer read with the same total.
  const rows = Array.from(tally.values())
  for (const long of rows) for (const short of rows)
    if (long !== short && long.kind === 'std' && short.kind === 'std' && long.total === short.total &&
        long.number.length > short.number.length && long.number.endsWith(short.number)) long.votes += short.votes

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

export function readsFromQuery(query: ScanQuery): NumberRead[] {
  const primary = query.number
    ? {
        number: query.number,
        total: query.total,
        kind: query.kind ?? (query.total ? 'std' : 'promo'),
      }
    : undefined
  return [primary, ...(query.alts ?? [])].filter((read): read is NumberRead => Boolean(read?.number))
}

export function buildQueries(query: ScanQuery): string[] {
  const name = query.name
  const tries: string[] = []
  for (const candidate of readsFromQuery(query)) {
    if (candidate.kind !== 'std') {
      if (name) tries.push(`number:${candidate.number} name:"${name}*"`)
      tries.push(`number:${candidate.number}`)
    } else {
      if (name) {
        tries.push(`number:${candidate.number} set.printedTotal:${candidate.total} name:"${name}*"`)
      }
      tries.push(`number:${candidate.number} set.printedTotal:${candidate.total}`)
      if (name) tries.push(`number:${candidate.number} name:"${name}*"`)
    }
  }
  if (name) tries.push(`name:"${name}"`, `name:${name.slice(0, 4)}*`)
  return tries
}

export function scoreMatch(
  card: { name: string; number: string; printedTotal?: number },
  query: ScanQuery
) {
  const pick = readsFromQuery(query)[0]
  const name = query.name
  const agreement = query.agreement ?? 0
  const similarity = name ? nameSim(name, card.name) : 0
  const numberOk = Boolean(pick && card.number.toUpperCase() === pick.number.toUpperCase())
  const totalOk =
    pick && pick.kind !== 'std' ? numberOk : Boolean(pick && String(card.printedTotal) === pick.total)
  let score = 0.1 + 0.25 * similarity
  if (numberOk) score += 0.25
  if (numberOk && totalOk) score += 0.2
  if (numberOk && totalOk && similarity >= 0.8) score += 0.1
  if (numberOk && totalOk && agreement >= 0.5) score += 0.05
  return Number(Math.min(1, score).toFixed(3))
}

const NOISE = /^(pok[eé]mon|rule|when|your|knocked|opponent|takes|prize|cards?|illus|nintendo|creatures|game|freak|weakness|resistance|retreat|ability|damage|attack|this|that|energy|card|turn)$/i

/** All plausible name tokens in a line, longest first (for fallbacks). */
export function nameTokens(text: string): string[] {
  return Array.from(
    new Set(
      text
        .replace(/[^A-Za-z'.\-é ]/g, ' ')
        .split(/\s+/)
        .map((w) => w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ''))
        .filter((w) => w.length >= 4 && !STOP.test(w) && !NOISE.test(w))
    )
  ).sort((a, b) => b.length - a.length)
}

/** Lenient number scan of raw text: any "a/b", subset, promo, else lone 1-3 digit groups. */
export function parseRawText(lines: string[], totals?: Set<number>) {
  const reads: NumberRead[] = []
  const names: string[] = []
  const loose: string[] = []
  for (const line of lines) {
    reads.push(...parseNumbers(line, totals))
    names.push(...nameTokens(line))
    for (const m of Array.from(line.matchAll(/(?<![\d/])(\d{2,3})(?![\d/])/g))) loose.push(String(Number(m[1])))
  }
  return { reads, names: Array.from(new Set(names)), loose: Array.from(new Set(loose)).slice(0, 4) }
}

/** Best fuzzy matches of an OCR token against a list of real names. */
export function fuzzyNames(token: string, names: Iterable<string>, limit = 5, min = 0.55) {
  const out: { name: string; sim: number }[] = []
  for (const name of Array.from(names)) {
    const sim = nameSim(token, name)
    if (sim >= min) out.push({ name, sim })
  }
  return out.sort((a, b) => b.sim - a.sim).slice(0, limit)
}
