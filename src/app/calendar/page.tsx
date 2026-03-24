'use client'

import React from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { Calendar } from '@/components/calendar/Calendar'
import { useWorkouts } from '@/lib/hooks/useWorkouts'
import { FullPageSpinner } from '@/components/ui/Spinner'

export default function CalendarPage() {
  const { workouts, loading, error, refetch } = useWorkouts()

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
          <Calendar workouts={workouts} onRefetch={refetch} />
        )}
      </Container>
      <Link
        href="/workouts/new"
        className="fixed bottom-24 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple shadow-glow-cyan active:scale-95 transition-transform"
        style={{ marginBottom: 'var(--safe-area-inset-bottom)' }}
      >
        <svg className="w-7 h-7 text-dark-base" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 4v16m8-8H4" />
        </svg>
      </Link>
      <Navigation />
    </div>
  )
}
