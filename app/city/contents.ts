// The book's table of contents. Every spread is one place, in page order:
// a chapter's own spread, then its sections. The stage builds the spreads
// in this order and the contents page lists it, so they always agree.

export type Chapter = { title: string; sections?: string[] }

export const CHAPTERS: Chapter[] = [
  // Up the island from the harbour, then across the river.
  { title: 'Manhattan', sections: ['Lower Manhattan', 'Midtown', 'Times Square', 'Central Park'] },
  { title: 'Brooklyn' },
]

export const PAGES = CHAPTERS.flatMap((c) => [c.title, ...(c.sections ?? [])])

// The printed number on the left-hand page of spread `i`.
export const pageNumber = (i: number) => 14 + i * 2
