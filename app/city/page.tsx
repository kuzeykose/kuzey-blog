import type { Metadata } from 'next'
import PopupCity from './popup-city'

export const metadata: Metadata = {
  title: 'City',
  description: 'New York City as a paper pop-up book, unfolding in 3D.',
}

export default function Page() {
  return <PopupCity />
}
