import React from 'react'
import { Workout } from '@/types/workout'
import { Card } from '@/components/ui/Card'

interface WorkoutCardProps {
  workout: Workout
  onClick?: () => void
}

const typeColors: Record<string, string> = {
  'Upper Body': 'bg-accent-cyan/20 text-accent-cyan',
  'Lower Body': 'bg-accent-purple/20 text-accent-purple',
  'Full Body': 'bg-accent-green/20 text-accent-green',
  'Core': 'bg-accent-amber/20 text-accent-amber',
  'Cardio': 'bg-accent-pink/20 text-accent-pink',
  'Flexibility': 'bg-accent-purple/20 text-accent-purple',
  'Rest': 'bg-text-tertiary/20 text-text-tertiary',
}

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const isComplete = workout.done

  return (
    <Card onClick={onClick} padding="md" className="hover:border-accent-cyan/30">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-text-tertiary">
              Week {workout.week} · Day {workout.day}
            </span>
            {isComplete && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-green/20 text-accent-green">
                Done
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {workout.exercise}
          </h3>

          {workout.description && (
            <p className="text-sm text-text-secondary mb-2 line-clamp-2">
              {workout.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
            <span className="inline-flex items-center">
              <span className="font-medium mr-1 text-text-tertiary">Sets:</span>
              {workout.sets}
            </span>
            <span className="inline-flex items-center">
              <span className="font-medium mr-1 text-text-tertiary">Reps:</span>
              {workout.reps}
            </span>
            <span className="inline-flex items-center">
              <span className="font-medium mr-1 text-text-tertiary">RIR:</span>
              {workout.rir}
            </span>
            {workout.rest && (
              <span className="inline-flex items-center">
                <span className="font-medium mr-1 text-text-tertiary">Rest:</span>
                {workout.rest}
              </span>
            )}
          </div>

          {workout.load && (
            <div className="mt-2 text-sm">
              <span className="font-medium text-text-tertiary">Load: </span>
              <span className="text-accent-cyan">{workout.load}</span>
            </div>
          )}
        </div>

        <div className="ml-2">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${typeColors[workout.type] || 'bg-glass-bg text-text-secondary'}`}>
            {workout.type}
          </span>
        </div>
      </div>

      {workout.section && (
        <div className="mt-2 text-xs text-text-tertiary">
          Section: {workout.section}{workout.muscleGroup ? ` · ${workout.muscleGroup}` : ''}
        </div>
      )}
    </Card>
  )
}
