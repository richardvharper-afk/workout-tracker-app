'use client'

import React from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { Calendar } from '@/components/calendar/Calendar'
import { useWorkouts } from '@/lib/hooks/useWorkouts'
import { FullPageSpinner } from '@/components/ui/Spinner'

export default function CalendarPage() {
  const { workouts, loading, error } = useWorkouts()

  if (loading) {
    return <FullPageSpinner />
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Calendar" />
      <Container className="flex-1 py-4">
        {error ? (
          <div className="glass-card p-6 text-center">
            <p className="text-accent-pink mb-2">{error}</p>
            <p className="text-text-tertiary text-sm">Login to view your calendar</p>
          </div>
        ) : (
          <Calendar workouts={workouts} />
        )}
      </Container>
      <Navigation />
    </div>
  )
}
