import { NextResponse } from 'next/server'
import { recognizeCard } from 'app/pokemon-card/lib/scan/recognize'
import { tcgApiKey } from 'app/pokemon-card/lib/tcg-key'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_BYTES = 4 * 1024 * 1024

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'image required' }, { status: 400 })
  }

  const file = form.get('image')
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'image required' }, { status: 400 })
  }
  if (file.size > MAX_BYTES || (file.type && !file.type.startsWith('image/'))) {
    return NextResponse.json({ error: 'invalid image' }, { status: 413 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await recognizeCard(buffer, { apiKey: tcgApiKey() || undefined })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
