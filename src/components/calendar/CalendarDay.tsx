'use client'

import React from 'react'
import { Workout } from '@/types/workout'

interface CalendarDayProps {
  dayNumber: number | null
  isToday: boolean
  isSelected: boolean
  workouts: Workout[]
  onClick: () => void
}

export function CalendarDay({ dayNumber, isToday, isSelected, workouts, onClick }: CalendarDayProps) {
  if (dayNumber === null) {
    return <div className="aspect-square" />
  }

  const total = workouts.length
  const completed = workouts.filter(w => w.done).length
  const hasWorkouts = total > 0
  const allDone = total > 0 && completed === total
  const partial = completed > 0 && completed < total

  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 relative ${
        isSelected
          ? 'bg-accent-cyan/20 border-2 border-accent-cyan shadow-glow-cyan scale-105'
          : isToday
          ? 'border-2 border-accent-cyan/50'
          : allDone
          ? 'border border-accent-green/40 shadow-glow-green/30'
          : partial
          ? 'border border-accent-amber/40'
          : hasWorkouts
          ? 'border border-glass-border'
          : 'border border-transparent'
      } ${hasWorkouts ? 'bg-glass-bg' : ''}`}
    >
      <span className={`${
        isSelected ? 'text-accent-cyan' : isToday ? 'text-accent-cyan' : hasWorkouts ? 'text-text-primary' : 'text-text-tertiary'
      }`}>
        {dayNumber}
      </span>

      {hasWorkouts && (
        <div className="flex gap-0.5 mt-0.5">
          {allDone ? (
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          ) : partial ? (
            <div className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
          )}
        </div>
      )}
    </button>
  )
}
