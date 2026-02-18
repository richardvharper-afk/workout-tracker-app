'use client'

import { LoginButton } from '@/components/auth/LoginButton'

export default function Home() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto animate-fade-in">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-accent-cyan to-accent-purple rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-glow-cyan">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-3">
            Workout Tracker
          </h1>
          <p className="text-lg text-text-secondary">
            Track your workouts with Google Sheets integration
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="glass-card p-4 flex items-start gap-3 text-left">
            <div className="w-8 h-8 bg-accent-cyan/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-accent-cyan"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Sync with Google Sheets</h3>
              <p className="text-sm text-text-secondary">
                Your data stays in your private spreadsheet
              </p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-start gap-3 text-left">
            <div className="w-8 h-8 bg-accent-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-accent-purple"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Mobile-First</h3>
              <p className="text-sm text-text-secondary">
                Optimized for iPhone and mobile browsers
              </p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-start gap-3 text-left">
            <div className="w-8 h-8 bg-accent-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-accent-green"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Track Progress</h3>
              <p className="text-sm text-text-secondary">
                Log sets, reps, and load for every workout
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <LoginButton />
          <p className="text-xs text-text-tertiary">
            Secure login with your Google account
          </p>
        </div>
      </div>
    </main>
  )
}
