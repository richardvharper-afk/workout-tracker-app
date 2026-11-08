'use client'

import React from 'react'
import { useRestTimer } from '@/components/providers/RestTimerProvider'
import { getTimerTone, TONE_COLORS } from './timerStyle'

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

/** Full rest timer card. Reads shared timer state, so it persists across pages. */
export function RestTimer() {
  const { active, duration, remaining, paused, completed, togglePause, adjust, dismiss } = useRestTimer()
  if (!active) return null

  const tone = getTimerTone(remaining, completed)
  const { stroke, glow, text } = TONE_COLORS[tone]
  const progress = duration > 0 ? (duration - remaining) / duration : 1

  const size = 168
  const strokeWidth = 9
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const pill =
    'min-h-[44px] min-w-[64px] px-4 rounded-full text-sm font-medium bg-glass-bg border border-glass-border ' +
    'text-text-secondary hover:text-text-primary hover:bg-glass-hover active:scale-95 transition-all'

  return (
    <div className="glass-card p-5 flex flex-col items-center gap-4">
      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-widest">
        {completed ? 'Rest complete' : paused ? 'Paused' : 'Rest'}
      </h4>

      <div
        className={`relative ${tone === 'urgent' && !paused ? 'animate-pulse' : ''}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
        >
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
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${text}`}>
            {completed ? '✓' : formatTime(remaining)}
          </span>
          {!completed && (
            <span className="text-[11px] text-text-tertiary mt-0.5 tabular-nums">of {formatTime(duration)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!completed && (
          <>
            <button className={pill} onClick={() => adjust(-15)} aria-label="Subtract 15 seconds">
              −15s
            </button>
            <button
              className={`${pill} ${paused ? 'text-accent-cyan border-accent-cyan/40' : ''}`}
              onClick={togglePause}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button className={pill} onClick={() => adjust(15)} aria-label="Add 15 seconds">
              +15s
            </button>
          </>
        )}
        <button className={pill} onClick={dismiss}>
          {completed ? 'Dismiss' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
