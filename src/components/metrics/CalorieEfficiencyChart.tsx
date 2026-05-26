'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Session } from '@/types/session'

interface CalorieEfficiencyChartProps {
  sessions: Session[]
}

export function CalorieEfficiencyChart({ sessions }: CalorieEfficiencyChartProps) {
  // Filter sessions with both duration and calories
  const validSessions = sessions
    .filter(s => s.duration !== undefined && s.calories !== undefined && s.duration > 0)
    .map(s => ({
      week: s.week,
      day: s.day,
      efficiency: Math.round((s.calories! / s.duration!) * 10) / 10,
    }))

  if (validSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary">
        No session data with both duration and calories available.
      </div>
    )
  }

  // Group by week, with separate values for D1, D2, D3
  const weekMap = new Map<number, { d1?: number; d2?: number; d3?: number }>()

  validSessions.forEach(s => {
    if (!weekMap.has(s.week)) {
      weekMap.set(s.week, {})
    }
    const weekData = weekMap.get(s.week)!
    if (s.day === 1) weekData.d1 = s.efficiency
    else if (s.day === 2) weekData.d2 = s.efficiency
    else if (s.day === 3) weekData.d3 = s.efficiency
  })

  // Convert to array format for chart
  const chartData = Array.from(weekMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([week, data]) => ({
      week: `W${week}`,
      weekNum: week,
      d1: data.d1,
      d2: data.d2,
      d3: data.d3,
    }))

  // Calculate average efficiency across all sessions
  const avgEfficiency = validSessions.reduce((sum, s) => sum + s.efficiency, 0) / validSessions.length

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="week"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
            label={{ value: 'cal/min', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.5)' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any, name: any) => {
              if (value === undefined) return null
              return [`${value} cal/min`, name]
            }}
            labelFormatter={(label) => `Week: ${label}`}
          />
          <ReferenceLine
            y={avgEfficiency}
            stroke="#6b7280"
            strokeDasharray="5 5"
            label={{ value: `Avg: ${avgEfficiency.toFixed(1)}`, position: 'right', fill: '#6b7280', fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="d1"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: '#22d3ee', r: 4 }}
            connectNulls={false}
            name="Day 1"
          />
          <Line
            type="monotone"
            dataKey="d2"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ fill: '#a78bfa', r: 4 }}
            connectNulls={false}
            name="Day 2"
          />
          <Line
            type="monotone"
            dataKey="d3"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            connectNulls={false}
            name="Day 3"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Interpretation Guide */}
      <div className="mt-4 p-3 bg-glass-bg border border-glass-border rounded text-xs">
        <h4 className="font-semibold text-text-secondary mb-2">How to Read This Chart:</h4>
        <ul className="space-y-1 text-text-tertiary">
          <li>• Three lines show efficiency for each training day (D1, D2, D3)</li>
          <li>• Higher values = more calories burned per minute (higher intensity)</li>
          <li>• Gray dashed line shows overall average efficiency</li>
          <li>• Compare days: Is D3 (Friday) consistently harder than D1 (Monday)?</li>
        </ul>
      </div>
    </div>
  )
}
