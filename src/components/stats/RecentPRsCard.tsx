'use client'

import React, { useState } from 'react'
import { PREvent, recentPRs } from '@/lib/metrics/personal-records'
import { PRIORITY_MUSCLES } from '@/lib/metrics/weekly-volume'

const TYPE_STYLE: Record<PREvent['type'], string> = {
  load: 'bg-amber-500/20 text-amber-400',
  reps: 'bg-accent-cyan/20 text-accent-cyan',
  e1rm: 'bg-accent-purple/20 text-accent-purple',
}

export function RecentPRsCard({ events }: { events: PREvent[] }) {
  const priorityEvents = events.filter(e => PRIORITY_MUSCLES.includes(e.muscle))
  const [scope, setScope] = useState<'priority' | 'all'>('priority')

  // If nothing happened on priority muscles, fall back to showing everything
  const effective = scope === 'priority' && priorityEvents.length > 0 ? 'priority' : 'all'
  const shown = recentPRs(effective === 'priority' ? priorityEvents : events, 8)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-tertiary">{events.length} PRs logged in total</p>
        <div className="flex gap-1">
          {(['priority', 'all'] as const).map(key => (
            <button
              key={key}
              onClick={() => setScope(key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                effective === key
                  ? 'bg-accent-cyan/20 text-accent-cyan'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {key === 'priority' ? 'Priority' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-text-tertiary text-sm text-center py-6">
          No PRs yet. Beat a previous load, rep count or estimated 1RM and it will show up here.
        </p>
      ) : (
        <ul className="space-y-1">
          {shown.map(e => (
            <li
              key={`${e.workoutId}-${e.type}`}
              className="flex items-center justify-between gap-3 py-2 border-t border-glass-border first:border-t-0"
            >
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">{e.exercise}</p>
                <p className="text-xs text-text-tertiary">
                  W{e.week}·D{e.day}
                  {e.muscle ? ` · ${e.muscle}` : ''} · was {e.previous}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-text-primary">{e.value}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_STYLE[e.type]}`}>
                  {e.label}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
