'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const leftItems = [
    {
      href: '/workouts',
      label: 'Workouts',
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      href: '/calendar',
      label: 'Calendar',
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  const rightItems = [
    {
      href: '/stats',
      label: 'Stats',
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  const isActive = (href: string) => {
    if (href === '/workouts') return pathname === '/workouts' || pathname.startsWith('/workouts/')
    return pathname === href
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-dark-secondary/80 backdrop-blur-lg border-t border-glass-border"
      style={{
        paddingBottom: 'var(--safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-16 relative">
        {/* Left items */}
        {leftItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'text-accent-cyan drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}

        {/* Center FAB */}
        <Link
          href="/workouts/new"
          className="flex items-center justify-center w-14 h-14 -mt-7 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple shadow-glow-cyan active:scale-95 transition-transform"
        >
          <svg className="w-7 h-7 text-dark-base" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* Right items */}
        {rightItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'text-accent-cyan drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
