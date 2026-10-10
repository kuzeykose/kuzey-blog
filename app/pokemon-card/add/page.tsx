import { AddFlow } from '../components/add-flow'
import { getEnrichedCard, isWritable } from '../lib/collection'

export const metadata = {
  title: 'Add a Pokémon card',
  description: 'Search the Pokémon TCG API and add a card to the local collection file.',
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; q?: string }>
}) {
  const { id, q } = await searchParams
  const writable = isWritable()
  const editing = typeof id === 'string' && id ? await getEnrichedCard(id) : null

  return <AddFlow writable={writable} editing={editing} initialQuery={q} />
}
