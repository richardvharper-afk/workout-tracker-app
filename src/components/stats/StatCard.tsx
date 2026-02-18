import React from 'react'

interface StatCardProps {
  value: number | string
  label: string
  color: 'cyan' | 'purple' | 'green' | 'amber'
}

const colorMap = {
  cyan: 'text-accent-cyan shadow-glow-cyan/30',
  purple: 'text-accent-purple shadow-glow-purple/30',
  green: 'text-accent-green shadow-glow-green/30',
  amber: 'text-accent-amber shadow-glow-amber/30',
}

export function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className={`glass-card p-4 text-center ${colorMap[color]}`}>
      <p className={`text-2xl font-bold ${colorMap[color].split(' ')[0]}`}>
        {value}
      </p>
      <p className="text-xs text-text-tertiary mt-1">{label}</p>
    </div>
  )
}
