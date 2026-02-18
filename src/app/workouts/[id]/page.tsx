'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { useWorkout, useUpdateWorkout, useDeleteWorkout } from '@/lib/hooks/useWorkouts'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { SetInputGroup } from '@/components/workout/SetInput'
import { ConfirmModal } from '@/components/ui/Modal'
import { WorkoutPerformanceData } from '@/types/workout'

const typeColors: Record<string, string> = {
  'Upper Body': 'bg-accent-cyan/20 text-accent-cyan',
  'Lower Body': 'bg-accent-purple/20 text-accent-purple',
  'Full Body': 'bg-accent-green/20 text-accent-green',
  'Core': 'bg-accent-amber/20 text-accent-amber',
  'Cardio': 'bg-accent-pink/20 text-accent-pink',
  'Flexibility': 'bg-accent-purple/20 text-accent-purple',
  'Rest': 'bg-text-tertiary/20 text-text-tertiary',
}

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { workout, loading, error, refetch } = useWorkout(id)
  const { updateWorkout, loading: updating } = useUpdateWorkout()
  const { deleteWorkout, loading: deleting } = useDeleteWorkout()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [performanceData, setPerformanceData] = useState<WorkoutPerformanceData>({
    set1: undefined,
    set2: undefined,
    set3: undefined,
    set4: undefined,
    set5: undefined,
    load: '',
    avgRir: undefined,
    done: false,
    notes: '',
  })

  React.useEffect(() => {
    if (workout) {
      setPerformanceData({
        set1: workout.set1,
        set2: workout.set2,
        set3: workout.set3,
        set4: workout.set4,
        set5: workout.set5,
        load: workout.load || '',
        avgRir: workout.avgRir,
        done: workout.done,
        notes: workout.notes || '',
      })
    }
  }, [workout])

  const handleSetChange = (setNumber: number, value: number | undefined) => {
    setPerformanceData({
      ...performanceData,
      [`set${setNumber}`]: value,
    })
    setHasChanges(true)
  }

  const handleFieldChange = (field: string, value: any) => {
    setPerformanceData({ ...performanceData, [field]: value })
    setHasChanges(true)
  }

  const handleSave = async () => {
    const result = await updateWorkout(id, performanceData)
    if (result) {
      setHasChanges(false)
      refetch()
    }
  }

  const handleDelete = async () => {
    const success = await deleteWorkout(id)
    if (success) {
      router.push('/workouts')
      router.refresh()
    }
  }

  if (loading) {
    return <FullPageSpinner />
  }

  if (error || !workout) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Header title="Workout" showBack />
        <Container className="flex-1 py-6">
          <div className="glass-card p-6 text-center">
            <p className="text-accent-pink">{error || 'Workout not found'}</p>
          </div>
        </Container>
        <Navigation />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header
        title={workout.exercise}
        showBack
      />
      <Container className="flex-1 py-4 space-y-4">
        {/* Workout Info Card */}
        <div className="glass-card p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{workout.exercise}</h2>
              <p className="text-sm text-text-secondary mt-1">
                Week {workout.week} · Day {workout.day}
              </p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${typeColors[workout.type] || 'bg-glass-bg text-text-secondary'}`}>
              {workout.type}
            </span>
          </div>

          {workout.description && (
            <p className="text-text-secondary mb-4">{workout.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-text-tertiary">Section:</span>
              <span className="ml-2 text-text-primary">{workout.section}</span>
            </div>
            <div>
              <span className="font-medium text-text-tertiary">Sets:</span>
              <span className="ml-2 text-text-primary">{workout.sets}</span>
            </div>
            <div>
              <span className="font-medium text-text-tertiary">Reps:</span>
              <span className="ml-2 text-text-primary">{workout.reps}</span>
            </div>
            <div>
              <span className="font-medium text-text-tertiary">RIR:</span>
              <span className="ml-2 text-text-primary">{workout.rir}</span>
            </div>
            <div>
              <span className="font-medium text-text-tertiary">Rest:</span>
              <span className="ml-2 text-text-primary">{workout.rest}</span>
            </div>
            {workout.escalation && (
              <div>
                <span className="font-medium text-text-tertiary">Escalation:</span>
                <span className="ml-2 text-text-primary">{workout.escalation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Card */}
        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Track Performance
          </h3>

          <div className="space-y-4">
            <SetInputGroup
              sets={workout.sets}
              values={performanceData}
              onChange={handleSetChange}
            />

            <Input
              label="Load / Variation"
              type="text"
              value={performanceData.load}
              onChange={(e) => handleFieldChange('load', e.target.value)}
              placeholder="e.g., 135 lbs or Bodyweight"
            />

            <Input
              label="Average RIR"
              type="number"
              inputMode="numeric"
              min="0"
              max="10"
              value={performanceData.avgRir || ''}
              onChange={(e) =>
                handleFieldChange('avgRir', e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder="0-10"
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Notes
              </label>
              <textarea
                value={performanceData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={3}
                className="input"
                placeholder="Optional notes"
              />
            </div>

            <Checkbox
              label="Mark as completed"
              checked={performanceData.done}
              onChange={(e) => handleFieldChange('done', e.target.checked)}
            />
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updating}
              disabled={updating || !hasChanges}
              fullWidth
            >
              {hasChanges ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>

        {/* Delete Button */}
        <Button
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
          fullWidth
        >
          Delete Workout
        </Button>

        {workout.lastSaved && (
          <p className="text-xs text-text-tertiary text-center">
            Last saved: {new Date(workout.lastSaved).toLocaleString()}
          </p>
        )}
      </Container>

      <Navigation />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
