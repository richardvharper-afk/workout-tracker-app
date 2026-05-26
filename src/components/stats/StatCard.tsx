import React from 'react'

interface StatCardProps {
  value: number | string
  label: string
  subtitle?: string
  color: 'cyan' | 'purple' | 'green' | 'amber' | 'pink' | 'gray'
}

const colorMap = {
  cyan: 'text-accent-cyan shadow-glow-cyan/30',
  purple: 'text-accent-purple shadow-glow-purple/30',
  green: 'text-accent-green shadow-glow-green/30',
  amber: 'text-accent-amber shadow-glow-amber/30',
  pink: 'text-accent-pink shadow-glow-pink/30',
  gray: 'text-text-secondary',
}

export function StatCard({ value, label, subtitle, color }: StatCardProps) {
  return (
    <div className={`glass-card p-4 text-center ${colorMap[color]}`}>
      <p className={`text-2xl font-bold ${colorMap[color].split(' ')[0]}`}>
        {value}
      </p>
      <p className="text-xs text-text-tertiary mt-1">{label}</p>
      {subtitle && (
        <p className="text-[10px] text-text-tertiary/70 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  )
}
