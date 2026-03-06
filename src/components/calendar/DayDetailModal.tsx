'use client'

import React, { useState, useEffect } from 'react'
import { Workout, WorkoutPerformanceData } from '@/types/workout'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SetInputGroup } from '@/components/workout/SetInput'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { useUpdateWorkout, useDeleteWorkout } from '@/lib/hooks/useWorkouts'

function isValidUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const typeColors: Record<string, string> = {
  'Upper Body': 'bg-accent-cyan/20 text-accent-cyan',
  'Lower Body': 'bg-accent-purple/20 text-accent-purple',
  'Full Body': 'bg-accent-green/20 text-accent-green',
  'Core': 'bg-accent-amber/20 text-accent-amber',
  'Cardio': 'bg-accent-pink/20 text-accent-pink',
  'Flexibility': 'bg-accent-green/20 text-accent-green',
  'Rest': 'bg-glass-bg text-text-tertiary',
}

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  workouts: Workout[]
  onRefetch?: () => void
}

function buildEmptyPerformanceData(): WorkoutPerformanceData {
  return {
    done: false,
    notes: '',
    load: '',
  }
}

export function DayDetailModal({ isOpen, onClose, date, workouts, onRefetch }: DayDetailModalProps) {
  const [selectedExercise, setSelectedExercise] = useState<Workout | null>(null)
  const [performanceData, setPerformanceData] = useState<WorkoutPerformanceData>({
    done: false,
  })
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUrlError, setVideoUrlError] = useState('')
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { updateWorkout, loading: saveLoading } = useUpdateWorkout()
  const { deleteWorkout, loading: deleteLoading } = useDeleteWorkout()

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

  // Reset selected exercise when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedExercise(null)
      setVideoUrl('')
      setVideoUrlError('')
    }
  }, [isOpen])

  const handleSelectExercise = (workout: Workout) => {
    setSelectedExercise(workout)
    setPerformanceData(buildEmptyPerformanceData())
    setVideoUrl(workout.videoUrl || '')
    setVideoUrlError('')
  }

  const handleBackToList = () => {
    setSelectedExercise(null)
    setVideoUrl('')
    setVideoUrlError('')
  }

  const handleSetChange = (setNumber: number, value: number | undefined) => {
    const key = `set${setNumber}` as keyof WorkoutPerformanceData
    setPerformanceData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!selectedExercise) return
    const result = await updateWorkout(selectedExercise.id, {
      ...performanceData,
      videoUrl: videoUrl || undefined
    })
    setShowSaveConfirm(false)
    if (result) {
      onRefetch?.()
      setSelectedExercise(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedExercise) return
    const success = await deleteWorkout(selectedExercise.id)
    setShowDeleteConfirm(false)
    if (success) {
      onRefetch?.()
      setSelectedExercise(null)
    }
  }

  const modalSize = selectedExercise ? 'lg' : 'md'

  return (
    <>
      <Modal isOpen={isOpen} onClose={selectedExercise ? handleBackToList : onClose} title={selectedExercise ? 'Edit Exercise' : date} size={modalSize}>
        <div className="space-y-4">
          {selectedExercise ? (
            // ---- Edit View ----
            <EditView
              workout={selectedExercise}
              performanceData={performanceData}
              setPerformanceData={setPerformanceData}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              videoUrlError={videoUrlError}
              setVideoUrlError={setVideoUrlError}
              onBack={handleBackToList}
              onSetChange={handleSetChange}
              onSave={() => {
                if (!isValidUrl(videoUrl)) {
                  setVideoUrlError('Must be a valid URL starting with http:// or https://')
                  return
                }
                setShowSaveConfirm(true)
              }}
              onDelete={() => setShowDeleteConfirm(true)}
              saveLoading={saveLoading}
              deleteLoading={deleteLoading}
            />
          ) : (
            // ---- List View ----
            <>
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
                    onClick={() => handleSelectExercise(workout)}
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

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {workout.load && (
                        <span className="text-xs text-accent-cyan font-medium">{workout.load}</span>
                      )}
                      {/* Edit icon hint */}
                      <svg className="w-4 h-4 text-text-tertiary" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {workouts.length > 0 && workouts[0].notes && (
                <div className="glass-card p-3">
                  <p className="text-xs text-text-tertiary mb-1">Notes</p>
                  <p className="text-sm text-text-secondary">{workouts[0].notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Save confirmation */}
      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSave}
        title="Save Changes"
        message={`Save changes to ${selectedExercise?.exercise}?`}
        confirmText="Save"
        variant="primary"
        loading={saveLoading}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </>
  )
}

// ---- Edit View sub-component ----

interface EditViewProps {
  workout: Workout
  performanceData: WorkoutPerformanceData
  setPerformanceData: React.Dispatch<React.SetStateAction<WorkoutPerformanceData>>
  videoUrl: string
  setVideoUrl: (v: string) => void
  videoUrlError: string
  setVideoUrlError: (v: string) => void
  onBack: () => void
  onSetChange: (setNumber: number, value: number | undefined) => void
  onSave: () => void
  onDelete: () => void
  saveLoading: boolean
  deleteLoading: boolean
}

function EditView({
  workout,
  performanceData,
  setPerformanceData,
  videoUrl,
  setVideoUrl,
  videoUrlError,
  setVideoUrlError,
  onBack,
  onSetChange,
  onSave,
  onDelete,
  saveLoading,
  deleteLoading,
}: EditViewProps) {
  const colorClass = typeColors[workout.type] || 'bg-glass-bg text-text-tertiary'
  const hasPrevious = workout.lastSaved != null

  // Previous set values to show as reference labels
  const previousSetValues = hasPrevious ? {
    set1: workout.set1,
    set2: workout.set2,
    set3: workout.set3,
    set4: workout.set4,
    set5: workout.set5,
  } : undefined

  return (
    <div className="space-y-4">
      {/* Back button + type badge */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back to exercises
        </button>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorClass}`}>
          {workout.type}
        </span>
      </div>

      {/* Exercise header */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{workout.exercise}</h3>
        <p className="text-sm text-text-tertiary">
          Week {workout.week} · Day {workout.day} · {workout.section}
          {workout.muscleGroup && ` · ${workout.muscleGroup}`}
        </p>
      </div>

      {/* Prescription stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="glass-card p-2 text-center">
          <p className="text-sm font-bold text-text-primary">{workout.sets}</p>
          <p className="text-xs text-text-tertiary">Sets</p>
        </div>
        <div className="glass-card p-2 text-center">
          <p className="text-sm font-bold text-text-primary">{workout.reps}</p>
          <p className="text-xs text-text-tertiary">Reps</p>
        </div>
        <div className="glass-card p-2 text-center">
          <p className="text-sm font-bold text-text-primary">{workout.rir}</p>
          <p className="text-xs text-text-tertiary">RIR</p>
        </div>
        <div className="glass-card p-2 text-center">
          <p className="text-sm font-bold text-text-primary">{workout.rest}</p>
          <p className="text-xs text-text-tertiary">Rest</p>
        </div>
      </div>

      {/* Performance form */}
      <div className="border-t border-glass-border pt-4 space-y-4">
        <SetInputGroup
          sets={workout.sets}
          values={{
            set1: performanceData.set1,
            set2: performanceData.set2,
            set3: performanceData.set3,
            set4: performanceData.set4,
            set5: performanceData.set5,
          }}
          onChange={onSetChange}
          previousValues={previousSetValues}
        />

        <Input
          label="Load (weight / variation)"
          value={performanceData.load || ''}
          onChange={e =>
            setPerformanceData(prev => ({ ...prev, load: e.target.value }))
          }
          placeholder="e.g. 30kg, Bodyweight"
        />

        <Input
          label="Avg RIR"
          type="number"
          inputMode="numeric"
          min="0"
          max="10"
          value={performanceData.avgRir ?? ''}
          onChange={e => {
            const val = e.target.value
            setPerformanceData(prev => ({
              ...prev,
              avgRir: val === '' ? undefined : parseInt(val, 10),
            }))
          }}
          placeholder="0-10"
        />

        <Input
          label="Notes"
          value={performanceData.notes || ''}
          onChange={e =>
            setPerformanceData(prev => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Session notes..."
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-text-secondary">Video Link</label>
            {videoUrl && isValidUrl(videoUrl) && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-cyan hover:underline"
              >
                Watch ↗
              </a>
            )}
          </div>
          <Input
            value={videoUrl}
            onChange={e => {
              setVideoUrl(e.target.value)
              setVideoUrlError('')
            }}
            onBlur={() => {
              if (!isValidUrl(videoUrl)) {
                setVideoUrlError('Must be a valid URL starting with http:// or https://')
              }
            }}
            placeholder="https://..."
          />
          {videoUrlError && (
            <p className="text-xs text-accent-pink mt-1">{videoUrlError}</p>
          )}
        </div>

        <Checkbox
          label="Mark as completed"
          checked={performanceData.done}
          onChange={e =>
            setPerformanceData(prev => ({ ...prev, done: e.target.checked }))
          }
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="primary"
          fullWidth
          onClick={onSave}
          loading={saveLoading}
        >
          Save Changes
        </Button>
        <Button
          variant="danger"
          onClick={onDelete}
          loading={deleteLoading}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
