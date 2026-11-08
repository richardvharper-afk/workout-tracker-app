'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const TIMER_KEY = 'restTimer.v2'
const DONE_DISMISS_MS = 4000

export function parseRestSeconds(rest: string): number {
  const lower = rest.toLowerCase().trim()

  // Ranges like "2:30–3:00 min" or "90–120s" - use the upper bound
  const rangeMatch = lower.match(/[\d:]+[–-]+([\d:]+)\s*(min|s|sec)?/)
  if (rangeMatch) {
    const upperValue = rangeMatch[1]
    const unit = rangeMatch[2]
    if (upperValue.includes(':')) {
      const [min, sec] = upperValue.split(':').map(v => parseInt(v))
      return min * 60 + (sec || 0)
    } else if (unit === 'min') {
      return parseInt(upperValue) * 60
    }
    return parseInt(upperValue)
  }

  const colonMatch = lower.match(/(\d+):(\d+)/)
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])

  const minMatch = lower.match(/(\d+)\s*min/)
  if (minMatch) return parseInt(minMatch[1]) * 60

  const secMatch = lower.match(/(\d+)\s*s/)
  if (secMatch) return parseInt(secMatch[1])

  const num = parseInt(lower)
  if (!isNaN(num)) return num

  return 60
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio not available
  }
}

/** Persisted shape. Elapsed time is derived from timestamps so it survives navigation/reload. */
interface StoredTimer {
  duration: number // seconds
  startTime: number // ms epoch (adjusted on resume)
  pausedElapsed: number | null // seconds elapsed when paused, null if running
}

export interface RestTimerContextValue {
  active: boolean
  duration: number
  remaining: number
  paused: boolean
  completed: boolean
  start: (restString: string) => void
  togglePause: () => void
  /** Add or remove seconds (e.g. +15 / -15) while the timer is active */
  adjust: (deltaSeconds: number) => void
  dismiss: () => void
}

const RestTimerContext = createContext<RestTimerContextValue | null>(null)

export function useRestTimer(): RestTimerContextValue {
  const ctx = useContext(RestTimerContext)
  if (!ctx) throw new Error('useRestTimer must be used within RestTimerProvider')
  return ctx
}

function load(): StoredTimer | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    return raw ? (JSON.parse(raw) as StoredTimer) : null
  } catch {
    return null
  }
}

function save(timer: StoredTimer | null) {
  try {
    if (timer) localStorage.setItem(TIMER_KEY, JSON.stringify(timer))
    else localStorage.removeItem(TIMER_KEY)
  } catch {
    // Storage unavailable
  }
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<StoredTimer | null>(null)
  const [completed, setCompleted] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const completedRef = useRef(false)
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDismissTimeout = () => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current)
      dismissTimeoutRef.current = null
    }
  }

  // Restore on first mount (handles reloads; navigation never unmounts the provider)
  useEffect(() => {
    const stored = load()
    if (!stored) return
    if (stored.pausedElapsed === null) {
      const elapsed = (Date.now() - stored.startTime) / 1000
      if (elapsed >= stored.duration) {
        save(null) // Finished while away - drop silently
        return
      }
    }
    setTimer(stored)
  }, [])

  const dismiss = useCallback(() => {
    clearDismissTimeout()
    completedRef.current = false
    setCompleted(false)
    setTimer(null)
    save(null)
  }, [])

  const start = useCallback((restString: string) => {
    clearDismissTimeout()
    completedRef.current = false
    setCompleted(false)
    const next: StoredTimer = {
      duration: parseRestSeconds(restString),
      startTime: Date.now(),
      pausedElapsed: null,
    }
    setNow(Date.now())
    setTimer(next)
    save(next)
  }, [])

  const togglePause = useCallback(() => {
    setTimer(prev => {
      if (!prev || completedRef.current) return prev
      let next: StoredTimer
      if (prev.pausedElapsed === null) {
        next = { ...prev, pausedElapsed: Math.floor((Date.now() - prev.startTime) / 1000) }
      } else {
        next = { ...prev, startTime: Date.now() - prev.pausedElapsed * 1000, pausedElapsed: null }
      }
      save(next)
      return next
    })
  }, [])

  const adjust = useCallback((deltaSeconds: number) => {
    setTimer(prev => {
      if (!prev || completedRef.current) return prev
      const next: StoredTimer = { ...prev, duration: Math.max(5, prev.duration + deltaSeconds) }
      save(next)
      return next
    })
    setNow(Date.now())
  }, [])

  const running = !!timer && timer.pausedElapsed === null && !completed

  // Tick while running
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  // Re-sync immediately when the tab/PWA returns to the foreground
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const elapsed = !timer
    ? 0
    : timer.pausedElapsed !== null
    ? timer.pausedElapsed
    : Math.floor((now - timer.startTime) / 1000)
  const remaining = timer ? Math.max(0, timer.duration - elapsed) : 0

  // Completion
  useEffect(() => {
    if (!timer || timer.pausedElapsed !== null || completedRef.current) return
    if (remaining > 0) return
    completedRef.current = true
    setCompleted(true)
    save(null)
    playBeep()
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(500)
    dismissTimeoutRef.current = setTimeout(dismiss, DONE_DISMISS_MS)
  }, [timer, remaining, dismiss])

  useEffect(() => clearDismissTimeout, [])

  const value: RestTimerContextValue = {
    active: !!timer,
    duration: timer?.duration ?? 0,
    remaining,
    paused: !!timer && timer.pausedElapsed !== null,
    completed,
    start,
    togglePause,
    adjust,
    dismiss,
  }

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>
}
