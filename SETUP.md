# Google Cloud Setup Guide

This guide walks you through setting up Google Cloud Console for the Workout Tracker app.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "New Project"
4. Enter project name: "Workout Tracker" (or your preferred name)
5. Click "Create"
6. Wait for the project to be created, then select it

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click "Enable"
5. Wait for the API to be enabled

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"

### Fill in the OAuth consent screen:

**App information:**
- App name: `Workout Tracker`
- User support email: Your email address
- App logo: (Optional) Upload a logo

**App domain:**
- Application home page: `https://your-app.vercel.app` (or leave blank for now)
- Application privacy policy link: (Optional)
- Application terms of service link: (Optional)

**Developer contact information:**
- Email addresses: Your email address

4. Click "Save and Continue"

### Scopes:

1. Click "Add or Remove Scopes"
2. Filter for "Google Sheets API"
3. Select: `https://www.googleapis.com/auth/spreadsheets`
4. Click "Update"
5. Click "Save and Continue"

### Test users:

1. Click "Add Users"
2. Add your Google account email address
3. Click "Add"
4. Click "Save and Continue"

### Summary:

1. Review your settings
2. Click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"

### Configure the OAuth client:

**Name:** `Workout Tracker Web Client`

**Authorized JavaScript origins:**
- `http://localhost:3000` (for local development)
- `https://your-app.vercel.app` (add this after deploying to Vercel)

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/callback` (for local development)
- `https://your-app.vercel.app/api/auth/callback` (add this after deploying)

4. Click "Create"

### Save your credentials:

You'll see a popup with your Client ID and Client Secret:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `xxxxx`

**Important**: Copy these values immediately! You'll need them for your `.env.local` file.

## Step 5: Get Your Google Sheet ID

1. Open your Google Sheets spreadsheet
2. Look at the URL in your browser:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```
3. Copy the `SPREADSHEET_ID` portion (the long string between `/d/` and `/edit`)

## Step 6: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_SHEET_ID=your_spreadsheet_id_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_this_with_openssl
```

To generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Step 7: Prepare Your Google Sheet

Make sure your Google Sheet has the correct structure:

1. First row should be headers
2. Data starts from row 2
3. Columns A-U should match the schema (see README.md)

Example header row:
```
Week | Day | Type | Section | Exercise | Description | Sets | Reps | RIR | Rest | Escalation | Notes | Set1 | Set2 | Set3 | Set4 | Set5 | Load | AvgRIR | Done | LastSaved
```

## Step 8: Test Authentication

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Login with Google"
4. You should see the Google OAuth consent screen
5. Click "Continue" to authorize the app
6. You should be redirected to `/workouts`

## Troubleshooting

### "This app isn't verified" Warning

If you see this warning:
1. Click "Advanced"
2. Click "Go to Workout Tracker (unsafe)"
3. This is normal for apps in development/testing mode

To remove this warning, you need to submit your app for Google verification (only necessary for production apps with external users).

### "Access blocked: This app's request is invalid"

Causes:
- Redirect URI doesn't match what's configured in Google Cloud Console
- Make sure `NEXTAUTH_URL` in `.env.local` matches your actual URL
- Check for typos in redirect URIs

### "Error 403: access_denied"

Causes:
- Your Google account is not added as a test user
- Go to OAuth consent screen → Test users and add your email

### Can't access spreadsheet

Causes:
- Wrong spreadsheet ID
- Spreadsheet not shared with your Google account
- Google Sheets API not enabled

## Production Setup

When deploying to Vercel:

1. Update OAuth Credentials in Google Cloud Console:
   - Add your Vercel URL to "Authorized JavaScript origins"
   - Add `https://your-app.vercel.app/api/auth/callback` to redirect URIs

2. Update environment variables in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Set `NEXTAUTH_URL` to your production URL

3. Redeploy your app on Vercel

## Security Best Practices

1. **Never commit credentials**: Make sure `.env.local` is in `.gitignore`
2. **Rotate secrets regularly**: Especially if exposed
3. **Use separate projects**: Consider separate Google Cloud projects for dev/prod
4. **Limit OAuth scopes**: Only request the minimum required permissions
5. **Monitor API usage**: Check Google Cloud Console for unusual activity

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
