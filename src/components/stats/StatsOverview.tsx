'use client'

import React from 'react'
import { Workout } from '@/types/workout'
import { useStats } from '@/lib/hooks/useStats'
import { StatCard } from './StatCard'
import { VolumeChart } from './VolumeChart'
import { ExerciseProgressChart } from './ExerciseProgressChart'
import { StreakCalendar } from './StreakCalendar'
import { VolumeByTypeChart } from './VolumeByTypeChart'
import { MuscleHeatmap } from './MuscleHeatmap'

interface StatsOverviewProps {
  workouts: Workout[]
}

export function StatsOverview({ workouts }: StatsOverviewProps) {
  const stats = useStats(workouts)

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

      {/* Volume by type */}
      <VolumeByTypeChart
        data={stats.volumeByType.data}
        types={stats.volumeByType.types}
      />

      {/* Muscle heatmap */}
      <MuscleHeatmap workouts={workouts} />

      {/* Exercise progress */}
      <ExerciseProgressChart data={stats.exerciseProgress} />
    </div>
  )
}
