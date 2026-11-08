'use client'

import React, { useState, useEffect } from 'react'
import { Workout, WorkoutPerformanceData } from '@/types/workout'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SetInputGroup } from '@/components/workout/SetInput'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { useUpdateWorkout, useDeleteWorkout } from '@/lib/hooks/useWorkouts'
import { SessionEditor } from './SessionEditor'
import { parseDecimal } from '@/lib/utils/number'
import { parseSheetDate, toDateInputValue, applyDateToTimestamp } from '@/lib/utils/dates'

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
  allWorkouts?: Workout[]
  onRefetch?: () => void
}

export function DayDetailModal({ isOpen, onClose, date, workouts, allWorkouts, onRefetch }: DayDetailModalProps) {
  const [selectedExercise, setSelectedExercise] = useState<Workout | null>(null)
  const [performanceData, setPerformanceData] = useState<WorkoutPerformanceData>({
    done: false,
  })
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUrlError, setVideoUrlError] = useState('')
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exerciseDate, setExerciseDate] = useState('') // yyyy-MM-dd, '' = no saved date
  const [actionError, setActionError] = useState('')

  const { updateWorkout, loading: saveLoading, error: saveError } = useUpdateWorkout()
  const { deleteWorkout, loading: deleteLoading, error: deleteError } = useDeleteWorkout()

  const completed = workouts.filter(w => w.done).length
  const total = workouts.length
  const progress = total > 0 ? (completed / total) * 100 : 0

  const totalSets = workouts.reduce((sum, w) => sum + w.sets, 0)
  // Actual reps for saved exercises; planned reps (numeric only, so "30s" planks don't count) otherwise
  const totalReps = workouts.reduce((sum, w) => {
    const actual = [w.set1, w.set2, w.set3, w.set4, w.set5]
      .filter((r): r is number => r !== undefined && r !== null)
    if (w.lastSaved && actual.length > 0) return sum + actual.reduce((a, b) => a + b, 0)
    if (/[a-z]/i.test(w.reps)) return sum
    const planned = w.reps.includes('-')
      ? Math.round((parseInt(w.reps.split('-')[0]) + parseInt(w.reps.split('-')[1])) / 2) || 0
      : parseInt(w.reps) || 0
    return sum + planned * w.sets
  }, 0)

  // Group the day's exercises by session (week + day) for the session editors
  const sessions = Array.from(
    workouts.reduce((map, w) => {
      const key = `${w.week}-${w.day}`
      map.set(key, [...(map.get(key) || []), w])
      return map
    }, new Map<string, Workout[]>())
  ).map(([key, items]) => ({ key, week: items[0].week, day: items[0].day, items }))

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
    // Populate with existing values if already saved
    setPerformanceData({
      done: workout.done || false,
      ownNote: workout.ownNote || '',
      load: workout.load || '',
      avgRir: workout.avgRir,
      set1: workout.set1,
      set2: workout.set2,
      set3: workout.set3,
      set4: workout.set4,
      set5: workout.set5,
    })
    // Look up video URL by exercise name across all workouts
    const source = allWorkouts ?? workouts
    const match = source.find(w => w.exercise === workout.exercise && w.videoUrl)
    setVideoUrl(match?.videoUrl || workout.videoUrl || '')
    setVideoUrlError('')
    setActionError('')
    const saved = parseSheetDate(workout.lastSaved)
    setExerciseDate(saved ? toDateInputValue(saved) : '')
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
    setActionError('')

    // Only send a new timestamp when the date was explicitly changed
    const originalDate = (() => {
      const d = parseSheetDate(selectedExercise.lastSaved)
      return d ? toDateInputValue(d) : ''
    })()
    const dateOverride =
      exerciseDate && exerciseDate !== originalDate
        ? { lastSaved: applyDateToTimestamp(selectedExercise.lastSaved, exerciseDate) }
        : {}

    const result = await updateWorkout(
      selectedExercise.id,
      { ...performanceData, ...dateOverride, videoUrl: videoUrl || undefined },
      { week: selectedExercise.week, day: selectedExercise.day, exercise: selectedExercise.exercise }
    )
    setShowSaveConfirm(false)
    if (result) {
      onRefetch?.()
      setSelectedExercise(null)
    } else {
      // Most likely the row changed in the sheet (409): reload so the list is current
      setActionError(saveError || 'Could not save. Refresh and try again.')
      onRefetch?.()
    }
  }

  const handleDelete = async () => {
    if (!selectedExercise) return
    setActionError('')
    const success = await deleteWorkout(selectedExercise.id, {
      week: selectedExercise.week,
      day: selectedExercise.day,
      exercise: selectedExercise.exercise,
    })
    setShowDeleteConfirm(false)
    if (success) {
      onRefetch?.()
      setSelectedExercise(null)
    } else {
      setActionError(deleteError || 'Could not delete. Refresh and try again.')
      onRefetch?.()
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
              exerciseDate={exerciseDate}
              setExerciseDate={setExerciseDate}
              actionError={actionError}
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

              {/* Session details: date / duration / calories / RPE */}
              {sessions.map(sess => (
                <SessionEditor
                  key={sess.key}
                  week={sess.week}
                  day={sess.day}
                  workouts={sess.items}
                  onSaved={onRefetch}
                />
              ))}

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
                        {workout.sets}×{workout.reps} · {workout.section} · <span className="text-accent-amber">W{workout.week}D{workout.day}</span>
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
  exerciseDate: string
  setExerciseDate: (v: string) => void
  actionError: string
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
  exerciseDate,
  setExerciseDate,
  actionError,
  saveLoading,
  deleteLoading,
}: EditViewProps) {
  const colorClass = typeColors[workout.type] || 'bg-glass-bg text-text-tertiary'
  // Keep the raw text so "1," / "1." can be typed without being reformatted
  const [rirText, setRirText] = useState(
    performanceData.avgRir !== undefined ? String(performanceData.avgRir) : ''
  )

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
          type="text"
          inputMode="decimal"
          value={rirText}
          onChange={e => {
            const val = e.target.value
            setRirText(val)
            setPerformanceData(prev => ({ ...prev, avgRir: parseDecimal(val) }))
          }}
          placeholder="0-10"
        />

        <Input
          label="My notes"
          value={performanceData.ownNote || ''}
          onChange={e =>
            setPerformanceData(prev => ({ ...prev, ownNote: e.target.value }))
          }
          placeholder="Your notes for this exercise..."
        />

        <Input
          label="Date"
          type="date"
          value={exerciseDate}
          onChange={e => setExerciseDate(e.target.value)}
          helperText={
            workout.lastSaved
              ? 'Change only to move this exercise to another day'
              : 'Set when it was done. Left blank, it is dated when marked complete'
          }
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

      {actionError && <p className="text-sm text-accent-pink">{actionError}</p>}

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
