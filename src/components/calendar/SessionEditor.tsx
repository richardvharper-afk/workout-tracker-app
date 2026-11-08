'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Workout } from '@/types/workout'
import { Session } from '@/types/session'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUpdateWorkout } from '@/lib/hooks/useWorkouts'
import { parseDecimal } from '@/lib/utils/number'
import {
  parseSheetDate,
  toDateInputValue,
  applyDateToTimestamp,
  calculateSessionDuration,
} from '@/lib/utils/dates'

interface SessionEditorProps {
  week: number
  day: number
  /** Exercises of this session shown on the selected calendar day */
  workouts: Workout[]
  onSaved?: () => void
}

/**
 * Edit session-level data for a (possibly past) session:
 * the date it happened (moves all its saved exercises), duration, calories and RPE.
 */
export function SessionEditor({ week, day, workouts, onSaved }: SessionEditorProps) {
  const saved = useMemo(() => workouts.filter(w => w.lastSaved), [workouts])

  // The calendar places a session by its saved exercises' dates - that is the "current" date
  const currentDate = useMemo(() => {
    const dates = saved
      .map(w => parseSheetDate(w.lastSaved))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())
    return dates.length ? toDateInputValue(dates[0]) : ''
  }, [saved])

  const autoDuration = useMemo(
    () => calculateSessionDuration(saved.map(w => w.lastSaved)),
    [saved]
  )

  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [date, setDate] = useState(currentDate)
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')
  const [rpe, setRpe] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const { updateWorkout } = useUpdateWorkout()

  // Load stored session values when the panel is first opened
  useEffect(() => {
    if (!open || loaded) return
    let cancelled = false
    fetch(`/api/sheets/sessions?week=${week}&day=${day}`)
      .then(r => r.json())
      .then(res => {
        if (cancelled) return
        const s: Session | null = res.success ? res.data : null
        if (s) {
          setDuration(s.duration !== undefined ? String(s.duration) : '')
          setCalories(s.calories !== undefined ? String(s.calories) : '')
          setRpe(s.rpe !== undefined ? String(s.rpe) : '')
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [open, loaded, week, day])

  useEffect(() => {
    setDate(currentDate)
  }, [currentDate])

  // Nothing saved yet: there is no session to edit
  if (saved.length === 0) return null

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const dateChanged = !!date && date !== currentDate
      const res = await fetch('/api/sheets/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week,
          day,
          // Same fallback as the workout screen: typed value, else auto-calculated
          duration: parseDecimal(duration) ?? autoDuration,
          calories: parseDecimal(calories),
          rpe: parseDecimal(rpe),
          date: date || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save session')

      if (dateChanged) {
        // Move every saved exercise of this session to the new day (time of day preserved)
        for (const w of saved) {
          const ok = await updateWorkout(
            w.id,
            { lastSaved: applyDateToTimestamp(w.lastSaved, date) },
            { week: w.week, day: w.day, exercise: w.exercise }
          )
          if (!ok) throw new Error(`Could not move "${w.exercise}". Refresh and try again.`)
        }
      }

      setMessage({ ok: true, text: dateChanged ? 'Session saved and moved' : 'Session saved' })
      onSaved?.()
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || 'Failed to save session' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left min-h-[44px]"
      >
        <span className="text-sm font-semibold text-text-secondary">
          Session details · W{week}D{day}
        </span>
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 mt-2">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            helperText={
              date && date !== currentDate
                ? `Moves ${saved.length} saved exercise${saved.length > 1 ? 's' : ''} to this day`
                : undefined
            }
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Duration (min)"
              type="text"
              inputMode="decimal"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder={autoDuration !== undefined ? `Auto: ${autoDuration}` : 'min'}
            />
            <Input
              label="Calories"
              type="text"
              inputMode="decimal"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="kcal"
            />
            <Input
              label="RPE"
              type="text"
              inputMode="decimal"
              value={rpe}
              onChange={e => setRpe(e.target.value)}
              placeholder="1-10"
            />
          </div>
          {!loaded && <p className="text-xs text-text-tertiary">Loading saved session…</p>}
          {message && (
            <p className={`text-xs ${message.ok ? 'text-accent-green' : 'text-accent-pink'}`}>{message.text}</p>
          )}
          <Button variant="primary" fullWidth onClick={handleSave} loading={saving} disabled={!loaded}>
            Save Session
          </Button>
        </div>
      )}
    </div>
  )
}
