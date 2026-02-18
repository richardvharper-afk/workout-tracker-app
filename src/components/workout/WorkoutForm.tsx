'use client'

import React, { useState } from 'react'
import { WorkoutFormData, WorkoutType, WorkoutSection } from '@/types/workout'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { WORKOUT_TYPES, WORKOUT_SECTIONS, DEFAULT_WORKOUT_VALUES } from '@/constants/config'

interface WorkoutFormProps {
  initialData?: Partial<WorkoutFormData>
  onSubmit: (data: WorkoutFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export function WorkoutForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Workout',
}: WorkoutFormProps) {
  const [formData, setFormData] = useState<WorkoutFormData>({
    week: initialData?.week || 1,
    day: initialData?.day || 1,
    type: initialData?.type || 'Upper Body',
    section: initialData?.section || 'Strength',
    exercise: initialData?.exercise || '',
    description: initialData?.description || '',
    sets: initialData?.sets || DEFAULT_WORKOUT_VALUES.sets,
    reps: initialData?.reps || DEFAULT_WORKOUT_VALUES.reps,
    rir: initialData?.rir || DEFAULT_WORKOUT_VALUES.rir,
    rest: initialData?.rest || DEFAULT_WORKOUT_VALUES.rest,
    escalation: initialData?.escalation || '',
    notes: initialData?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.exercise.trim()) {
      newErrors.exercise = 'Exercise name is required'
    }

    if (formData.week < 1 || formData.week > 52) {
      newErrors.week = 'Week must be between 1 and 52'
    }

    if (formData.day < 1 || formData.day > 7) {
      newErrors.day = 'Day must be between 1 and 7'
    }

    if (formData.sets < 1 || formData.sets > 10) {
      newErrors.sets = 'Sets must be between 1 and 10'
    }

    if (formData.rir < 0 || formData.rir > 10) {
      newErrors.rir = 'RIR must be between 0 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof WorkoutFormData, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Week and Day */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Week"
          type="number"
          inputMode="numeric"
          min="1"
          max="52"
          value={formData.week}
          onChange={(e) => updateField('week', parseInt(e.target.value, 10))}
          error={errors.week}
          required
        />
        <Input
          label="Day"
          type="number"
          inputMode="numeric"
          min="1"
          max="7"
          value={formData.day}
          onChange={(e) => updateField('day', parseInt(e.target.value, 10))}
          error={errors.day}
          required
        />
      </div>

      {/* Type and Section */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          options={WORKOUT_TYPES.map(t => ({ value: t, label: t }))}
          value={formData.type}
          onChange={(e) => updateField('type', e.target.value as WorkoutType)}
          error={errors.type}
          required
        />
        <Select
          label="Section"
          options={WORKOUT_SECTIONS.map(s => ({ value: s, label: s }))}
          value={formData.section}
          onChange={(e) => updateField('section', e.target.value as WorkoutSection)}
          error={errors.section}
          required
        />
      </div>

      {/* Exercise Name */}
      <Input
        label="Exercise"
        type="text"
        value={formData.exercise}
        onChange={(e) => updateField('exercise', e.target.value)}
        error={errors.exercise}
        placeholder="e.g., Barbell Bench Press"
        required
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Optional details about the exercise"
          rows={3}
          className="input"
        />
      </div>

      {/* Sets, Reps, RIR */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Sets"
          type="number"
          inputMode="numeric"
          min="1"
          max="10"
          value={formData.sets}
          onChange={(e) => updateField('sets', parseInt(e.target.value, 10))}
          error={errors.sets}
          required
        />
        <Input
          label="Reps"
          type="text"
          value={formData.reps}
          onChange={(e) => updateField('reps', e.target.value)}
          error={errors.reps}
          placeholder="8-12"
          helperText="e.g., 10 or 8-12"
          required
        />
        <Input
          label="RIR"
          type="number"
          inputMode="numeric"
          min="0"
          max="10"
          value={formData.rir}
          onChange={(e) => updateField('rir', parseInt(e.target.value, 10))}
          error={errors.rir}
          helperText="Reps in reserve"
          required
        />
      </div>

      {/* Rest and Escalation */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Rest"
          type="text"
          value={formData.rest}
          onChange={(e) => updateField('rest', e.target.value)}
          error={errors.rest}
          placeholder="60s"
          helperText="e.g., 60s, 90s"
          required
        />
        <Input
          label="Escalation"
          type="text"
          value={formData.escalation}
          onChange={(e) => updateField('escalation', e.target.value)}
          placeholder="Optional"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Optional notes"
          rows={2}
          className="input"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            fullWidth
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          fullWidth
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
