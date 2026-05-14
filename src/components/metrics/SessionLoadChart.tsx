'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { SessionLoadWithAverage } from '@/lib/metrics/session-load'

interface SessionLoadChartProps {
  data: SessionLoadWithAverage[]
}

export function SessionLoadChart({ data }: SessionLoadChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary">
        No session data available. Complete workouts and log sessions to see trends.
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="label"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
            label={{ value: 'Session Load', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.5)' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any, name: any) => {
              if (name === 'sessionLoad') return [value, 'Session Load']
              if (name === 'rollingAverage') return [value, '4-Session Avg']
              return [value, name]
            }}
            labelFormatter={(label) => `Session: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="sessionLoad"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 4 }}
            name="Session Load"
          />
          <Line
            type="monotone"
            dataKey="rollingAverage"
            stroke="#facc15"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="4-Session Avg"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Interpretation Guide */}
      <div className="mt-4 p-3 bg-glass-bg/30 rounded text-xs">
        <h4 className="font-semibold text-text-secondary mb-2">Interpretation Guide:</h4>
        <ul className="space-y-1 text-text-tertiary">
          <li>• <span className="text-accent-cyan">400-600</span> = Moderate working block</li>
          <li>• <span className="text-accent-green">600-800</span> = Hard working block</li>
          <li>• <span className="text-accent-amber">&gt;800</span> = Very high; check recovery markers</li>
          <li>• Sudden drops = Good if scheduled (deload), concerning if not</li>
        </ul>
      </div>
    </div>
  )
}
