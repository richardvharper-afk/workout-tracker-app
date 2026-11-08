/** Shared look for the rest timer: colour shifts as time runs out. */
export type TimerTone = 'normal' | 'warning' | 'urgent' | 'done'

export function getTimerTone(remaining: number, completed: boolean): TimerTone {
  if (completed) return 'done'
  if (remaining <= 5) return 'urgent'
  if (remaining <= 10) return 'warning'
  return 'normal'
}

export const TONE_COLORS: Record<TimerTone, { stroke: string; glow: string; text: string }> = {
  normal: { stroke: '#00d4ff', glow: 'rgba(0,212,255,0.45)', text: 'text-accent-cyan' },
  warning: { stroke: '#ffb800', glow: 'rgba(255,184,0,0.5)', text: 'text-accent-amber' },
  urgent: { stroke: '#ff3b6d', glow: 'rgba(255,59,109,0.55)', text: 'text-accent-pink' },
  done: { stroke: '#00ff94', glow: 'rgba(0,255,148,0.5)', text: 'text-accent-green' },
}
