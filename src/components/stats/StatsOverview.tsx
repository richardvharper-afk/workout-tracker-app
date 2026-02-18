'use client'

import React from 'react'
import { Workout } from '@/types/workout'
import { useStats } from '@/lib/hooks/useStats'
import { StatCard } from './StatCard'
import { VolumeChart } from './VolumeChart'
import { ExerciseProgressChart } from './ExerciseProgressChart'
import { StreakCalendar } from './StreakCalendar'
import { CompletionRateChart } from './CompletionRateChart'

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
          value={stats.streak}
          label="Current Streak"
          color="cyan"
        />
        <StatCard
          value={stats.weeklyVolume.toLocaleString()}
          label="Weekly Volume"
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

      {/* Completion rate donut */}
      <CompletionRateChart
        completed={stats.totalCompleted}
        total={stats.totalWorkouts}
      />

      {/* Exercise progress */}
      <ExerciseProgressChart data={stats.exerciseProgress} />
    </div>
  )
}
