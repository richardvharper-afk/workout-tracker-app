# Deployment Guide

This guide walks you through deploying the Workout Tracker app to Vercel.

## Why Vercel?

Vercel is the recommended deployment platform because:
- **Next.js Native**: Built by the Next.js team
- **Free Tier**: Generous free tier for personal projects
- **Serverless Functions**: API routes work out-of-the-box
- **Environment Variables**: Secure storage for secrets
- **Auto HTTPS**: Required for OAuth callbacks
- **GitHub Integration**: Auto-deploy on git push
- **Zero Configuration**: No complex setup required

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Google Cloud OAuth credentials configured (see [SETUP.md](./SETUP.md))
- Git installed locally

## Step 1: Push Code to GitHub

### Initialize Git Repository (if not already done)

```bash
cd "C:\Users\CP362988\source\repos\New Workout Tracker Claude Code"
git init
git add .
git commit -m "Initial commit"
```

### Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name: `workout-tracker` (or your preferred name)
4. Keep it **Private** (recommended for personal projects)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/workout-tracker.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Import Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Click "Import" next to your GitHub repository
4. If you don't see it, click "Adjust GitHub App Permissions" to grant access

### Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave as default)

**Build Command:** `npm run build` (auto-filled)

**Output Directory:** `.next` (auto-filled)

### Add Environment Variables

Click "Environment Variables" and add:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_spreadsheet_id
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=your_random_secret
```

**Important Notes:**
- Add these to "Production", "Preview", and "Development" environments
- For `NEXTAUTH_URL`, use your Vercel app URL (you'll get this after first deploy)
- If you don't know your Vercel URL yet, you can add it later

### Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 1-2 minutes)
3. Once deployed, you'll see your app URL: `https://your-project-name.vercel.app`

## Step 3: Update Google OAuth Settings

Now that you have your production URL, update Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID

### Add Production URLs

**Authorized JavaScript origins:**
- Add: `https://your-project-name.vercel.app`

**Authorized redirect URIs:**
- Add: `https://your-project-name.vercel.app/api/auth/callback`

Click "Save"

## Step 4: Update NEXTAUTH_URL in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Find `NEXTAUTH_URL`
5. Click "Edit"
6. Update to: `https://your-project-name.vercel.app`
7. Click "Save"

### Redeploy

After updating environment variables:

1. Go to "Deployments" tab
2. Click "..." on the latest deployment
3. Click "Redeploy"

Or just push a new commit to trigger auto-deploy.

## Step 5: Test Production App

1. Visit your production URL: `https://your-project-name.vercel.app`
2. Click "Login with Google"
3. Complete OAuth flow
4. Test all features:
   - View workouts
   - Add workout
   - Edit workout
   - Delete workout

## Custom Domain (Optional)

### Add a Custom Domain

1. Go to Vercel Dashboard → Your Project
2. Go to "Settings" → "Domains"
3. Click "Add"
4. Enter your domain name (e.g., `workouts.yourdomain.com`)
5. Follow Vercel's instructions to configure DNS

### Update Google OAuth

After adding a custom domain:

1. Add domain to Google Cloud Console OAuth credentials:
   - Authorized origins: `https://workouts.yourdomain.com`
   - Redirect URIs: `https://workouts.yourdomain.com/api/auth/callback`

2. Update `NEXTAUTH_URL` in Vercel to your custom domain

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# Vercel will automatically deploy
```

### Preview Deployments

Every pull request gets its own preview URL for testing before merging.

## Environment Variables Management

### View Variables

Vercel Dashboard → Project → Settings → Environment Variables

### Update Variables

1. Click "Edit" on any variable
2. Update value
3. Choose which environments to apply to
4. Click "Save"
5. Redeploy for changes to take effect

### Add New Variables

1. Click "Add New"
2. Enter key and value
3. Select environments
4. Click "Save"

## Monitoring and Logs

### View Logs

1. Vercel Dashboard → Project → "Deployments"
2. Click on a deployment
3. Click "View Function Logs"

### View Analytics

Vercel Dashboard → Project → "Analytics"

See:
- Page views
- Top pages
- Devices
- Locations

## Troubleshooting

### Build Failed

Check build logs in Vercel:
- Missing dependencies? Run `npm install` locally first
- TypeScript errors? Run `npm run build` locally to test
- Environment variables missing? Check Vercel settings

### OAuth Not Working

Common issues:
- `NEXTAUTH_URL` doesn't match your actual URL
- Google Cloud Console redirect URIs don't match
- Missing environment variables in Vercel

### API Routes Return 500

Check function logs in Vercel:
- Google Sheets API errors
- Authentication issues
- Missing environment variables

### Changes Not Appearing

- Clear browser cache
- Force redeploy in Vercel
- Check that changes were pushed to GitHub

## Performance Optimization

### Enable Vercel Analytics

1. Vercel Dashboard → Project → "Analytics"
2. Click "Enable Analytics"
3. Free tier includes basic analytics

### Monitor API Usage

Check Google Cloud Console:
- APIs & Services → Dashboard
- Monitor Sheets API quota usage
- Limit: 60 requests/minute/user

### Optimize Images

If you add images later:
- Use Next.js `<Image>` component
- Vercel automatically optimizes images

## Security Checklist

- [ ] Environment variables added to Vercel (not committed to Git)
- [ ] `.env.local` in `.gitignore`
- [ ] Google OAuth redirect URIs match production URL
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Repository set to Private on GitHub
- [ ] Regular dependency updates (`npm audit`)

## Backup Strategy

Your data is stored in Google Sheets, so:
- Make regular backups of your spreadsheet
- File → Make a copy in Google Sheets
- Consider version history in Google Sheets

## Cost Considerations

### Vercel Free Tier Limits

- 100 GB bandwidth per month
- 100 hours of serverless function execution
- 6,000 build minutes per month

This is more than enough for personal use.

### If You Exceed Free Tier

- Upgrade to Vercel Pro ($20/month)
- Or optimize by reducing API calls
- Or deploy to alternative platform (e.g., self-hosted)

## Alternative Deployment Options

While Vercel is recommended, you can also deploy to:

### Railway.app

Similar to Vercel, also has a free tier

### Netlify

Supports Next.js with serverless functions

### Self-Hosted (VPS)

Requires Node.js server:
```bash
npm run build
npm start
```

Use PM2 or systemd for process management.

## Getting Help

If deployment issues persist:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel community: [github.com/vercel/next.js/discussions](https://github.com/vercel/next.js/discussions)
- Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Share the URL with yourself for mobile testing
3. Add to iPhone home screen as PWA
4. Start tracking your workouts!
