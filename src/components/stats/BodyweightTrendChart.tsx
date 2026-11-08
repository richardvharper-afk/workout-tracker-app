'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { parseISO, format } from 'date-fns'
import { BodyMetric } from '@/types/body-metrics'

export function BodyweightTrendChart({ bodyMetrics }: { bodyMetrics: BodyMetric[] }) {
  const data = bodyMetrics
    .filter(m => m.date && m.bodyweight !== undefined)
    .map(m => ({ ts: parseISO(m.date).getTime(), date: m.date, weight: m.bodyweight as number }))
    .filter(d => !isNaN(d.ts))
    .sort((a, b) => a.ts - b.ts)

  if (data.length < 2) {
    return (
      <p className="text-text-tertiary text-sm text-center py-8">
        Log your weight on at least two days (Profile tab) to see a trend.
      </p>
    )
  }

  const first = data[0].weight
  const last = data[data.length - 1].weight
  const change = last - first

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-2xl font-bold text-accent-cyan">{last.toFixed(1)} kg</p>
        <p className={`text-sm font-semibold ${change > 0 ? 'text-accent-amber' : change < 0 ? 'text-accent-green' : 'text-text-secondary'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)} kg since {format(new Date(data[0].ts), 'd MMM')}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(t) => format(new Date(t), 'd MMM')}
            stroke="#6a6a7f"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6a6a7f"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={['dataMin - 1', 'dataMax + 1']}
            tickFormatter={(v) => Number(v).toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(19,19,27,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e8e8f2',
              fontSize: 12,
            }}
            labelFormatter={(t) => format(new Date(t as number), 'd MMM yyyy')}
            formatter={(v: any) => [`${v} kg`, 'Bodyweight']}
          />
          <Line type="monotone" dataKey="weight" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
