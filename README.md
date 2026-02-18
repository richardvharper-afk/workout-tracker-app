# Workout Tracker

A mobile-first web application to track workouts using Google Sheets as the data source. Built with Next.js and optimized for iPhone Safari.

## Features

- **Google Sheets Integration**: Read and write workout data directly to your private Google Sheet
- **OAuth 2.0 Authentication**: Secure access to your spreadsheet
- **Mobile-First Design**: Optimized for iPhone and mobile browsers
- **Full CRUD Operations**: Create, read, update, and delete workouts
- **Performance Tracking**: Log sets, reps, load, and completion status
- **Filtering**: Filter workouts by week, day, type, and completion status
- **PWA Support**: Install as a home screen app on iOS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Google Sheets API v4
- **Authentication**: Google OAuth 2.0
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+ and npm
- Google account
- Google Cloud Console project with Sheets API enabled
- A Google Sheets spreadsheet with your workout data

## Getting Started

### 1. Clone the Repository

```bash
cd "C:\Users\CP362988\source\repos\New Workout Tracker Claude Code"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Google Cloud Console

See [SETUP.md](./SETUP.md) for detailed instructions on:
- Creating a Google Cloud project
- Enabling Google Sheets API
- Setting up OAuth 2.0 credentials
- Configuring the OAuth consent screen

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_spreadsheet_id
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret
```

To generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 5. Prepare Your Google Sheet

Your Google Sheet should have the following columns (starting from column A):

| Column | Field | Type | Description |
|--------|-------|------|-------------|
| A | Week | Number | Week number (1-52) |
| B | Day | Number | Day number (1-7) |
| C | Type | Text | Workout type (Upper Body, Lower Body, etc.) |
| D | Section | Text | Workout section (Warm-up, Strength, etc.) |
| E | Exercise | Text | Exercise name |
| F | Description | Text | Exercise description |
| G | Sets | Number | Number of sets |
| H | Reps | Text | Rep range (e.g., "8-12" or "10") |
| I | RIR | Number | Reps In Reserve (0-10) |
| J | Rest | Text | Rest time (e.g., "60s") |
| K | Escalation | Text | Escalation notes |
| L | Notes | Text | General notes |
| M | Set1 | Number | Actual reps for set 1 |
| N | Set2 | Number | Actual reps for set 2 |
| O | Set3 | Number | Actual reps for set 3 |
| P | Set4 | Number | Actual reps for set 4 |
| Q | Set5 | Number | Actual reps for set 5 |
| R | Load | Text | Weight or variation used |
| S | AvgRIR | Number | Average RIR (0-5) |
| T | Done | Boolean | Completion status (TRUE/FALSE) |
| U | LastSaved | Text | ISO timestamp of last save |

**Note**: The first row should contain headers. Data starts from row 2.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Test the Application

1. Click "Login with Google"
2. Authorize the application to access your Google Sheets
3. You should be redirected to the workouts page
4. Try adding, editing, and deleting workouts

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying to Vercel.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── workouts/          # Workout pages
│   │   └── profile/           # Profile page
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   ├── workout/          # Workout-specific components
│   │   └── auth/             # Authentication components
│   ├── lib/                  # Utility libraries
│   │   ├── google-sheets/    # Google Sheets integration
│   │   ├── utils/            # Helper functions
│   │   └── hooks/            # React hooks
│   ├── types/                # TypeScript type definitions
│   └── constants/            # Application constants
├── public/                   # Static assets
├── tests/                    # Test files
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Troubleshooting

### "Unauthorized" Error

- Make sure you've completed the OAuth setup in Google Cloud Console
- Check that your redirect URIs are correct
- Verify that your `.env.local` file has the correct credentials

### "Spreadsheet not found" Error

- Verify the `GOOGLE_SHEET_ID` in `.env.local`
- Make sure the spreadsheet is accessible with your Google account
- Check that the Google Sheets API is enabled in Google Cloud Console

### OAuth Callback Issues

- Ensure `NEXTAUTH_URL` matches your current domain
- For local development: `http://localhost:3000`
- For production: `https://your-app.vercel.app`
- Update redirect URIs in Google Cloud Console to match

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT

## Support

For issues and questions, please check the documentation files:
- [SETUP.md](./SETUP.md) - Google Cloud setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
