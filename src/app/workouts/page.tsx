'use client'

import React from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { ExerciseCarousel } from '@/components/workout/ExerciseCarousel'
import { useWorkouts } from '@/lib/hooks/useWorkouts'
import { FullPageSpinner } from '@/components/ui/Spinner'
import Link from 'next/link'

export default function WorkoutsPage() {
  const { workouts, loading, error, refetch } = useWorkouts()

  if (loading) {
    return <FullPageSpinner />
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Header title="Workouts" />
        <Container className="flex-1 py-6">
          <div className="glass-card p-6 text-center">
            <p className="text-accent-pink mb-4">{error}</p>
            <Link href="/api/auth/login" className="btn btn-primary inline-block">
              Login to Continue
            </Link>
          </div>
        </Container>
        <Navigation />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Workouts" />
      <Container className="flex-1 py-4">
        <ExerciseCarousel workouts={workouts} refetch={refetch} />
      </Container>
      <Navigation />
    </div>
  )
}
