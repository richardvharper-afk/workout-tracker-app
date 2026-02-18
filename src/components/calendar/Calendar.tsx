'use client'

import React, { useState, useMemo } from 'react'
import { Workout } from '@/types/workout'
import { CalendarDay } from './CalendarDay'
import { DayDetailModal } from './DayDetailModal'

interface CalendarProps {
  workouts: Workout[]
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function Calendar({ workouts }: CalendarProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Map workouts to calendar days using week/day numbers
  // We create a simple mapping: week 1 day 1 = first Monday-like day pattern
  const workoutsByDay = useMemo(() => {
    const map: Record<string, Workout[]> = {}
    workouts.forEach(w => {
      // Map week+day to a calendar day offset
      // Assuming week 1 starts at the beginning of the year's program
      const dayOffset = (w.week - 1) * 7 + (w.day - 1)
      // Use a reference start date (Jan 1 of current year as program start)
      const startDate = new Date(currentYear, 0, 1)
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + dayOffset)

      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const dayNum = date.getDate()
        const key = String(dayNum)
        if (!map[key]) map[key] = []
        map[key].push(w)
      }
    })
    return map
  }, [workouts, currentMonth, currentYear])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null)
  }

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(null)
  }

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

  const selectedWorkouts = selectedDay ? (workoutsByDay[String(selectedDay)] || []) : []
  const selectedDateStr = selectedDay
    ? new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="glass-card p-2 hover:border-accent-cyan/30 transition-colors"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-text-primary">
          {formatMonth(currentYear, currentMonth)}
        </h2>

        <button
          onClick={goToNextMonth}
          className="glass-card p-2 hover:border-accent-cyan/30 transition-colors"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-text-tertiary py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => (
          <CalendarDay
            key={i}
            dayNumber={day}
            isToday={day !== null && isToday(day)}
            isSelected={day === selectedDay}
            workouts={day !== null ? (workoutsByDay[String(day)] || []) : []}
            onClick={() => {
              if (day !== null) {
                setSelectedDay(day === selectedDay ? null : day)
              }
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent-amber" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-text-tertiary" />
          <span>Planned</span>
        </div>
      </div>

      {/* Day detail modal */}
      <DayDetailModal
        isOpen={selectedDay !== null && selectedWorkouts.length > 0}
        onClose={() => setSelectedDay(null)}
        date={selectedDateStr}
        workouts={selectedWorkouts}
      />
    </div>
  )
}
