'use client'

import { useMemo } from 'react'
import { Workout } from '@/types/workout'
import {
  calculateStreak,
  calculateVolumeChange,
  calculateDaysCompletedRate,
  groupVolumeByWeek,
  groupVolumeByType,
  groupByExercise,
  groupVolumeByMuscle,
  calculateCompletionRate,
} from '@/lib/utils/stats'

export function useStats(workouts: Workout[]) {
  const stats = useMemo(() => {
    const totalCompleted = workouts.filter(w => w.done).length
    const streak = calculateStreak(workouts)
    const volumeChange = calculateVolumeChange(workouts)
    const completionRate = calculateCompletionRate(workouts)
    const daysCompletedRate = calculateDaysCompletedRate(workouts)
    const volumeByWeek = groupVolumeByWeek(workouts)
    const exerciseProgress = groupByExercise(workouts)
    const volumeByType = groupVolumeByType(workouts)
    const muscleBalance = groupVolumeByMuscle(workouts)

    return {
      totalCompleted,
      streak,
      volumeChange,
      completionRate,
      daysCompletedRate,
      volumeByWeek,
      volumeByType,
      muscleBalance,
      exerciseProgress,
      totalWorkouts: workouts.length,
    }
  }, [workouts])

  return stats
}
