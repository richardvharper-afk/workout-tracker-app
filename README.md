# Workout Tracker

A mobile-first web application for tracking gym workouts with a single-exercise card view, calendar visualization, and performance analytics. Uses Google Sheets as the backend data store and is deployed on Vercel.

**Live URL**: https://workout-tracker-sigma-ten.vercel.app

## Features

- **Exercise Carousel** - One exercise at a time, full card view with prev/next navigation and position indicator
- **Smart Defaulting** - Auto-selects the next unworked day based on saved progress
- **Read-Only Mode** - Completed exercises lock inputs and show a "Completed" badge
- **Auto-Advance** - After saving, moves to the next exercise in the same day
- **Calendar View** - Monthly calendar with Mon/Wed/Fri schedule mapping, completion indicators (green/amber/grey), and day detail modal showing actual reps
- **Statistics Dashboard** - 4 stat cards + 4 charts tracking volume, progress, and completion
- **Google Sheets Backend** - All data lives in your Google Sheet; the app reads and writes directly
- **OAuth 2.0 Authentication** - Secure Google login
- **PWA Support** - Installable as a home screen app on iOS/Android

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.1 |
| Language | TypeScript | 5.3 |
| Styling | Tailwind CSS | 3.4 |
| Charts | Recharts | 3.7 |
| API | Google Sheets API v4 | via googleapis 132.0 |
| Auth | Google OAuth 2.0 | via google-auth-library |
| Dates | date-fns | 4.1 |
| Hosting | Vercel | - |
| Testing | Jest + Testing Library + MSW | 29.7 / 14.1 / 2.0 |

## Architecture Overview

```
src/
├── app/                          # Next.js App Router (pages + API routes)
│   ├── api/auth/                 # OAuth endpoints (login, callback, logout)
│   ├── api/sheets/workouts/      # Workout CRUD API (GET, POST, PUT, DELETE)
│   ├── calendar/                 # Calendar page
│   ├── stats/                    # Statistics page
│   ├── workouts/                 # Workouts page (carousel) + [id] detail + new form
│   ├── profile/                  # User profile page
│   ├── layout.tsx                # Root layout (fonts, metadata, global styles)
│   ├── page.tsx                  # Home/login landing page
│   └── globals.css               # Tailwind base + custom glass-morphism theme
│
├── components/
│   ├── auth/                     # LoginButton, LogoutButton
│   ├── calendar/                 # Calendar, CalendarDay, DayDetailModal
│   ├── layout/                   # Container, Header, Navigation (bottom tab bar)
│   ├── stats/                    # StatCard, StatsOverview, charts (see below)
│   ├── ui/                       # Reusable primitives (Button, Input, Modal, etc.)
│   └── workout/                  # ExerciseCarousel, SetInput, WorkoutForm, etc.
│
├── lib/
│   ├── google-sheets/            # Google Sheets integration layer
│   │   ├── auth.ts               # OAuth2Client singleton, token management
│   │   ├── client.ts             # Low-level Sheets API wrapper (getRows, updateRow, etc.)
│   │   ├── mapper.ts             # Row <-> Workout object mapping + validation
│   │   └── workouts.ts           # WorkoutsService (business logic: CRUD, filtering)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useWorkouts.ts        # Fetch/create/update workouts, manages loading state
│   │   └── useStats.ts           # Computes all statistics from workout data
│   └── utils/                    # Pure utility functions
│       ├── auth.ts               # requireAuth() - extracts tokens from cookies
│       ├── cookies.ts            # Cookie helpers (get, set, delete auth tokens)
│       └── stats.ts              # Stats calculations (volume, streaks, grouping)
│
├── types/                        # TypeScript interfaces
│   ├── workout.ts                # Workout, WorkoutPerformanceData, WorkoutFilters
│   ├── sheets.ts                 # GoogleAuthTokens, SHEET_COLUMNS mapping
│   └── api.ts                    # API response types
│
└── constants/
    └── config.ts                 # App config, Google Sheets config, auth config
```

## Component Reference

### Pages

| File | Route | Description |
|------|-------|-------------|
| `app/page.tsx` | `/` | Landing page with login button |
| `app/workouts/page.tsx` | `/workouts` | Main workout screen with ExerciseCarousel |
| `app/workouts/[id]/page.tsx` | `/workouts/:id` | Individual workout detail (deep-link) |
| `app/workouts/new/page.tsx` | `/workouts/new` | New workout form |
| `app/calendar/page.tsx` | `/calendar` | Monthly calendar view |
| `app/stats/page.tsx` | `/stats` | Statistics dashboard |
| `app/profile/page.tsx` | `/profile` | User profile |

### API Routes

| File | Method | Route | Description |
|------|--------|-------|-------------|
| `api/auth/login/route.ts` | GET | `/api/auth/login` | Redirects to Google OAuth consent |
| `api/auth/callback/route.ts` | GET | `/api/auth/callback` | Handles OAuth callback, sets auth cookies |
| `api/auth/logout/route.ts` | GET | `/api/auth/logout` | Clears auth cookies |
| `api/sheets/workouts/route.ts` | GET | `/api/sheets/workouts` | Fetch all workouts (with optional filters) |
| `api/sheets/workouts/route.ts` | POST | `/api/sheets/workouts` | Create a new workout |
| `api/sheets/workouts/[id]/route.ts` | GET/PUT/DELETE | `/api/sheets/workouts/:id` | Single workout CRUD |

### Workout Components

| Component | File | Description |
|-----------|------|-------------|
| `ExerciseCarousel` | `workout/ExerciseCarousel.tsx` | Main workout UX: week/day dropdowns, single exercise card, performance form, prev/next nav, auto-advance on save |
| `SetInput` / `SetInputGroup` | `workout/SetInput.tsx` | Numeric inputs for set1-set5 with disabled support |
| `WorkoutForm` | `workout/WorkoutForm.tsx` | Full workout creation/edit form |
| `WorkoutCard` | `workout/WorkoutCard.tsx` | Compact workout display card |
| `WorkoutList` | `workout/WorkoutList.tsx` | Legacy list view (replaced by ExerciseCarousel) |
| `DayCard` | `workout/DayCard.tsx` | Legacy collapsible day group |

### Calendar Components

| Component | File | Description |
|-----------|------|-------------|
| `Calendar` | `calendar/Calendar.tsx` | Monthly grid with Mon/Wed/Fri schedule mapping. Infers program start from saved data. Two-pass placement: saved exercises by date, unsaved by schedule. |
| `CalendarDay` | `calendar/CalendarDay.tsx` | Single day cell with completion indicator (green=done, amber=partial, grey=planned) |
| `DayDetailModal` | `calendar/DayDetailModal.tsx` | Tap a day to see exercises with actual set values, RIR, load, and completion status |

### Stats Components

| Component | File | Description |
|-----------|------|-------------|
| `StatsOverview` | `stats/StatsOverview.tsx` | Orchestrates all stat cards and charts |
| `StatCard` | `stats/StatCard.tsx` | Single metric card (value + label + color) |
| `StreakCalendar` | `stats/StreakCalendar.tsx` | GitHub-style 12-week activity heatmap |
| `VolumeChart` | `stats/VolumeChart.tsx` | Area chart: weekly volume with Sets/Reps/Volume toggle |
| `VolumeByTypeChart` | `stats/VolumeByTypeChart.tsx` | Stacked bar chart: volume per week broken down by workout type |
| `ExerciseProgressChart` | `stats/ExerciseProgressChart.tsx` | Line chart: per-exercise total volume + peak rep across weeks |

### UI Components

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `ui/Button.tsx` | Primary/ghost/danger variants with loading state |
| `Input` | `ui/Input.tsx` | Text/number input with label and error |
| `Checkbox` | `ui/Checkbox.tsx` | Styled checkbox with label |
| `Select` | `ui/Select.tsx` | Styled select dropdown |
| `Modal` | `ui/Modal.tsx` | Overlay modal with close button |
| `Card` | `ui/Card.tsx` | Glass-morphism card container |
| `Spinner` / `FullPageSpinner` | `ui/Spinner.tsx` | Loading indicators |
| `Skeleton` | `ui/Skeleton.tsx` | Content placeholder skeleton |

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| `Header` | `layout/Header.tsx` | Page title header |
| `Navigation` | `layout/Navigation.tsx` | Fixed bottom tab bar (Workouts, Calendar, +, Stats, Profile) |
| `Container` | `layout/Container.tsx` | Centered content wrapper with max-width |

### Hooks

| Hook | File | Description |
|------|------|-------------|
| `useWorkouts` | `hooks/useWorkouts.ts` | Fetches workouts, returns `{ workouts, loading, error, refetch }` |
| `useUpdateWorkout` | `hooks/useWorkouts.ts` | `updateWorkout(id, data)` with loading/error state |
| `useCreateWorkout` | `hooks/useWorkouts.ts` | `createWorkout(data)` with loading/error state |
| `useWorkout` | `hooks/useWorkouts.ts` | Fetches single workout by ID |
| `useStats` | `hooks/useStats.ts` | Computes all stats from workouts (memoized) |

### Stats Utilities (`lib/utils/stats.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `calculateDaysCompletedRate` | `number` | % of training days where all exercises have `done: true` |
| `calculateVolumeChange` | `number \| null` | % volume change between latest two weeks (from set1-set5) |
| `calculateStreak` | `number` | Consecutive completed days from most recent |
| `calculateCompletionRate` | `number` | % of all exercises marked done |
| `groupVolumeByWeek` | `WeeklyVolumeData[]` | Sets, reps, volume per week from actual set data |
| `groupVolumeByType` | `{ data, types }` | Volume per week grouped by workout type |
| `groupByExercise` | `ExerciseProgressData[]` | Volume + peak rep per exercise per week |

## Data Model

### Google Sheet Columns

| Col | Field | Type | Description |
|-----|-------|------|-------------|
| A | Week | Number | Week number (1-52) |
| B | Day | Number | Day number (1-3 for Mon/Wed/Fri) |
| C | Type | Text | Upper Body, Lower Body, Full Body, Core, Cardio, Flexibility |
| D | Section | Text | Warm-up, Strength, Accessory, Core, Cool-down, Cardio |
| E | Exercise | Text | Exercise name |
| F | Description | Text | Exercise description/notes |
| G | Sets | Number | Planned number of sets |
| H | Reps | Text | Rep target (e.g., "8-12" or "10") |
| I | RIR | Number | Reps In Reserve target (0-10) |
| J | Rest | Text | Rest period (e.g., "60s", "90s") |
| K | Escalation | Text | Progression notes |
| L | Notes | Text | General notes |
| M-Q | Set1-Set5 | Number | Actual reps completed per set |
| R | Load | Text | Weight or variation (e.g., "135 lbs") |
| S | AvgRIR | Number | Average RIR across sets |
| T | Done | Boolean | TRUE when exercise is fully completed |
| U | LastSaved | Text | ISO timestamp of last save |

### Key Data Conventions

- **`done`** = exercise is fully completed (controls read-only mode, calendar completion)
- **`lastSaved`** = data was saved at some point (controls smart defaulting, volume calculations)
- **Volume** = sum of actual values in set1-set5 (not planned sets x reps)
- **Schedule** = Day 1 = Monday, Day 2 = Wednesday, Day 3 = Friday

## Prerequisites

- Node.js 18+ and npm
- Google account
- Google Cloud Console project with Sheets API enabled
- A Google Sheet with workout data (see column layout above)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Cloud Console

See [SETUP.md](./SETUP.md) for detailed instructions on creating OAuth credentials.

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_spreadsheet_id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000, click "Login with Google", authorize, and start tracking.

## Deployment (Vercel)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions. Key steps:

1. `npm install -g vercel && vercel login`
2. `vercel deploy --yes --prod`
3. Set environment variables via `vercel env add`
4. Add `https://your-app.vercel.app/api/auth/callback` to Google OAuth redirect URIs

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## Troubleshooting

### "Unauthorized" Error
- Verify `.env.local` credentials match Google Cloud Console
- Check that redirect URIs include your current domain

### Weekly Volume Shows 0
- Volume is calculated from actual set1-set5 values, not planned reps
- Make sure you've entered rep counts and saved

### Calendar Shows Wrong Dates
- Calendar uses Mon/Wed/Fri mapping (Day 1=Mon, Day 2=Wed, Day 3=Fri)
- Program start date is inferred from the first saved workout

### Corporate Network SSL Errors
- Run with `NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev` for local development
- This is a corporate proxy issue, not an app bug

## License

MIT
