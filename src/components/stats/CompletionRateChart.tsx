'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface CompletionRateChartProps {
  completed: number
  total: number
}

export function CompletionRateChart({ completed, total }: CompletionRateChartProps) {
  const incomplete = total - completed
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  const data = [
    { name: 'Completed', value: completed },
    { name: 'Incomplete', value: incomplete },
  ]

  const COLORS = ['#00ff94', '#2a2a3a']

  if (total === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Completion Rate</h3>
        <p className="text-text-tertiary text-sm text-center py-8">
          No workout data yet
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Completion Rate</h3>

      <div className="relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent-green">{rate}%</p>
            <p className="text-[10px] text-text-tertiary">Complete</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 text-xs mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span className="text-text-secondary">{completed} done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#2a2a3a]" />
          <span className="text-text-secondary">{incomplete} left</span>
        </div>
      </div>
    </div>
  )
}
