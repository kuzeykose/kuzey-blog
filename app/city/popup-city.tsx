'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Book,
  CloudRain,
  ListBullets,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
} from '@phosphor-icons/react/dist/ssr'
import type { CityStage } from './scene/stage'
import type { Weather } from './scene/weather'
import { CHAPTERS, PAGES, pageNumber } from './contents'

type Status = 'loading' | 'ready' | 'error'


// The weather button steps through these.
const WEATHER: { kind: Weather; name: string; Icon: typeof Sun }[] = [
  { kind: 'clear', name: 'Clear', Icon: CloudSun },
  { kind: 'rain', name: 'Rain', Icon: CloudRain },
  { kind: 'snow', name: 'Snow', Icon: Snowflake },
]

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

export default function PopupCity() {
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [night, setNight] = useState(false)
  const [weather, setWeather] = useState(0)
  const [contentsOpen, setContentsOpen] = useState(false)
  const contentsButton = useRef<HTMLButtonElement>(null)
  const contentsPanel = useRef<HTMLElement>(null)
  const [label, setLabel] = useState<string | null>(null)
  const [hint, setHint] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<CityStage | null>(null)

  useEffect(() => {
    setMounted(true)
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (!mounted || !host.current) return
    if (!webglAvailable()) {
      setStatus('error')
      return
    }
    let cancelled = false
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setNight(prefersDark)

    import('./scene/stage')
      .then(({ CityStage }) => {
        if (cancelled || !host.current) return
        const s = new CityStage(host.current, {
          night: prefersDark,
          reducedMotion,
          events: {
            onProgress: setProgress,
            onHover: setLabel,
            onOpenChange: setOpen,
            onPageChange: setPage,
            onReady: () => setStatus('ready'),
          },
        })
        stage.current = s
        if (process.env.NODE_ENV !== 'production') (window as any).__cityStage = s
        return s.build()
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      stage.current?.dispose()
      stage.current = null
    }
  }, [mounted])

  useEffect(() => {
    stage.current?.setNight(night)
  }, [night])

  // (Re-sent once the stage is ready, in case it was picked while loading.)
  useEffect(() => {
    stage.current?.setWeather(WEATHER[weather].kind)
  }, [weather, status])

  // Arrow keys turn the pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') stage.current?.setPage(page + 1)
      if (e.key === 'ArrowLeft') stage.current?.setPage(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page])

  // The contents page: focus the page you're on, and close on Escape or a
  // click anywhere else.
  useEffect(() => {
    if (!contentsOpen) return
    const panel = contentsPanel.current
    const here = panel?.querySelector<HTMLButtonElement>('[aria-current="page"]') ?? panel?.querySelector('button')
    here?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setContentsOpen(false)
      contentsButton.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!panel?.contains(target) && !contentsButton.current?.contains(target)) setContentsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [contentsOpen])

  // Once the book is open, show how to explore it for a little while.
  useEffect(() => {
    setHint(open)
    if (!open) return
    const t = setTimeout(() => setHint(false), 9000)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null

  const goTo = (i: number) => {
    stage.current?.setPage(i)
    setContentsOpen(false)
  }
  const entry = (name: string, chapter: boolean) => {
    const i = PAGES.indexOf(name)
    const here = open && i === page
    return (
      <button
        type="button"
        aria-current={here ? 'page' : undefined}
        onClick={() => goTo(i)}
        className={`flex w-full items-baseline gap-2 rounded px-1.5 py-1 text-left transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
          chapter ? 'font-serif text-base italic' : 'text-sm'
        } ${here ? 'text-orange-600' : ink}`}
      >
        <span>{name}</span>
        <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-current opacity-40" />
        <span className={`text-xs tabular-nums ${here ? '' : muted}`}>{pageNumber(i)}</span>
      </button>
    )
  }

  // With a page either side, small screens show just the arrows.
  const pageName = page > 0 && page < PAGES.length - 1 ? 'hidden sm:inline' : ''
  const sky = WEATHER[weather]
  const nextSky = WEATHER[(weather + 1) % WEATHER.length]
  const ink = night ? 'text-neutral-100' : 'text-neutral-800'
  const muted = night ? 'text-neutral-400' : 'text-neutral-500'
  const chip = `inline-flex items-center justify-center gap-2 rounded-full border text-sm backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
    night
      ? 'border-neutral-700 bg-neutral-900/70 text-neutral-100 hover:border-orange-600'
      : 'border-neutral-300 bg-white/70 text-neutral-800 hover:border-orange-600'
  }`
  const button = `${chip} px-3.5 py-2`
  const round = `${chip} p-2.5`
  // Just the icon on small screens; the words stay for screen readers.
  const roundUntilSm = `${chip} p-2.5 sm:px-3.5 sm:py-2`
  const wordsFromSm = 'sr-only sm:not-sr-only'

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-hidden transition-colors duration-700"
      style={{ background: night ? '#151823' : '#ece3d2' }}
    >
      <div
        ref={host}
        className="absolute inset-0"
        role="img"
        aria-label="A 3D pop-up book of New York City. Manhattan: the Empire State and Chrysler buildings, One World Trade Center, Times Square, the Flatiron, brownstones with water towers, a yellow cab, the Statue of Liberty and the Brooklyn Bridge. Then Manhattan up close: Lower Manhattan from the harbor, with the Oculus, Trinity Church, the Stock Exchange and the Charging Bull facing Fearless Girl; Midtown up Fifth Avenue, with Rockefeller Center's rink, Radio City, St. Patrick's, Grand Central and the library lions; Times Square, with the New Year's Eve ball, the news ticker, billboards and the red steps; and Central Park in autumn, with Bethesda Terrace, Bow Bridge, Belvedere Castle and a horse and carriage. Last, Brooklyn: DUMBO and the Manhattan Bridge, Barclays Center, Grand Army Plaza and the Botanic Garden's cherry blossoms, a carousel, and Coney Island's Wonder Wheel, Cyclone and Parachute Jump; then DUMBO's waterfront between the Brooklyn and Manhattan bridges, with Jane's Carousel, the Clock Tower, Empire Stores, a ferry, a wedding shoot and the line for pizza."
        onPointerDown={() => setHint(false)}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: night
            ? 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.45) 100%)'
            : 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(90,60,30,0.14) 100%)',
        }}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 text-sm transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded ${muted}`}
          >
            <ArrowLeft size={14} weight="bold" />
            kuzey kose
          </Link>
          <h1 className={`mt-3 font-serif text-2xl italic tracking-tight sm:text-3xl ${ink}`}>
            New York, New York
          </h1>
          <p className={`text-sm ${muted}`}>a pop-up city · {PAGES[page]}</p>
        </div>
        {status !== 'error' && (
          <div className="pointer-events-auto flex shrink-0 gap-2">
            <button type="button" className={roundUntilSm} aria-pressed={night} onClick={() => setNight((n) => !n)}>
              {night ? <Sun size={16} /> : <Moon size={16} />}
              <span className={wordsFromSm}>{night ? 'Day' : 'Night'}</span>
            </button>
            <button
              type="button"
              className={roundUntilSm}
              aria-label={`Weather: ${sky.name}. Change to ${nextSky.name.toLowerCase()}`}
              onClick={() => setWeather((w) => (w + 1) % WEATHER.length)}
            >
              <sky.Icon size={16} />
              <span className={wordsFromSm}>{sky.name}</span>
            </button>
            <button
              type="button"
              className={round}
              aria-label={open ? 'Close the book' : 'Open the book'}
              title={open ? 'Close the book' : 'Open the book'}
              onClick={() => stage.current?.setOpen(!open)}
            >
              {open ? <Book size={16} /> : <BookOpen size={16} />}
            </button>
          </div>
        )}
      </header>

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <p className={`max-w-sm text-sm ${muted}`}>
            This page needs WebGL to fold the paper city, and it isn&apos;t available in this browser.
          </p>
        </div>
      )}

      {status !== 'error' && (
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 sm:p-6">
          <div
            aria-live="polite"
            className={`h-6 text-sm transition-opacity duration-200 ${ink} ${label ? 'opacity-100' : 'opacity-0'}`}
          >
            {label}
          </div>
          <div className="pointer-events-auto relative flex flex-wrap items-center justify-center gap-2">
            {contentsOpen && (
              <nav
                id="city-contents"
                ref={contentsPanel}
                aria-label="Contents"
                className={`absolute bottom-full left-1/2 mb-3 w-[min(19rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border p-5 shadow-xl ${
                  night ? 'border-neutral-700 bg-[#1d2030]' : 'border-neutral-300 bg-[#fbf6ea]'
                }`}
              >
                <h2 className={`px-1.5 font-serif text-xl italic ${ink}`}>Contents</h2>
                <ol className="mt-3 space-y-1">
                  {CHAPTERS.map((chapter) => (
                    <li key={chapter.title}>
                      {entry(chapter.title, true)}
                      {chapter.sections && (
                        <ol className="mt-0.5 space-y-0.5 pl-4">
                          {chapter.sections.map((name) => (
                            <li key={name}>{entry(name, false)}</li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <button
              type="button"
              ref={contentsButton}
              className={button}
              aria-expanded={contentsOpen}
              aria-controls="city-contents"
              onClick={() => setContentsOpen((o) => !o)}
            >
              <ListBullets size={16} />
              Contents
            </button>
            {open && (
              // The arrows stay together when the row wraps.
              <span className="flex gap-2">
                {page > 0 && (
                  <button
                    type="button"
                    className={button}
                    aria-label={`Back to ${PAGES[page - 1]}`}
                    onClick={() => stage.current?.setPage(page - 1)}
                  >
                    <ArrowLeft size={16} />
                    <span className={pageName}>{PAGES[page - 1]}</span>
                  </button>
                )}
                {page < PAGES.length - 1 && (
                  <button
                    type="button"
                    className={button}
                    aria-label={`On to ${PAGES[page + 1]}`}
                    onClick={() => stage.current?.setPage(page + 1)}
                  >
                    <span className={pageName}>{PAGES[page + 1]}</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </span>
            )}
            <button
              type="button"
              className={round}
              aria-label="Reset view"
              title="Reset view"
              onClick={() => stage.current?.resetView()}
            >
              <ArrowCounterClockwise size={16} />
            </button>
          </div>
          {status === 'loading' ? (
            <p className={`text-xs ${muted}`}>Cutting paper… {Math.round(progress * 100)}%</p>
          ) : open ? (
            <p className={`text-xs transition-opacity duration-700 ${muted} ${hint ? 'opacity-100' : 'opacity-0'}`}>
              Drag to look around · scroll to zoom · tap the paper
            </p>
          ) : (
            <p className={`text-xs motion-safe:animate-pulse ${muted}`}>Tap the book to open it</p>
          )}
        </footer>
      )}
    </div>,
    document.body
  )
}
