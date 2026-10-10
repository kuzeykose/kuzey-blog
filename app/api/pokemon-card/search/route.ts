import { NextResponse } from 'next/server'
import { searchCards } from 'app/pokemon-card/lib/tcg'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const set = searchParams.get('set') ?? undefined

  if (!q.trim()) {
    return NextResponse.json({ cards: [] })
  }

  try {
    const cards = await searchCards(q, set)
    return NextResponse.json({ cards })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
