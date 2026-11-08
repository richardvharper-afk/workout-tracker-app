'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useRestTimer } from '@/components/providers/RestTimerProvider'
import { formatTime } from './RestTimer'

/**
 * Compact timer pill shown above the bottom nav on every page except the
 * workout detail page (which shows the full timer card inline).
 */
export function FloatingRestTimer() {
  const { active, remaining, paused, completed, togglePause, dismiss } = useRestTimer()
  const pathname = usePathname()

  if (!active) return null
  if (pathname?.startsWith('/workouts/')) return null

  return (
    <div
      className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(4rem + var(--safe-area-inset-bottom) + 0.5rem)' }}
    >
      <div className="pointer-events-auto glass-card flex items-center gap-3 pl-4 pr-2 py-2 rounded-full border border-glass-border shadow-lg">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Rest</span>
        <span className={`text-lg font-bold tabular-nums ${completed ? 'text-accent-green' : 'text-accent-cyan'}`}>
          {completed ? 'Done' : formatTime(remaining)}
        </span>
        {!completed && (
          <button
            onClick={togglePause}
            className="min-h-[36px] px-2 text-sm text-text-secondary hover:text-text-primary"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss timer"
          className="min-h-[36px] min-w-[36px] text-text-tertiary hover:text-text-primary"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
