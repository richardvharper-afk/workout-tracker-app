import type { Metadata } from 'next'
import './globals.css'
import { RestTimerProvider } from '@/components/providers/RestTimerProvider'
import { FloatingRestTimer } from '@/components/workout/FloatingRestTimer'

export const metadata: Metadata = {
  title: 'Workout Tracker',
  description: 'Track your workouts with ease',
  manifest: '/manifest.json',
  themeColor: '#0a0a0f',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Workout Tracker',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RestTimerProvider>
          {children}
          <FloatingRestTimer />
        </RestTimerProvider>
      </body>
    </html>
  )
}
