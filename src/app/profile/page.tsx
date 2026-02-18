'use client'

import React from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Card } from '@/components/ui/Card'

export default function ProfilePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Profile" />
      <Container className="flex-1 py-4 space-y-4">
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
              <p className="text-sm text-text-primary">0.1.0</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-2">Features</h3>
              <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                <li>View workouts from Google Sheets</li>
                <li>Add new workouts</li>
                <li>Edit workout performance</li>
                <li>Track sets, reps, and load</li>
                <li>Calendar progress view</li>
                <li>Stats and graphs</li>
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
