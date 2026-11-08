'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useRestTimer } from '@/components/providers/RestTimerProvider'
import { formatTime } from './RestTimer'
import { getTimerTone, TONE_COLORS } from './timerStyle'

function MiniRing({ progress, stroke }: { progress: number; stroke: string }) {
  const size = 34
  const sw = 4
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={sw} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
      />
    </svg>
  )
}

/**
 * Compact timer pill shown above the bottom nav on every page except the
 * workout detail page (which shows the full timer card inline).
 */
export function FloatingRestTimer() {
  const { active, duration, remaining, paused, completed, togglePause, dismiss } = useRestTimer()
  const pathname = usePathname()

  if (!active) return null
  if (pathname?.startsWith('/workouts/')) return null

  const tone = getTimerTone(remaining, completed)
  const { stroke, glow, text } = TONE_COLORS[tone]
  const progress = duration > 0 ? (duration - remaining) / duration : 1

  return (
    <div
      className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(4rem + var(--safe-area-inset-bottom) + 0.5rem)' }}
    >
      <div
        className={`pointer-events-auto glass-card flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full border border-glass-border ${
          tone === 'urgent' && !paused ? 'animate-pulse' : ''
        }`}
        style={{ boxShadow: `0 0 18px ${glow}` }}
      >
        <MiniRing progress={progress} stroke={stroke} />
        <span className={`text-lg font-bold tabular-nums min-w-[3ch] ${text}`}>
          {completed ? 'Done' : formatTime(remaining)}
        </span>
        {!completed && (
          <button
            onClick={togglePause}
            className="min-h-[44px] px-2 text-sm text-text-secondary hover:text-text-primary"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss timer"
          className="min-h-[44px] min-w-[44px] text-text-tertiary hover:text-text-primary"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
