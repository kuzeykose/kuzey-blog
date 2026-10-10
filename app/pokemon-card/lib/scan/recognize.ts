import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { createWorker, PSM, type Worker } from 'tesseract.js'
import { TCG_API } from '../constants'
import { availablePrintings } from '../prices'
import { tcgApiHeaders, tcgApiKey } from '../tcg-key'
import type { TcgCard } from '../types'
import { nameSim, parseNumbers, pickNameToken, voteNumber } from './parse'
import type { Match, NumberRead, RecognizeOptions, ScanResult } from './types'

export const BEST_THRESHOLD = 0.9
export { nameSim, parseNumbers, voteNumber } from './parse'

const TESSDATA_DIR = path.join(process.cwd(), 'data/tessdata')
const CACHE_TTL = 24 * 3600 * 1000
const queryCache = new Map<string, { t: number; data: TcgCard[] }>()

let workerPromise: Promise<Worker> | null = null
let totalsPromise: Promise<Set<number> | undefined> | null = null

function tessOptions() {
  const local = existsSync(path.join(TESSDATA_DIR, 'eng.traineddata'))
  return {
    langPath: local ? TESSDATA_DIR : undefined,
    cachePath: '/tmp',
    cacheMethod: local ? ('readOnly' as const) : ('write' as const),
    gzip: !local,
  }
}

async function getWorker() {
  workerPromise ??= createWorker('eng', 1, tessOptions())
  return workerPromise
}

async function ocr(buffer: Buffer, psm: number) {
  const worker = await getWorker()
  await worker.setParameters({ tessedit_pageseg_mode: psm === 7 ? PSM.SINGLE_LINE : PSM.SPARSE_TEXT })
  const result = await worker.recognize(buffer)
  return { text: result.data.text.trim(), conf: result.data.confidence }
}

async function band(
  image: Buffer,
  width: number,
  height: number,
  top: number,
  bandHeight: number,
  left: number,
  bandWidth: number,
  threshold: boolean
) {
  let pipeline = sharp(image)
    .extract({
      left: Math.round(width * left),
      top: Math.round(height * top),
      width: Math.round(width * bandWidth),
      height: Math.round(height * bandHeight),
    })
    .resize({ width: 1600 })
    .grayscale()
    .normalize()
    .sharpen()
  if (threshold) pipeline = pipeline.threshold(140)
  return pipeline.png().toBuffer()
}

async function knownTotals(apiKey?: string) {
  totalsPromise ??= fetch(`${TCG_API}/sets?select=printedTotal&pageSize=250`, {
    headers: apiKey ? { ...tcgApiHeaders(), 'X-Api-Key': apiKey } : tcgApiHeaders(),
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('sets'))))
    .then((body: { data?: { printedTotal?: number }[] }) => {
      return new Set((body.data ?? []).map((set) => set.printedTotal).filter((n): n is number => n != null))
    })
    .catch(() => {
      totalsPromise = null
      return undefined
    })
  return totalsPromise
}

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

function toMatch(card: TcgCard, score: number): Match {
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

export async function recognizeCard(
  buffer: Buffer,
  opts: RecognizeOptions = {}
): Promise<ScanResult> {
  const apiKey = opts.apiKey || tcgApiKey() || undefined
  const width = 1000
  const height = 1400
  const image = await sharp(buffer)
    .rotate()
    .trim({ threshold: 30 })
    .resize({ width, height, fit: 'fill' })
    .toBuffer()

  const names: { n: string; conf: number }[] = []
  for (const useThreshold of [false, true]) {
    for (const [top, left] of [
      [0.035, 0.05],
      [0.055, 0.05],
      [0.02, 0.2],
    ] as const) {
      const read = await ocr(await band(image, width, height, top, 0.06, left, 0.6, useThreshold), 7)
      const token = pickNameToken(read.text)
      if (token) names.push({ n: token, conf: read.conf })
    }
  }
  names.sort((a, b) => b.conf - a.conf)

  const totals = await knownTotals(apiKey)
  const reads: NumberRead[] = []
  for (const useThreshold of [false, true]) {
    for (const top of [0.9, 0.925, 0.94]) {
      const read = await ocr(await band(image, width, height, top, 0.06, 0, 1, useThreshold), 11)
      reads.push(...parseNumbers(read.text, totals))
    }
  }

  const { pick, agreement, alts } = voteNumber(reads)
  const name = names[0]?.n
  const ocrOut = { name, number: pick?.number, total: pick?.total }

  const tries: string[] = []
  const numberCandidates = [pick, ...alts].filter(Boolean) as NumberRead[]
  for (const candidate of numberCandidates) {
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

  const scored = Array.from(seen.values())
    .map((card) => {
      const similarity = name ? nameSim(name, card.name) : 0
      const numberOk = Boolean(pick && card.number.toUpperCase() === pick.number.toUpperCase())
      const totalOk =
        pick && pick.kind !== 'std' ? numberOk : Boolean(pick && String(card.set?.printedTotal) === pick.total)
      let score = 0.1 + 0.25 * similarity
      if (numberOk) score += 0.25
      if (numberOk && totalOk) score += 0.2
      if (numberOk && totalOk && similarity >= 0.8) score += 0.1
      if (numberOk && totalOk && agreement >= 0.5) score += 0.05
      return toMatch(card, Number(Math.min(1, score).toFixed(3)))
    })
    .sort((a, b) => b.score - a.score)

  const top = scored[0]
  const gap = top ? top.score - (scored[1]?.score ?? 0) : 0
  const confidence = top ? Number(Math.min(1, top.score - (gap < 0.1 ? 0.15 : 0)).toFixed(2)) : 0

  return {
    best: confidence >= BEST_THRESHOLD ? top : null,
    candidates: scored.slice(0, 8),
    confidence,
    ocr: ocrOut,
    query: used,
  }
}

export const recognize = recognizeCard

export async function shutdownScanWorker() {
  if (!workerPromise) return
  const worker = await workerPromise
  await worker.terminate()
  workerPromise = null
}
