'use client'

import React, { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { Container } from '@/components/layout/Container'
import { useWorkouts } from '@/lib/hooks/useWorkouts'
import { FullPageSpinner } from '@/components/ui/Spinner'

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    // Handle youtu.be short links
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`

    // Handle youtube.com/watch?v= links
    const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`

    // Handle youtube.com/embed/ links (already embed format)
    if (url.includes('youtube.com/embed/')) return url

    return null
  } catch {
    return null
  }
}

export default function VideosPage() {
  const { workouts, loading, error } = useWorkouts()
  const [selectedExercise, setSelectedExercise] = useState<string>('')

  const exerciseVideos = useMemo(() => {
    const map = new Map<string, string>()
    for (const w of workouts) {
      if (w.videoUrl && w.exercise && !map.has(w.exercise)) {
        map.set(w.exercise, w.videoUrl)
      }
    }
    return Array.from(map.entries())
      .map(([exercise, url]) => ({ exercise, url }))
      .sort((a, b) => a.exercise.localeCompare(b.exercise))
  }, [workouts])

  const selectedVideo = exerciseVideos.find(v => v.exercise === selectedExercise)
  const embedUrl = selectedVideo ? getYouTubeEmbedUrl(selectedVideo.url) : null

  if (loading) {
    return <FullPageSpinner />
  }

  return (
    <div className="min-h-[100dvh] flex flex-col pb-20">
      <Header title="Videos" />
      <Container className="flex-1 py-4">
        {error ? (
          <div className="glass-card p-6 text-center">
            <p className="text-accent-pink mb-2">{error}</p>
            <p className="text-text-tertiary text-sm">Login to view exercise videos</p>
          </div>
        ) : exerciseVideos.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-text-secondary mb-2">No exercise videos found</p>
            <p className="text-text-tertiary text-sm">Add video URLs to your exercises in the spreadsheet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full p-3 rounded-lg bg-dark-secondary border border-glass-border text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="">Select an exercise...</option>
              {exerciseVideos.map(({ exercise }) => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </select>

            {selectedExercise && embedUrl && (
              <div className="space-y-3">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={embedUrl}
                    title={selectedExercise}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-text-secondary text-center font-medium">{selectedExercise}</p>
              </div>
            )}

            {selectedExercise && !embedUrl && (
              <div className="glass-card p-6 text-center">
                <p className="text-accent-pink">Invalid video URL for this exercise</p>
              </div>
            )}
          </div>
        )}
      </Container>
      <Navigation />
    </div>
  )
}
