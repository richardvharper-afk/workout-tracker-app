'use client'

import React from 'react'
import { TrainingAlert } from '@/lib/metrics/alerts'

export function AlertsCard({ alerts }: { alerts: TrainingAlert[] }) {
  // Quiet by design: nothing to show when nothing is triggered
  if (alerts.length === 0) return null

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Needs attention</h3>
      <ul className="space-y-3">
        {alerts.map(a => (
          <li key={a.id} className="flex items-start gap-3">
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                a.severity === 'warning' ? 'bg-accent-amber' : 'bg-accent-cyan'
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{a.title}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{a.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
