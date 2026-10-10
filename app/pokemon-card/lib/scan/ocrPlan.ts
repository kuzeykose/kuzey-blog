/**
 * Pure OCR plan shared by browser (ocr.ts) and node tests. Engine is injected, so no DOM/node deps.
 * Stage 1: name band + full-width bottom strips (cheap, normal cards).
 * Stage 2 (only if stage 1 found no number): full-art / SIR - bottom-left box over art, upscaled,
 *          white-text mask + inverted Otsu, PSM 7 and 11. Early exit once two passes agree.
 */
import { crop, grayNormalize, pad, scaleToWidth, threshold, trimBorder, whiteText, resize, type Img } from './image'
import { parseNumbers, pickNameToken, voteNumber } from './parse'
import type { NumberRead, ScanQuery } from './types'

export type Psm = '6' | '7' | '11'
export type Engine = (img: Img, psm: Psm) => Promise<{ text: string; conf: number }>
export const CARD_W = 1000, CARD_H = 1400
/** Extra Tesseract calls allowed when stage 1 has no agreeing number. */
export const STAGE2_PASS_CAP = 24

export function normalizeCard(img: Img): Img {
  return resize(trimBorder(img), CARD_W, CARD_H)
}

type Variant = 'gray' | 'otsu' | 'otsuInv' | 'white'
function prep(card: Img, l: number, t: number, w: number, h: number, v: Variant, width = 1600): Img {
  const g = scaleToWidth(crop(card, l, t, w, h), width)
  if (v === 'white') return pad(whiteText(g))
  const n = grayNormalize(g)
  return pad(v === 'gray' ? n : threshold(n, 'otsu', v === 'otsuInv'))
}

export async function runOcrPlan(
  source: Img,
  engine: Engine,
  totals?: Set<number>,
  onStage?: (s: 'name' | 'number' | 'fullart', partial: ScanQuery) => void
): Promise<ScanQuery & { passes: number }> {
  const card = normalizeCard(source)
  const raw: string[] = []
  let passes = 0
  const run = async (img: Img, psm: Psm) => { passes++; const r = await engine(img, psm); if (r.text.trim()) raw.push(r.text.replace(/\s+/g, ' ').trim().slice(0, 200)); return r }

  // Name: dark text on light banner (gray/otsu) or white text on art (white mask).
  const names: { n: string; conf: number }[] = []
  for (const v of ['gray', 'otsu', 'white'] as Variant[])
    for (const [t, l] of [[0.035, 0.05], [0.055, 0.05]] as const) {
      const r = await run(prep(card, l, t, 0.6, 0.06, v), '7')
      const n = pickNameToken(r.text)
      if (n) names.push({ n, conf: r.conf * (n.length >= 4 ? 1 : 0.5) })
    }
  names.sort((a, b) => b.conf - a.conf)
  onStage?.('name', { name: names[0]?.n })

  const reads: NumberRead[] = []
  for (const v of ['gray', 'otsu'] as Variant[])
    for (const t of [0.9, 0.925, 0.94]) reads.push(...parseNumbers((await run(prep(card, 0, t, 1, 0.06, v), '11')).text, totals))
  onStage?.('number', { name: names[0]?.n })

  const first = voteNumber(reads).pick as (NumberRead & { votes: number }) | undefined
  if (!first || first.votes < 2) {
    onStage?.('fullart', { name: names[0]?.n })
    const stage2Start = passes
    // number sits bottom-left over art on SV/SWSH full-arts & SIRs: tight boxes, 4-5x upscale
    outer: for (const t of [0.935, 0.945, 0.925])
      for (const [l, w] of [[0.12, 0.26], [0.02, 0.32]] as const)
        for (const v of ['white', 'otsu', 'otsuInv'] as Variant[])
          for (const psm of ['11', '7'] as Psm[]) {
            if (passes - stage2Start >= STAGE2_PASS_CAP) break outer
            reads.push(...parseNumbers((await run(prep(card, l, t, w, 0.04, v, 1800), psm)).text, totals))
            const { pick } = voteNumber(reads)
            if (pick && (pick as NumberRead & { votes: number }).votes >= 2) break outer
          }
  }

  const { pick, agreement, alts } = voteNumber(reads)
  return { name: names[0]?.n, number: pick?.number, total: pick?.total, kind: pick?.kind, alts, agreement, rawText: raw.slice(0, 24), passes }
}
