'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/calendar',
      label: 'Calendar',
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/videos',
      label: 'Videos',
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
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
      href: '/stats',
      label: 'Stats',
      icon: (
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
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
