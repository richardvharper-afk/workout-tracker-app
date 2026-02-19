'use client'

import React from 'react'
import { Workout } from '@/types/workout'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  workouts: Workout[]
}

export function DayDetailModal({ isOpen, onClose, date, workouts }: DayDetailModalProps) {
  const router = useRouter()
  const completed = workouts.filter(w => w.done).length
  const total = workouts.length
  const progress = total > 0 ? (completed / total) * 100 : 0

  const totalSets = workouts.reduce((sum, w) => sum + w.sets, 0)
  const totalReps = workouts.reduce((sum, w) => {
    const reps = w.reps.includes('-')
      ? Math.round((parseInt(w.reps.split('-')[0]) + parseInt(w.reps.split('-')[1])) / 2)
      : parseInt(w.reps) || 0
    return sum + reps * w.sets
  }, 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={date} size="md">
      <div className="space-y-4">
        {/* Completion ratio */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-secondary">Completion</span>
            <span className="text-text-primary font-medium">{completed}/{total}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-glass-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Volume stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-3 text-center">
            <p className="text-lg font-bold text-accent-cyan">{totalSets}</p>
            <p className="text-xs text-text-tertiary">Sets</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-lg font-bold text-accent-purple">{totalReps}</p>
            <p className="text-xs text-text-tertiary">Reps</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-lg font-bold text-accent-green">{Math.round(progress)}%</p>
            <p className="text-xs text-text-tertiary">Done</p>
          </div>
        </div>

        {/* Exercise list */}
        <div className="space-y-2">
          {workouts.map(workout => (
            <button
              key={workout.id}
              onClick={() => {
                onClose()
                router.push(`/workouts/${workout.id}`)
              }}
              className="w-full glass-card p-3 flex items-center gap-3 text-left hover:border-accent-cyan/30 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                workout.done
                  ? 'border-accent-green bg-accent-green/20'
                  : 'border-text-tertiary'
              }`}>
                {workout.done && (
                  <svg className="w-2.5 h-2.5 text-accent-green" fill="none" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${workout.lastSaved ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {workout.exercise}
                </p>
                <p className="text-xs text-text-tertiary">
                  {workout.sets}×{workout.reps} · {workout.section}
                </p>
                {workout.lastSaved && (
                  <div className="flex flex-wrap gap-x-2 mt-1">
                    {[workout.set1, workout.set2, workout.set3, workout.set4, workout.set5]
                      .filter((s): s is number => s !== undefined && s !== null)
                      .map((rep, i) => (
                        <span key={i} className="text-xs text-accent-cyan">
                          S{i + 1}: {rep}
                        </span>
                      ))}
                    {workout.avgRir !== undefined && (
                      <span className="text-xs text-accent-purple">RIR: {workout.avgRir}</span>
                    )}
                  </div>
                )}
              </div>

              {workout.load && (
                <span className="text-xs text-accent-cyan font-medium">{workout.load}</span>
              )}
            </button>
          ))}
        </div>

        {workouts.length > 0 && workouts[0].notes && (
          <div className="glass-card p-3">
            <p className="text-xs text-text-tertiary mb-1">Notes</p>
            <p className="text-sm text-text-secondary">{workouts[0].notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
