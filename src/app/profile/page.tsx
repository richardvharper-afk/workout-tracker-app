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

const BODYWEIGHT_KEY = 'userBodyweightKg'

export default function ProfilePage() {
  const [bodyweight, setBodyweight] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(BODYWEIGHT_KEY)
    if (stored) setBodyweight(stored)
  }, [])

  const handleSave = () => {
    const val = parseFloat(bodyweight)
    if (isNaN(val) || val <= 0) return
    localStorage.setItem(BODYWEIGHT_KEY, String(val))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Profile" />
      <Container className="flex-1 py-4 space-y-4">

        {/* Body Settings */}
        <Card padding="lg">
          <h2 className="text-lg font-bold text-text-primary mb-4">Body Settings</h2>
          <div className="space-y-3">
            <Input
              label="Body Weight (kg)"
              type="number"
              inputMode="decimal"
              min="0"
              value={bodyweight}
              onChange={e => {
                setBodyweight(e.target.value)
                setSaved(false)
              }}
              placeholder="e.g. 82"
            />
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!bodyweight || isNaN(parseFloat(bodyweight))}
            >
              {saved ? 'Saved ✓' : 'Save'}
            </Button>
          </div>
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
