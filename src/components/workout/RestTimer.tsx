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

export function RestTimer({ restString, onComplete, onSkip }: RestTimerProps) {
  const totalSeconds = parseRestSeconds(restString)
  const [remaining, setRemaining] = useState(totalSeconds)
  const [paused, setPaused] = useState(false)
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (paused || completed) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [paused, completed, clearTimer])

  useEffect(() => {
    if (remaining === 0 && !completed) {
      setCompleted(true)
      clearTimer()
      playBeep()
      if (navigator.vibrate) {
        navigator.vibrate(500)
      }
      onComplete()
    }
  }, [remaining, completed, clearTimer, onComplete])

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
            onClick={() => setPaused(p => !p)}
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
        >
          {completed ? 'Dismiss' : 'Skip'}
        </Button>
      </div>
    </div>
  )
}
