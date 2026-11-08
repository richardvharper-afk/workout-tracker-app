'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { useRestTimer } from '@/components/providers/RestTimerProvider'

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

/** Full rest timer card. Reads shared timer state, so it persists across pages. */
export function RestTimer() {
  const { active, duration, remaining, paused, completed, togglePause, dismiss } = useRestTimer()
  if (!active) return null

  const progress = duration > 0 ? (duration - remaining) / duration : 1

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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
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
            {completed ? 'Done' : formatTime(remaining)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {!completed && (
          <Button variant="ghost" size="sm" onClick={togglePause}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={dismiss}>
          {completed ? 'Dismiss' : 'Skip'}
        </Button>
      </div>
    </div>
  )
}
