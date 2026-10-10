import { Suspense } from 'react'
import { CollectionBrowser } from '../components/collection-browser'
import { PageIntro, SectionTabs, SourceCredit } from '../components/ui'
import { getEnrichedCollection, isWritable } from '../lib/collection'

export const revalidate = 86400

export const metadata = {
  title: 'Pokémon card collection',
  description: 'Cards in the binders, with filters for set, type and rarity.',
}

export default async function Page() {
  const cards = await getEnrichedCollection()
  const writable = isWritable()

  return (
    <section>
      <PageIntro>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          A small record of what&apos;s in my binders. Prices are estimates.
        </p>
      </PageIntro>
      <SectionTabs active="collection" writable={writable} />
      <Suspense>
        <CollectionBrowser cards={cards} />
      </Suspense>
      <SourceCredit />
    </section>
  )
}
