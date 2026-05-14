'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

interface RestTimerProps {
  restString: string
  onComplete: () => void
  onSkip: () => void
}

function parseRestSeconds(rest: string): number {
  const lower = rest.toLowerCase().trim()

  // Handle ranges like "2:30–3:00 min" or "90–120s" - use the upper bound
  const rangeMatch = lower.match(/[\d:]+[–-]+([\d:]+)\s*(min|s|sec)?/)
  if (rangeMatch) {
    const upperValue = rangeMatch[1]
    const unit = rangeMatch[2]
    // Parse the upper bound time
    if (upperValue.includes(':')) {
      const [min, sec] = upperValue.split(':').map(v => parseInt(v))
      return min * 60 + (sec || 0)
    } else if (unit === 'min') {
      return parseInt(upperValue) * 60
    } else {
      return parseInt(upperValue)
    }
  }

  // Handle "m:ss" format like "2:30"
  const colonMatch = lower.match(/(\d+):(\d+)/)
  if (colonMatch) {
    const min = parseInt(colonMatch[1])
    const sec = parseInt(colonMatch[2])
    return min * 60 + sec
  }

  // "2min", "2 min"
  const minMatch = lower.match(/(\d+)\s*min/)
  if (minMatch) return parseInt(minMatch[1]) * 60

  // "90s", "90 s", "90 sec"
  const secMatch = lower.match(/(\d+)\s*s/)
  if (secMatch) return parseInt(secMatch[1])

  // Plain number
  const num = parseInt(lower)
  if (!isNaN(num)) return num

  return 60 // fallback
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

const TIMER_KEY = 'restTimer'

interface TimerState {
  startTime: number
  duration: number
  pausedAt?: number
  pausedElapsed?: number
}

export function RestTimer({ restString, onComplete, onSkip }: RestTimerProps) {
  const totalSeconds = parseRestSeconds(restString)
  const [remaining, setRemaining] = useState(totalSeconds)
  const [paused, setPaused] = useState(false)
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const pausedElapsedRef = useRef<number>(0)

  // Initialize or resume timer from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TIMER_KEY)
    if (stored) {
      try {
        const state: TimerState = JSON.parse(stored)

        // Check if this is the same timer (duration matches)
        if (state.duration === totalSeconds) {
          if (state.pausedAt) {
            // Timer was paused
            setPaused(true)
            pausedElapsedRef.current = state.pausedElapsed || 0
            const calculatedRemaining = Math.max(0, state.duration - pausedElapsedRef.current)
            setRemaining(calculatedRemaining)
            startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000
          } else {
            // Timer was running - calculate current position
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
            const calculatedRemaining = Math.max(0, state.duration - elapsed)

            if (calculatedRemaining === 0) {
              setCompleted(true)
              setRemaining(0)
              localStorage.removeItem(TIMER_KEY)
            } else {
              setRemaining(calculatedRemaining)
              startTimeRef.current = state.startTime
            }
          }
        } else {
          // Different timer - start fresh
          localStorage.removeItem(TIMER_KEY)
          startTimeRef.current = Date.now()
        }
      } catch (e) {
        // Invalid state, start fresh
        localStorage.removeItem(TIMER_KEY)
        startTimeRef.current = Date.now()
      }
    } else {
      startTimeRef.current = Date.now()
    }
  }, [totalSeconds])

  // Save timer state to localStorage
  const saveTimerState = useCallback(() => {
    if (completed) {
      localStorage.removeItem(TIMER_KEY)
      return
    }

    const state: TimerState = {
      startTime: startTimeRef.current,
      duration: totalSeconds,
    }

    if (paused) {
      state.pausedAt = Date.now()
      state.pausedElapsed = pausedElapsedRef.current
    }

    localStorage.setItem(TIMER_KEY, JSON.stringify(state))
  }, [totalSeconds, paused, completed])

  // Update timer based on elapsed time
  useEffect(() => {
    if (paused || completed) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      saveTimerState()
      return
    }

    // Update remaining time based on actual elapsed time
    const updateRemaining = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const calculatedRemaining = Math.max(0, totalSeconds - elapsed)
      setRemaining(calculatedRemaining)

      if (calculatedRemaining === 0 && !completed) {
        setCompleted(true)
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        playBeep()
        if (navigator.vibrate) {
          navigator.vibrate(500)
        }
        localStorage.removeItem(TIMER_KEY)
        onComplete()
      }
    }

    updateRemaining() // Initial update
    intervalRef.current = setInterval(updateRemaining, 100) // Check every 100ms for accuracy
    saveTimerState()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [paused, completed, totalSeconds, saveTimerState, onComplete])

  // Handle pause/resume
  const handlePauseToggle = () => {
    if (paused) {
      // Resuming - adjust start time to account for paused duration
      const pausedDuration = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedElapsedRef.current
      startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000
      setPaused(false)
    } else {
      // Pausing - store elapsed time
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      pausedElapsedRef.current = elapsed
      setPaused(true)
    }
  }

  // Clean up on unmount or skip
  useEffect(() => {
    return () => {
      if (completed) {
        localStorage.removeItem(TIMER_KEY)
      }
    }
  }, [completed])

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 1
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeDisplay = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`

  // SVG circle
  const size = 120
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className="glass-card p-4 flex flex-col items-center gap-3">
      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Rest Timer</h4>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={completed ? 'rgb(0, 255, 148)' : 'rgb(0, 210, 255)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${completed ? 'text-accent-green' : 'text-text-primary'}`}>
            {completed ? 'Done' : timeDisplay}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {!completed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePauseToggle}
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem(TIMER_KEY)
            onSkip()
          }}
        >
          {completed ? 'Dismiss' : 'Skip'}
        </Button>
      </div>
    </div>
  )
}
