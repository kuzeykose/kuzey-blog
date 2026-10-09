import { Sketch } from './sketch'
import { C } from './palette'
import { skyBackdrop, empireState, chrysler, liberty, brooklynBridge, oneWorldTrade, spireBagel } from './art-landmarks'
import { LEFT_HOUSES, RIGHT_HOUSES, brownstones, farSkyline, flatiron, midriseRow, timesSquare } from './art-buildings'
import {
  blimp,
  cloud,
  commuters,
  dogWalker,
  hotAirBalloon,
  hotDogCart,
  pizzaRat,
  pizzaSlice,
  readerAndKid,
  steamStack,
  streetLamp,
  streetTree,
  subwayEntrance,
  taxi,
} from './art-street'

export type Poke = 'tilt' | 'lift' | 'drive' | 'run' | 'spin' | 'drop' | 'twirl'

export type PieceDef = {
  id: string
  label: string
  art: (s: Sketch) => void
  nightArt?: (s: Sketch) => void
  w: number
  h: number
  // Spread position of the middle of the piece's base. x runs across the
  // book (gutter at 0), z towards the reader.
  x: number
  z: number
  ry?: number
  // Draw size multiplier (the art keeps its own units).
  scale?: number
  // 0 = first to rise (back of the scene), 1 = last (front).
  order: number
  seed: number
  glow?: boolean
  padBottom?: boolean
  // Glued onto another piece instead of the page: offset from the parent's
  // base centre (dx, dy) and standing off its face by dz.
  parent?: string
  offset?: [number, number, number]
  // Rides on top of the stepped platform.
  mount?: 'platform'
  bob?: { amp: number; speed: number; sway?: number }
  poke?: Poke
  // For 'run': waypoints (x, z) from its hiding place out to where it stops
  // and looks around, and which way it faces while hiding.
  run?: { path: [number, number][]; face: 1 | -1 }
  // Poking this piece also sends these runners off.
  startles?: string
  // Poke it by itself once the book has finished opening.
  pokeOnOpen?: boolean
  // For 'spin': turns about this art point, slowly (rad/s) when left alone.
  spin?: { at: [number, number]; idle: number }
  // Reuse another piece's art (by id) instead of painting it again.
  sameArtAs?: string
  // A point light at this art position after dark (warm unless coloured).
  lamp?: [number, number]
  lampColor?: string
  // Poking it shakes petals (or leaves, or confetti) loose from these art
  // circles (x, y, radius), in these colours (cherry blossom unless given).
  petals?: { from: [number, number, number][]; colors?: string[]; count?: number; confetti?: boolean }
  // For 'drop': slides down this far (art units) and back up again,
  // shaking its petals loose when it lands.
  drop?: number
  // A scrolling news ticker over this band of the art (centre x, y; size).
  ticker?: { text: string; at: [number, number]; w: number; h: number }
  // Sky paper (backdrops, clouds): greys under rain, never gathers snow.
  sky?: boolean
}

// Where the ring-toss bagel rests on the Chrysler's crown.
const RING_Y = 5.28

export const PIECES: PieceDef[] = [
  {
    id: 'sky',
    label: 'The sky over Manhattan',
    art: (s) => skyBackdrop(s, false),
    nightArt: (s) => skyBackdrop(s, true),
    w: 11.6,
    h: 7.4,
    x: 0,
    z: -4.75,
    order: 0,
    seed: 101,
    glow: true,
    sky: true,
  },
  {
    id: 'balloon-left',
    label: 'Hot air balloon',
    art: (s) => hotAirBalloon(s, [C.red, '#f6ead2']),
    w: 1.2,
    h: 1.75,
    x: -5.0,
    z: 0,
    parent: 'sky',
    offset: [-5.0, 5.15, -0.14],
    order: 0,
    seed: 102,
    padBottom: true,
    bob: { amp: 0.07, speed: 0.9, sway: 0.03 },
    poke: 'lift',
  },
  {
    id: 'balloon-right',
    label: 'Hot air balloon',
    art: (s) => hotAirBalloon(s, [C.navy, C.taxi]),
    w: 1.2,
    h: 1.75,
    x: 4.6,
    z: 0,
    parent: 'sky',
    offset: [4.6, 5.5, -0.14],
    order: 0,
    seed: 103,
    padBottom: true,
    bob: { amp: 0.06, speed: 0.75, sway: 0.03 },
    poke: 'lift',
  },
  {
    id: 'cloud-left',
    label: 'A cloud',
    art: cloud,
    w: 1.9,
    h: 0.8,
    x: -3.4,
    z: 0,
    parent: 'sky',
    offset: [-3.4, 4.75, 0.12],
    order: 0,
    seed: 104,
    padBottom: true,
    bob: { amp: 0.04, speed: 0.45 },
    poke: 'lift',
    sky: true,
  },
  {
    id: 'cloud-right',
    label: 'A cloud',
    art: cloud,
    w: 1.9,
    h: 0.8,
    x: 3.3,
    z: 0,
    parent: 'sky',
    offset: [3.3, 5.6, 0.12],
    order: 0,
    seed: 105,
    padBottom: true,
    bob: { amp: 0.04, speed: 0.5 },
    poke: 'lift',
    sky: true,
  },
  {
    id: 'blimp',
    label: 'The blimp',
    art: blimp,
    w: 2.6,
    h: 1.0,
    x: -1.2,
    z: 0,
    parent: 'sky',
    offset: [-1.2, 6.0, 0.22],
    order: 0,
    seed: 106,
    padBottom: true,
    glow: true,
    bob: { amp: 0.08, speed: 0.55, sway: 0.025 },
    poke: 'lift',
  },
  {
    id: 'far',
    label: 'Lower Manhattan skyline',
    art: farSkyline,
    w: 12.6,
    h: 5.0,
    x: 0,
    z: -4.25,
    order: 0.08,
    seed: 201,
    glow: true,
  },
  {
    id: 'wtc',
    label: 'One World Trade Center',
    art: oneWorldTrade,
    w: 1.5,
    h: 7.35,
    x: -3.75,
    z: -3.7,
    order: 0.12,
    seed: 305,
    glow: true,
    poke: 'tilt',
  },
  {
    id: 'esb',
    label: 'Empire State Building',
    art: empireState,
    w: 2.6,
    h: 7.0,
    x: 1.45,
    z: -3.4,
    order: 0.16,
    seed: 301,
    glow: true,
    poke: 'tilt',
  },
  {
    id: 'chrysler',
    label: 'Chrysler Building',
    art: chrysler,
    w: 2.0,
    h: 6.3,
    x: -1.85,
    z: -3.1,
    order: 0.2,
    seed: 302,
    glow: true,
    poke: 'tilt',
  },
  {
    // Easter egg: a bagel ring-tossed onto the spire.
    id: 'bagel',
    label: 'Ring toss: one everything bagel',
    art: (s) => spireBagel(s, RING_Y),
    w: 0.62,
    h: 0.3,
    x: -1.85,
    z: 0,
    parent: 'chrysler',
    offset: [0, RING_Y, 0.03],
    order: 0.2,
    seed: 1102,
    padBottom: true,
    poke: 'lift',
  },
  {
    id: 'flatiron',
    label: 'Flatiron Building',
    art: flatiron,
    w: 2.3,
    h: 4.5,
    x: -6.35,
    z: -1.3,
    ry: 0.6,
    order: 0.26,
    seed: 303,
    glow: true,
    poke: 'tilt',
  },
  {
    id: 'times',
    label: 'Times Square',
    art: timesSquare,
    w: 2.3,
    h: 4.9,
    x: 6.35,
    z: -1.3,
    ry: -0.6,
    order: 0.26,
    seed: 304,
    glow: true,
    poke: 'tilt',
  },
  {
    id: 'midrise',
    label: 'Midtown walk-ups and water towers',
    art: midriseRow,
    w: 13.0,
    h: 4.3,
    x: 0,
    z: -2.15,
    order: 0.34,
    seed: 401,
    glow: true,
  },
  {
    id: 'brown-left',
    label: 'Brownstones',
    art: (s) => brownstones(s, LEFT_HOUSES),
    w: 3.35,
    h: 3.45,
    x: -3.3,
    z: -0.95,
    order: 0.46,
    seed: 501,
    glow: true,
    poke: 'tilt',
  },
  {
    id: 'brown-right',
    label: 'Brownstones',
    art: (s) => brownstones(s, RIGHT_HOUSES),
    w: 3.35,
    h: 3.45,
    x: 3.3,
    z: -0.95,
    order: 0.46,
    seed: 502,
    glow: true,
    poke: 'tilt',
  },
  {
    id: 'subway',
    label: 'Subway',
    art: subwayEntrance,
    w: 1.7,
    h: 1.42,
    x: -4.1,
    z: 0.1,
    order: 0.58,
    seed: 1201,
    glow: true,
    poke: 'tilt',
    lamp: [0.14, 1.29],
    lampColor: '#9dffb0',
  },
  {
    id: 'tree-left',
    label: 'Street tree',
    art: streetTree,
    w: 1.3,
    h: 1.9,
    x: -2.2,
    z: -0.3,
    order: 0.54,
    seed: 601,
    poke: 'tilt',
  },
  {
    id: 'tree-right',
    label: 'Street tree',
    art: streetTree,
    w: 1.3,
    h: 1.9,
    x: 2.25,
    z: -0.3,
    order: 0.54,
    seed: 602,
    poke: 'tilt',
  },
  {
    id: 'lamp-left',
    label: 'Street lamp',
    art: streetLamp,
    w: 0.6,
    h: 2.05,
    x: -2.45,
    z: 1.0,
    order: 0.64,
    seed: 701,
    glow: true,
    poke: 'tilt',
    lamp: [0.42, 1.69],
  },
  {
    id: 'lamp-right',
    label: 'Street lamp',
    art: streetLamp,
    w: 0.6,
    h: 2.05,
    x: 2.45,
    z: 1.9,
    order: 0.66,
    seed: 702,
    glow: true,
    poke: 'tilt',
    lamp: [0.42, 1.69],
  },
  {
    id: 'liberty',
    label: 'Statue of Liberty',
    art: liberty,
    w: 1.8,
    h: 3.95,
    x: -5.6,
    z: 1.25,
    ry: 0.3,
    order: 0.6,
    seed: 801,
    glow: true,
    poke: 'tilt',
    lamp: [0.53, 3.86],
  },
  {
    // Easter egg: Lady Liberty swapped her tablet for a slice.
    id: 'liberty-slice',
    label: "Lady Liberty's lunch",
    art: pizzaSlice,
    w: 0.7,
    h: 0.85,
    scale: 0.42,
    x: -5.34,
    z: 0,
    parent: 'liberty',
    offset: [0.26, 2.4, 0.04],
    order: 0.6,
    seed: 1101,
    padBottom: true,
    poke: 'tilt',
  },
  {
    id: 'bridge',
    label: 'Brooklyn Bridge',
    art: brooklynBridge,
    w: 5.0,
    h: 2.7,
    x: 5.6,
    z: 1.3,
    order: 0.62,
    seed: 802,
    glow: true,
    poke: 'tilt',
  },
  {
    id: 'taxi',
    label: 'Yellow cab',
    art: taxi,
    w: 2.0,
    h: 0.95,
    x: 0,
    z: 0.25,
    mount: 'platform',
    order: 0.78,
    seed: 901,
    glow: true,
    poke: 'drive',
    startles: 'rat',
    pokeOnOpen: true,
  },
  {
    // Easter egg: hides behind the cab with only its tail showing; poke it
    // (or honk the cab) and it dashes out across the zebra crossing.
    id: 'rat',
    label: 'Pizza rat',
    art: pizzaRat,
    w: 1.1,
    h: 0.42,
    x: 0.92,
    z: -0.1,
    scale: 0.65,
    mount: 'platform',
    order: 0.8,
    seed: 1103,
    poke: 'run',
    run: {
      path: [
        [0.92, -0.1],
        [1.3, 0.1],
        [1.2, 0.7],
        [-0.5, 0.7],
      ],
      face: -1,
    },
  },
  {
    id: 'cart',
    label: 'Hot dog cart',
    art: hotDogCart,
    w: 1.4,
    h: 1.6,
    x: -3.15,
    z: 2.15,
    scale: 1.15,
    order: 0.74,
    seed: 902,
    poke: 'tilt',
  },
  {
    id: 'steam',
    label: 'Steam from the street',
    art: steamStack,
    w: 0.7,
    h: 1.9,
    x: 2.7,
    z: 2.6,
    scale: 1.1,
    order: 0.76,
    seed: 903,
    bob: { amp: 0.0, speed: 1.4, sway: 0.05 },
    poke: 'tilt',
  },
  {
    id: 'commuters',
    label: 'New Yorkers',
    art: commuters,
    w: 1.6,
    h: 1.35,
    x: -1.8,
    z: 3.45,
    scale: 1.3,
    order: 0.86,
    seed: 1001,
    poke: 'tilt',
  },
  {
    id: 'dog',
    label: 'A walk in the rain',
    art: dogWalker,
    w: 1.8,
    h: 1.75,
    x: 0.5,
    z: 3.25,
    scale: 1.15,
    order: 0.92,
    seed: 1002,
    poke: 'tilt',
  },
  {
    id: 'kid',
    label: 'A red balloon',
    art: readerAndKid,
    w: 1.6,
    h: 1.85,
    x: 2.75,
    z: 3.15,
    scale: 1.15,
    order: 0.88,
    seed: 1003,
    poke: 'tilt',
  },
]

// The stepped platform in the middle (a V-fold, like the photo's stairs).
export const PLATFORM = {
  order: 0.66,
  step: 0.3,
  tiers: [
    { a: 2.0, back: -0.75, side: 1.55, tip: 2.6 },
    { a: 1.7, back: -0.65, side: 1.2, tip: 2.05 },
    { a: 1.4, back: -0.55, side: 0.85, tip: 1.5 },
  ],
}
