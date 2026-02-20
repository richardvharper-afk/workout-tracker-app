'use client'

import React from 'react'
import { Workout } from '@/types/workout'

interface StreakCalendarProps {
  workouts: Workout[]
  streak: number
}

export function StreakCalendar({ workouts: allWorkouts, streak }: StreakCalendarProps) {
  // Filter out workouts with invalid week/day (e.g., week 0 from empty cells)
  const workouts = allWorkouts.filter(w => w.week >= 1)
  // Build a 12-week grid (last 12 weeks worth of program days)
  const maxWeek = Math.max(...workouts.map(w => w.week), 1)
  const startWeek = Math.max(1, maxWeek - 11)

  // Calculate daily volumes to determine color thresholds
  const weeks: { week: number; days: { day: number; volume: number; done: boolean }[] }[] = []
  let maxVolume = 0

  for (let w = startWeek; w <= maxWeek; w++) {
    const weekWorkouts = workouts.filter(wo => wo.week === w)
    const dayMap = new Map<number, { volume: number; done: boolean }>()

    weekWorkouts.forEach(wo => {
      const existing = dayMap.get(wo.day) || { volume: 0, done: true }
      const reps = [wo.set1, wo.set2, wo.set3, wo.set4, wo.set5]
        .filter((s): s is number => s !== undefined && s !== null)
        .reduce((a, b) => a + b, 0)
      existing.volume += reps
      if (!wo.done) existing.done = false
      dayMap.set(wo.day, existing)
    })

    const days = Array.from(dayMap.entries())
      .map(([day, data]) => ({ day, ...data }))
      .sort((a, b) => a.day - b.day)

    days.forEach(d => { if (d.volume > maxVolume) maxVolume = d.volume })

    // Pad to 7 days
    const paddedDays = Array.from({ length: 7 }, (_, i) => {
      const found = days.find(d => d.day === i + 1)
      return found || { day: i + 1, volume: 0, done: false }
    })

    weeks.push({ week: w, days: paddedDays })
  }

  const getIntensity = (volume: number, done: boolean) => {
    if (volume === 0) return 'bg-glass-bg'
    if (!done) return 'bg-accent-amber/40'
    const ratio = maxVolume > 0 ? volume / maxVolume : 0
    if (ratio >= 0.75) return 'bg-accent-green shadow-[0_0_6px_rgba(0,255,148,0.4)]'
    if (ratio >= 0.5) return 'bg-accent-green/70'
    return 'bg-accent-green/40'
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Activity</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-accent-cyan text-lg font-bold">{streak}</span>
          <span className="text-xs text-text-tertiary">day streak</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map(week => (
          <div key={week.week} className="flex flex-col gap-1">
            {week.days.map(day => (
              <div
                key={`${week.week}-${day.day}`}
                className={`w-3 h-3 rounded-sm ${getIntensity(day.volume, day.done)}`}
                title={`Week ${week.week} Day ${day.day}: ${day.volume} total reps`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-text-tertiary">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-glass-bg" />
        <div className="w-2.5 h-2.5 rounded-sm bg-accent-green/40" />
        <div className="w-2.5 h-2.5 rounded-sm bg-accent-green/70" />
        <div className="w-2.5 h-2.5 rounded-sm bg-accent-green" />
        <span>More</span>
      </div>
    </div>
  )
}
