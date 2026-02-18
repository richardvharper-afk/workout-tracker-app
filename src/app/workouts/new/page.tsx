'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { WorkoutForm } from '@/components/workout/WorkoutForm'
import { useCreateWorkout } from '@/lib/hooks/useWorkouts'
import { WorkoutFormData } from '@/types/workout'

export default function NewWorkoutPage() {
  const router = useRouter()
  const { createWorkout, error } = useCreateWorkout()
  const [showError, setShowError] = useState<string | null>(null)

  const handleSubmit = async (data: WorkoutFormData) => {
    const workout = await createWorkout(data)

    if (workout) {
      router.push('/workouts')
      router.refresh()
    } else {
      setShowError(error || 'Failed to create workout')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Add Workout" showBack />
      <Container className="flex-1 py-4">
        {showError && (
          <div className="glass-card p-4 mb-4 border-accent-pink/30">
            <p className="text-accent-pink text-sm">{showError}</p>
          </div>
        )}
        <div className="glass-card p-4">
          <WorkoutForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Create Workout"
          />
        </div>
      </Container>
      <Navigation />
    </div>
  )
}
