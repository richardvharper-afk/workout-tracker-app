'use client'

import { useMemo } from 'react'
import { Workout } from '@/types/workout'
import {
  calculateStreak,
  calculateWeeklyVolume,
  groupVolumeByWeek,
  groupByExercise,
  calculateCompletionRate,
} from '@/lib/utils/stats'

export function useStats(workouts: Workout[]) {
  const stats = useMemo(() => {
    const totalCompleted = workouts.filter(w => w.done).length
    const streak = calculateStreak(workouts)
    const weeklyVolume = calculateWeeklyVolume(workouts)
    const completionRate = calculateCompletionRate(workouts)
    const volumeByWeek = groupVolumeByWeek(workouts)
    const exerciseProgress = groupByExercise(workouts)

    return {
      totalCompleted,
      streak,
      weeklyVolume,
      completionRate,
      volumeByWeek,
      exerciseProgress,
      totalWorkouts: workouts.length,
    }
  }, [workouts])

  return stats
}
