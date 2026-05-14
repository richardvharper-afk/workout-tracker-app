import { Workout } from '@/types/workout'

export interface MuscleVolume {
  muscle: string
  sets: number
  isGoalMuscle: boolean
  threshold: 'under' | 'optimal' | 'high' | 'very-high' | 'none'
}

export interface WeeklyVolume {
  week: number
  totalSets: number
  muscles: MuscleVolume[]
}

// Default goal muscles - configurable
export const DEFAULT_GOAL_MUSCLES = [
  'Pectorals',
  'Deltoids',
  'Medial Deltoids',
  'Biceps',
  'Brachialis',
]

/**
 * Check if exercise is a working set
 */
function isWorkingSet(workout: Workout): boolean {
  return (
    workout.done === true &&
    (workout.section === 'Strength' || workout.section === 'Core')
  )
}

/**
 * Apply threshold to volume count
 */
function applyThreshold(
  sets: number,
  isGoalMuscle: boolean
): 'under' | 'optimal' | 'high' | 'very-high' | 'none' {
  if (!isGoalMuscle) return 'none'

  if (sets < 10) return 'under'
  if (sets <= 20) return 'optimal'
  if (sets <= 25) return 'high'
  return 'very-high'
}

/**
 * Calculate weekly volume per priority muscle
 */
export function calculateWeeklyVolume(
  workouts: Workout[],
  goalMuscles: string[] = DEFAULT_GOAL_MUSCLES
): WeeklyVolume[] {
  // Group by week
  const weekMap = new Map<number, Workout[]>()

  workouts.forEach(workout => {
    if (!weekMap.has(workout.week)) {
      weekMap.set(workout.week, [])
    }
    weekMap.get(workout.week)!.push(workout)
  })

  // Calculate volume per week
  const weeklyVolumes: WeeklyVolume[] = []

  weekMap.forEach((weekWorkouts, week) => {
    // Filter to working sets only
    const workingSets = weekWorkouts.filter(isWorkingSet)

    // Group by priority muscle
    const muscleMap = new Map<string, number>()

    workingSets.forEach(workout => {
      const muscle = workout.muscleGroup || 'Unknown'
      const currentSets = muscleMap.get(muscle) || 0
      // Use prescribed sets (workout.sets), not count of Set1-5
      muscleMap.set(muscle, currentSets + workout.sets)
    })

    // Convert to array
    const muscles: MuscleVolume[] = []
    let totalSets = 0

    muscleMap.forEach((sets, muscle) => {
      const isGoalMuscle = goalMuscles.includes(muscle)
      const threshold = applyThreshold(sets, isGoalMuscle)

      muscles.push({
        muscle,
        sets,
        isGoalMuscle,
        threshold,
      })

      totalSets += sets
    })

    // Sort by sets descending
    muscles.sort((a, b) => b.sets - a.sets)

    weeklyVolumes.push({
      week,
      totalSets,
      muscles,
    })
  })

  // Sort by week
  return weeklyVolumes.sort((a, b) => a.week - b.week)
}

/**
 * Get color for threshold
 */
export function getThresholdColor(threshold: MuscleVolume['threshold']): string {
  switch (threshold) {
    case 'under':
      return '#facc15' // yellow
    case 'optimal':
      return '#10b981' // green
    case 'high':
      return '#fb923c' // orange
    case 'very-high':
      return '#ef4444' // red
    case 'none':
      return '#6b7280' // gray
  }
}

/**
 * Get label for threshold
 */
export function getThresholdLabel(threshold: MuscleVolume['threshold']): string {
  switch (threshold) {
    case 'under':
      return 'Under-stimulated (<10 sets)'
    case 'optimal':
      return 'Productive range (10-20 sets)'
    case 'high':
      return 'Diminishing returns (>20 sets)'
    case 'very-high':
      return 'Likely overreach (>25 sets)'
    case 'none':
      return 'Not a goal muscle'
  }
}

/**
 * Format data for stacked bar chart
 */
export function formatForStackedChart(weeklyVolumes: WeeklyVolume[]) {
  // Get all unique muscles across all weeks
  const allMuscles = new Set<string>()
  weeklyVolumes.forEach(wv => {
    wv.muscles.forEach(m => allMuscles.add(m.muscle))
  })

  // Create chart data
  return weeklyVolumes.map(wv => {
    const dataPoint: any = {
      week: `W${wv.week}`,
      weekNum: wv.week,
    }

    // Add each muscle as a property
    wv.muscles.forEach(m => {
      dataPoint[m.muscle] = m.sets
    })

    return dataPoint
  })
}
