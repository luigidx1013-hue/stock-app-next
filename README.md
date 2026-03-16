# Stock App Next.js Starter

This is a Next.js rebuild of your current stock projection site, using the code and structure from your existing Vercel project.

## What's included
- Multi-section app shell
- Working `/analyzer` page based on your current frontend
- API route migrated from `[ticker].js` to `app/api/analyze/[ticker]/route.js`
- Placeholder sections for `/dashboard`, `/watchlists`, and `/profile`
- Reusable formatting utilities and chart component

## How to run locally
```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## How to deploy
1. Create a new GitHub repo for this Next.js version
2. Upload these files
3. Import the repo into Vercel
4. Deploy

## Recommended next steps
1. Confirm `/analyzer` works and matches your current site closely
2. Add Supabase Auth or Clerk
3. Add database tables for saved searches and watchlists
4. Protect `/dashboard`, `/watchlists`, and `/profile`
5. Add a mobile app later with Expo using the same API routes

## Suggested database tables for phase 2
- users
- saved_searches
- watchlists
- watchlist_items
- user_preferences
