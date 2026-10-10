import { NextResponse } from 'next/server'
import { fetchSets } from 'app/pokemon-card/lib/tcg'

export async function GET() {
  try {
    const sets = await fetchSets()
    return NextResponse.json({ sets })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load sets'
    return NextResponse.json({ error: message, sets: [] }, { status: 502 })
  }
}
