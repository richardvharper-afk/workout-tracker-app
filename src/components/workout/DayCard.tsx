'use client'

import React, { useState } from 'react'
import { Workout } from '@/types/workout'
import { useRouter } from 'next/navigation'

interface DayCardProps {
  week: number
  day: number
  workouts: Workout[]
}

export function DayCard({ week, day, workouts }: DayCardProps) {
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()

  const completedCount = workouts.filter(w => w.done).length
  const totalCount = workouts.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const types = Array.from(new Set(workouts.map(w => w.type)))

  const typeColors: Record<string, string> = {
    'Upper Body': 'bg-accent-cyan/20 text-accent-cyan',
    'Lower Body': 'bg-accent-purple/20 text-accent-purple',
    'Full Body': 'bg-accent-green/20 text-accent-green',
    'Core': 'bg-accent-amber/20 text-accent-amber',
    'Cardio': 'bg-accent-pink/20 text-accent-pink',
    'Flexibility': 'bg-accent-purple/20 text-accent-purple',
    'Rest': 'bg-text-tertiary/20 text-text-tertiary',
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-text-primary">
              Week {week} · Day {day}
            </span>
            <span className="text-xs text-text-tertiary">
              {completedCount}/{totalCount} exercises
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-glass-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-cyan transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Type badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {types.map(type => (
              <span
                key={type}
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColors[type] || 'bg-glass-bg text-text-secondary'}`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-text-tertiary transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded exercises */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-2 border-t border-glass-border pt-3">
          {workouts.map(workout => (
            <button
              key={workout.id}
              onClick={() => router.push(`/workouts/${workout.id}`)}
              className="w-full glass-card p-3 flex items-center gap-3 text-left hover:border-accent-cyan/30 transition-colors"
            >
              {/* Done indicator */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                workout.done
                  ? 'border-accent-green bg-accent-green/20'
                  : 'border-text-tertiary'
              }`}>
                {workout.done && (
                  <svg className="w-3 h-3 text-accent-green" fill="none" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${workout.done ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {workout.exercise}
                </p>
                <p className="text-xs text-text-tertiary">
                  {workout.sets} sets × {workout.reps} reps
                  {workout.load && ` · ${workout.load}`}
                </p>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${typeColors[workout.type] || 'bg-glass-bg text-text-secondary'}`}>
                {workout.section}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
