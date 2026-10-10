'use client'

import type { NumberRead, ScanQuery } from './types'
import { parseNumbers, pickNameToken, voteNumber } from './parse'

export type OcrProgress = {
  name?: boolean
  number?: boolean
  ocr?: ScanQuery
}

const CARD_WIDTH = 1000
const CARD_HEIGHT = 1400

type TesseractMod = typeof import('tesseract.js')
type TessWorker = Awaited<ReturnType<TesseractMod['createWorker']>>

let workerPromise: Promise<TessWorker> | null = null

async function getWorker() {
  workerPromise ??= (async () => {
    const { createWorker } = await import('tesseract.js')
    // Browser defaults load worker, wasm core, and eng.traineddata from jsDelivr.
    return createWorker('eng', 1, { workerBlobURL: true })
  })()
  return workerPromise
}

function extractBand(
  source: HTMLCanvasElement,
  top: number,
  bandHeight: number,
  left: number,
  bandWidth: number,
  threshold: boolean
) {
  const sx = Math.round(source.width * left)
  const sy = Math.round(source.height * top)
  const sw = Math.max(1, Math.round(source.width * bandWidth))
  const sh = Math.max(1, Math.round(source.height * bandHeight))
  const destW = 1600
  const destH = Math.max(1, Math.round(sh * (destW / sw)))
  const canvas = document.createElement('canvas')
  canvas.width = destW
  canvas.height = destH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.filter = 'grayscale(1) contrast(1.25)'
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, destW, destH)
  ctx.filter = 'none'
  if (threshold) {
    const image = ctx.getImageData(0, 0, destW, destH)
    const pixels = image.data
    for (let i = 0; i < pixels.length; i += 4) {
      const value = pixels[i] > 140 ? 255 : 0
      pixels[i] = value
      pixels[i + 1] = value
      pixels[i + 2] = value
    }
    ctx.putImageData(image, 0, 0)
  }
  return canvas
}

async function toCardCanvas(blob: Blob) {
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available')
    ctx.drawImage(bitmap, 0, 0, CARD_WIDTH, CARD_HEIGHT)
    return canvas
  } finally {
    bitmap.close()
  }
}

async function readText(worker: TessWorker, image: HTMLCanvasElement, psm: string) {
  await worker.setParameters({ tessedit_pageseg_mode: psm as never })
  const result = await worker.recognize(image)
  return { text: result.data.text.trim(), conf: result.data.confidence }
}

async function knownTotals() {
  try {
    const res = await fetch('/api/pokemon-card/sets')
    if (!res.ok) return undefined
    const body = (await res.json()) as { sets?: { printedTotal?: number }[] }
    const totals = new Set(
      (body.sets ?? []).map((set) => set.printedTotal).filter((n): n is number => n != null)
    )
    return totals.size ? totals : undefined
  } catch {
    return undefined
  }
}

export async function ocrCard(
  blob: Blob,
  onProgress?: (progress: OcrProgress) => void
): Promise<ScanQuery> {
  const { PSM } = await import('tesseract.js')
  const [card, worker, totals] = await Promise.all([toCardCanvas(blob), getWorker(), knownTotals()])

  const names: { n: string; conf: number }[] = []
  for (const useThreshold of [false, true]) {
    for (const [top, left] of [
      [0.035, 0.05],
      [0.055, 0.05],
    ] as const) {
      const read = await readText(
        worker,
        extractBand(card, top, 0.06, left, 0.6, useThreshold),
        PSM.SINGLE_LINE
      )
      const token = pickNameToken(read.text)
      if (token) names.push({ n: token, conf: read.conf })
    }
  }
  names.sort((a, b) => b.conf - a.conf)
  const name = names[0]?.n
  onProgress?.({ name: true, ocr: { name } })

  const reads: NumberRead[] = []
  for (const useThreshold of [false, true]) {
    for (const top of [0.9, 0.925]) {
      const read = await readText(worker, extractBand(card, top, 0.06, 0, 1, useThreshold), PSM.SPARSE_TEXT)
      reads.push(...parseNumbers(read.text, totals))
    }
  }

  if (!name && !reads.length) {
    const fallback = await readText(worker, card, PSM.SPARSE_TEXT)
    const token = pickNameToken(fallback.text)
    if (token) names.push({ n: token, conf: fallback.conf })
    reads.push(...parseNumbers(fallback.text, totals))
  }

  const { pick, agreement, alts } = voteNumber(reads)
  const query: ScanQuery = {
    name: names[0]?.n ?? name,
    number: pick?.number,
    total: pick?.total,
    kind: pick?.kind,
    alts,
    agreement,
  }
  onProgress?.({ name: true, number: true, ocr: query })
  return query
}
