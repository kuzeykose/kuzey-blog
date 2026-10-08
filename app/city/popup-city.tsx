'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowCounterClockwise,
  ArrowLeft,
  BookOpen,
  Book,
  Moon,
  Sun,
} from '@phosphor-icons/react/dist/ssr'
import type { CityStage } from './scene/stage'

type Status = 'loading' | 'ready' | 'error'

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
  const [night, setNight] = useState(false)
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

  // Once the book is open, show how to explore it for a little while.
  useEffect(() => {
    setHint(open)
    if (!open) return
    const t = setTimeout(() => setHint(false), 9000)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null

  const ink = night ? 'text-neutral-100' : 'text-neutral-800'
  const muted = night ? 'text-neutral-400' : 'text-neutral-500'
  const button = `inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
    night
      ? 'border-neutral-700 bg-neutral-900/70 text-neutral-100 hover:border-orange-600'
      : 'border-neutral-300 bg-white/70 text-neutral-800 hover:border-orange-600'
  }`

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-hidden transition-colors duration-700"
      style={{ background: night ? '#151823' : '#ece3d2' }}
    >
      <div
        ref={host}
        className="absolute inset-0"
        role="img"
        aria-label="A 3D pop-up book of New York City: the Empire State and Chrysler buildings, Times Square, the Flatiron, brownstones with water towers, a yellow cab, the Statue of Liberty and the Brooklyn Bridge rise out of the pages."
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

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
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
          <p className={`text-sm ${muted}`}>a pop-up city</p>
        </div>
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
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
            <button type="button" className={button} onClick={() => stage.current?.setOpen(!open)}>
              {open ? <Book size={16} /> : <BookOpen size={16} />}
              {open ? 'Close the book' : 'Open the book'}
            </button>
            <button
              type="button"
              className={button}
              aria-pressed={night}
              onClick={() => setNight((n) => !n)}
            >
              {night ? <Sun size={16} /> : <Moon size={16} />}
              {night ? 'Day' : 'Night'}
            </button>
            <button
              type="button"
              className={button}
              aria-label="Reset view"
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
