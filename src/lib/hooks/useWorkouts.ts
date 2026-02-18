'use client'

import { useState, useEffect } from 'react'
import { Workout, WorkoutFilters, WorkoutFormData, WorkoutPerformanceData } from '@/types/workout'

export function useWorkouts(filters?: WorkoutFilters) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkouts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.week) params.append('week', filters.week.toString())
      if (filters?.day) params.append('day', filters.day.toString())
      if (filters?.type) params.append('type', filters.type)
      if (filters?.section) params.append('section', filters.section)
      if (filters?.done !== undefined) params.append('done', filters.done.toString())

      const response = await fetch(`/api/sheets/workouts?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setWorkouts(data.data)
      } else {
        setError(data.error || 'Failed to fetch workouts')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkouts()
  }, [filters?.week, filters?.day, filters?.type, filters?.section, filters?.done])

  return {
    workouts,
    loading,
    error,
    refetch: fetchWorkouts,
  }
}

export function useWorkout(id: string) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkout = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sheets/workouts/${id}`)
      const data = await response.json()

      if (data.success) {
        setWorkout(data.data)
      } else {
        setError(data.error || 'Failed to fetch workout')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workout')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchWorkout()
    }
  }, [id])

  return {
    workout,
    loading,
    error,
    refetch: fetchWorkout,
  }
}

export function useCreateWorkout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWorkout = async (data: WorkoutFormData): Promise<Workout | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sheets/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to create workout')
        return null
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create workout')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createWorkout,
    loading,
    error,
  }
}

export function useUpdateWorkout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateWorkout = async (
    id: string,
    data: Partial<Workout> | WorkoutPerformanceData
  ): Promise<Workout | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sheets/workouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to update workout')
        return null
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update workout')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    updateWorkout,
    loading,
    error,
  }
}

export function useDeleteWorkout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteWorkout = async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sheets/workouts/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        return true
      } else {
        setError(result.error || 'Failed to delete workout')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete workout')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteWorkout,
    loading,
    error,
  }
}
