import type { Weather } from './weather'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

// The season it is right now, north of the equator.
export function seasonNow(date = new Date()): Season {
  const m = date.getMonth()
  return m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'
}

// April showers, clear skies through summer and autumn, snow in winter.
export const SKY: Record<Season, Weather> = {
  spring: 'rain',
  summer: 'clear',
  autumn: 'clear',
  winter: 'snow',
}

// What comes loose when a tree is shaken: blossom in spring, green leaves
// in summer, its own colours in autumn and snow off the bare branches in
// winter.
export function treeFall(autumn: string[]): Record<Season, string[]> {
  return {
    spring: ['#fde6ee', '#f6b3c9', '#ffffff'],
    summer: ['#5f9a48', '#7fae5e', '#4a7f3a'],
    autumn,
    winter: ['#ffffff', '#eef3f8', '#dfe8f0'],
  }
}
