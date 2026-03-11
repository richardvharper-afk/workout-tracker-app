'use client'

import React, { useState, useEffect } from 'react'
import { Workout } from '@/types/workout'
import { useStats } from '@/lib/hooks/useStats'
import { StatCard } from './StatCard'
import { VolumeChart } from './VolumeChart'
import { ExerciseProgressChart } from './ExerciseProgressChart'
import { StreakCalendar } from './StreakCalendar'
import { VolumeByTypeChart } from './VolumeByTypeChart'
import { MuscleHeatmap } from './MuscleHeatmap'
import { MuscleBalanceChart } from './MuscleBalanceChart'
import { DailyVolumeChart } from './DailyVolumeChart'

interface StatsOverviewProps {
  workouts: Workout[]
}

const BODYWEIGHT_KEY = 'userBodyweightKg'

export function StatsOverview({ workouts: allWorkouts }: StatsOverviewProps) {
  const workouts = allWorkouts.filter(w => w.section !== 'Cool-down' && w.section !== 'Warm-up')
  const stats = useStats(workouts)
  const [bodyweight, setBodyweight] = useState('')
  const [bwSaved, setBwSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(BODYWEIGHT_KEY)
    if (stored) setBodyweight(stored)
  }, [])

  const handleBwSave = () => {
    const val = parseFloat(bodyweight)
    if (isNaN(val) || val <= 0) return
    localStorage.setItem(BODYWEIGHT_KEY, String(val))
    setBwSaved(true)
    setTimeout(() => setBwSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={stats.totalCompleted}
          label="Total Completed"
          color="green"
        />
        <StatCard
          value={`${stats.daysCompletedRate}%`}
          label="Days Completed"
          color="cyan"
        />
        <StatCard
          value={stats.volumeChange !== null ? `${stats.volumeChange > 0 ? '+' : ''}${stats.volumeChange}%` : '--'}
          label="Volume vs Prev Wk"
          color="purple"
        />
        <StatCard
          value={`${stats.completionRate}%`}
          label="Completion Rate"
          color="amber"
        />
      </div>

      {/* Streak calendar */}
      <StreakCalendar workouts={workouts} streak={stats.streak} />

      {/* Volume chart */}
      <VolumeChart data={stats.volumeByWeek} />

      {/* Daily volume by week */}
      <DailyVolumeChart workouts={workouts} />

      {/* Volume by type */}
      <VolumeByTypeChart
        data={stats.volumeByType.data}
        types={stats.volumeByType.types}
      />

      {/* Muscle heatmap */}
      <MuscleHeatmap workouts={workouts} />

      {/* Muscle balance radar */}
      <MuscleBalanceChart data={stats.muscleBalance} />

      {/* Exercise progress */}
      <ExerciseProgressChart data={stats.exerciseProgress} />

      {/* Body weight setting */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Body Weight</h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-text-tertiary mb-1 block">Weight (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={bodyweight}
              onChange={e => { setBodyweight(e.target.value); setBwSaved(false) }}
              placeholder="e.g. 82"
              className="input"
            />
          </div>
          <button
            onClick={handleBwSave}
            disabled={!bodyweight || isNaN(parseFloat(bodyweight))}
            className="px-4 py-3 rounded-lg text-sm font-medium bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {bwSaved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
