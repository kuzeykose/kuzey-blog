import { ScanClient } from '../components/scan-client'
import { isWritable } from '../lib/collection'

export const metadata = {
  title: 'Scan a Pokémon card',
  description: 'Scan or upload a card photo. The image is read in the browser and then discarded.',
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  return <ScanClient writable={isWritable()} mode={mode} />
}
