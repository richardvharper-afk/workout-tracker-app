'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { StatsOverview } from '@/components/stats/StatsOverview'
import { useWorkouts } from '@/lib/hooks/useWorkouts'
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner'
import { Session } from '@/types/session'
import { BodyMetric } from '@/types/body-metrics'

export default function StatsPage() {
  const { workouts, loading: workoutsLoading, error: workoutsError } = useWorkouts()
  const [sessions, setSessions] = useState<Session[]>([])
  const [bodyMetric, setBodyMetric] = useState<BodyMetric | null>(null)
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch sessions, body metrics latest, and all body metrics in parallel
        const [sessionsRes, bodyMetricsLatestRes, bodyMetricsAllRes] = await Promise.all([
          fetch('/api/sheets/sessions'),
          fetch('/api/sheets/body-metrics/latest'),
          fetch('/api/sheets/body-metrics'),
        ])

        const [sessionsData, bodyMetricsLatestData, bodyMetricsAllData] = await Promise.all([
          sessionsRes.json(),
          bodyMetricsLatestRes.json(),
          bodyMetricsAllRes.json(),
        ])

        if (sessionsData.success) {
          setSessions(sessionsData.data || [])
        }

        if (bodyMetricsLatestData.success && bodyMetricsLatestData.data) {
          setBodyMetric(bodyMetricsLatestData.data)
        }

        if (bodyMetricsAllData.success && bodyMetricsAllData.data) {
          setBodyMetrics(bodyMetricsAllData.data || [])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (!workoutsLoading) {
      fetchData()
    }
  }, [workoutsLoading])

  if (workoutsLoading || loading) {
    return <FullPageSpinner />
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Stats" />
      <Container className="flex-1 py-4">
        {workoutsError || error ? (
          <div className="glass-card p-6 text-center">
            <p className="text-accent-pink mb-2">{workoutsError || error}</p>
            <p className="text-text-tertiary text-sm">Login to view your stats</p>
          </div>
        ) : (
          <StatsOverview
            workouts={workouts}
            sessions={sessions}
            bodyMetric={bodyMetric}
            bodyMetrics={bodyMetrics}
          />
        )}
      </Container>
      <Navigation />
    </div>
  )
}
