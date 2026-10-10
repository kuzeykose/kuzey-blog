import { NextResponse } from 'next/server'
import { isWritable, upsertCard } from 'app/pokemon-card/lib/collection'
import { CONDITIONS, type CollectionEntry, type Condition } from 'app/pokemon-card/lib/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isWritable()) {
    return NextResponse.json(
      { error: 'Collection writes only work in local development (pnpm dev).' },
      { status: 403 }
    )
  }

  let body: {
    id?: string
    quantity?: number
    condition?: string
    printing?: string
    notes?: string
    mode?: 'add' | 'edit'
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const quantity = Number(body.quantity)
  const condition = body.condition
  const mode = body.mode === 'edit' ? 'edit' : 'add'

  if (!id || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
    return NextResponse.json({ error: 'id and quantity (1–99) are required' }, { status: 400 })
  }
  if (!CONDITIONS.includes(condition as Condition)) {
    return NextResponse.json({ error: 'Invalid condition' }, { status: 400 })
  }

  const entry: CollectionEntry = {
    id,
    quantity,
    condition: condition as Condition,
    printing: typeof body.printing === 'string' ? body.printing : undefined,
    notes: typeof body.notes === 'string' ? body.notes : '',
    added: new Date().toISOString().slice(0, 10),
  }

  const file = upsertCard(entry, mode)
  return NextResponse.json({ ok: true, cards: file.cards })
}
