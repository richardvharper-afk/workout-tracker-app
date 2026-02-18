'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  title?: string
  showBack?: boolean
  action?: React.ReactNode
}

export function Header({ title, showBack = false, action }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-40 bg-dark-secondary/80 backdrop-blur-lg border-b border-glass-border"
      style={{
        paddingTop: 'var(--safe-area-inset-top)',
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <Link
              href={pathname.includes('/workouts/') ? '/workouts' : '/'}
              className="p-2 -ml-2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <h1 className="text-xl font-semibold text-text-primary truncate">
            {title || 'Workout Tracker'}
          </h1>
        </div>
        {action && <div className="ml-2">{action}</div>}
      </div>
    </header>
  )
}
