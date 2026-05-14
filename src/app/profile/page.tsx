'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { APP_VERSION, WHATS_NEW } from '@/constants/version'
import { BodyMetric, BodyMetricFormData } from '@/types/body-metrics'
import Link from 'next/link'

export default function ProfilePage() {
  const [metrics, setMetrics] = useState<BodyMetricFormData>({
    bodyweight: undefined,
    waist: undefined,
    chest: undefined,
    shoulders: undefined,
    leftBicep: undefined,
    rightBicep: undefined,
    hips: undefined,
    notes: '',
  })
  const [previousMetrics, setPreviousMetrics] = useState<BodyMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherMetricsExpanded, setOtherMetricsExpanded] = useState(false)

  // Load latest metrics on mount
  useEffect(() => {
    fetchLatestMetrics()
  }, [])

  const fetchLatestMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sheets/body-metrics/latest')
      const data = await response.json()

      console.log('Body metrics API response:', data)

      if (data.success && data.data) {
        console.log('Previous metrics:', data.data)
        setPreviousMetrics(data.data)
        // Don't pre-fill form - user enters new values
      } else {
        console.log('No previous metrics found or API error:', data.error)
      }
    } catch (err: any) {
      console.error('Failed to fetch latest metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/sheets/body-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save metrics')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // Refresh to show new values as "previous"
      await fetchLatestMetrics()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field: keyof BodyMetricFormData, value: string) => {
    setMetrics(prev => ({
      ...prev,
      [field]: field === 'notes' ? value : (value ? parseFloat(value) : undefined),
    }))
    setSaved(false)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Profile" />
      <Container className="flex-1 py-4 space-y-4">

        {/* Body Metrics */}
        <Card padding="lg">
          <h2 className="text-lg font-bold text-text-primary mb-4">Body Metrics</h2>

          {loading ? (
            <p className="text-text-secondary text-sm">Loading...</p>
          ) : (
            <>
              <div className="space-y-3">
                {/* Bodyweight - Always visible */}
                <div>
                  <Input
                    label="Body Weight (kg)"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={metrics.bodyweight ?? ''}
                    onChange={e => handleFieldChange('bodyweight', e.target.value)}
                    placeholder="e.g. 82.5"
                  />
                  {previousMetrics?.bodyweight && (
                    <p className="text-xs text-text-tertiary mt-1">
                      Previous: {previousMetrics.bodyweight} kg ({previousMetrics.date})
                    </p>
                  )}
                </div>

                {/* Other Metrics - Collapsed by default */}
                <div className="border-t border-glass-border pt-3">
                  <button
                    onClick={() => setOtherMetricsExpanded(!otherMetricsExpanded)}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <h3 className="text-sm font-semibold text-text-secondary">
                      Other Measurements (Optional)
                    </h3>
                    <svg
                      className={`w-4 h-4 text-text-tertiary transition-transform ${otherMetricsExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {otherMetricsExpanded && (
                    <div className="space-y-3">
                      <div>
                        <Input
                          label="Waist (cm)"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={metrics.waist ?? ''}
                          onChange={e => handleFieldChange('waist', e.target.value)}
                          placeholder="e.g. 85"
                        />
                        {previousMetrics?.waist && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Previous: {previousMetrics.waist} cm
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          label="Chest (cm)"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={metrics.chest ?? ''}
                          onChange={e => handleFieldChange('chest', e.target.value)}
                          placeholder="e.g. 102"
                        />
                        {previousMetrics?.chest && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Previous: {previousMetrics.chest} cm
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          label="Shoulders (cm)"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={metrics.shoulders ?? ''}
                          onChange={e => handleFieldChange('shoulders', e.target.value)}
                          placeholder="e.g. 115"
                        />
                        {previousMetrics?.shoulders && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Previous: {previousMetrics.shoulders} cm
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          label="Left Bicep (cm)"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={metrics.leftBicep ?? ''}
                          onChange={e => handleFieldChange('leftBicep', e.target.value)}
                          placeholder="e.g. 38"
                        />
                        {previousMetrics?.leftBicep && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Previous: {previousMetrics.leftBicep} cm
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          label="Right Bicep (cm)"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={metrics.rightBicep ?? ''}
                          onChange={e => handleFieldChange('rightBicep', e.target.value)}
                          placeholder="e.g. 38.5"
                        />
                        {previousMetrics?.rightBicep && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Previous: {previousMetrics.rightBicep} cm
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          label="Hips (cm)"
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={metrics.hips ?? ''}
                          onChange={e => handleFieldChange('hips', e.target.value)}
                          placeholder="e.g. 98"
                        />
                        {previousMetrics?.hips && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Previous: {previousMetrics.hips} cm
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Notes
                        </label>
                        <textarea
                          value={metrics.notes}
                          onChange={e => handleFieldChange('notes', e.target.value)}
                          rows={3}
                          className="input"
                          placeholder="Optional notes about measurements"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
                  disabled={saving || !metrics.bodyweight}
                >
                  {saved ? 'Saved ✓' : 'Save Metrics'}
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* App Info */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Workout Tracker
          </h2>
          <p className="text-text-secondary mb-6">
            Track your workouts with Google Sheets integration
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-2">Version</h3>
              <p className="text-sm text-text-primary font-mono">v{APP_VERSION}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-2">What&apos;s New in v{APP_VERSION}</h3>
              <ul className="text-sm text-text-secondary space-y-1">
                {WHATS_NEW.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-accent-green mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-2">Features</h3>
              <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                <li>View workouts from Google Sheets</li>
                <li>Track sets, reps, load, and RIR</li>
                <li>Personal Record tracking with tooltips</li>
                <li>Progressive overload indicators</li>
                <li>Calendar progress view</li>
                <li>Stats and performance graphs</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-glass-border">
              <h3 className="text-sm font-medium text-text-tertiary mb-3">Account</h3>
              <LogoutButton />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-medium text-text-tertiary mb-3">Development</h3>
          <Link
            href="/metrics"
            className="block p-3 bg-accent-cyan/10 border border-accent-cyan/30 rounded text-sm text-accent-cyan hover:bg-accent-cyan/20 transition-colors"
          >
            🚧 New Metrics System (In Progress)
          </Link>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-medium text-text-tertiary mb-2">About</h3>
          <p className="text-sm text-text-secondary">
            This app syncs with your private Google Sheet to track your workout
            progress. All changes are saved directly to your spreadsheet.
          </p>
        </Card>
      </Container>
      <Navigation />
    </div>
  )
}
