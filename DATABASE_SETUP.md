# Database Setup Instructions

This project uses serverless functions (Vercel) that connect to a cloud PostgreSQL database. The frontend can still be hosted on GitHub Pages.

## Step 1: Set Up a Database

Choose one of these free PostgreSQL providers:

### Option 1: Supabase (Recommended - Free Tier)
1. Go to https://supabase.com
2. Create a free account
3. Create a new project
4. Go to Settings → Database
5. Copy the "Connection string" (URI format)
6. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Option 2: Railway
1. Go to https://railway.app
2. Create a free account
3. Create a new PostgreSQL database
4. Copy the connection string from the database settings

### Option 3: PlanetScale (MySQL compatible)
1. Go to https://planetscale.com
2. Create a free account
3. Create a new database
4. Copy the connection string

## Step 2: Run the Database Schema

1. Connect to your database using a SQL client (pgAdmin, DBeaver, or the web console)
2. Run the SQL script from `database/schema.sql`
3. This will create the necessary tables

## Step 3: Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link your project: `vercel link`
4. Set environment variables:
   ```bash
   vercel env add DATABASE_URL
   # Paste your database connection string when prompted
   
   vercel env add DATABASE_SSL
   # Enter 'true' if your database requires SSL, otherwise 'false'
   ```
5. Deploy: `vercel --prod`

## Step 4: Update Frontend Configuration

After deploying, you'll get a URL like `https://your-project.vercel.app`

Update `game.js` and `in-class-quiz-ui.js` to use your Vercel API URL instead of JSONBin.

## Environment Variables in Vercel Dashboard

Alternatively, you can set environment variables in the Vercel dashboard:
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `DATABASE_SSL`: `true` or `false`

## Testing Locally

1. Create a `.env` file in the root directory (copy from `.env.example`)
2. Add your `DATABASE_URL`
3. Run `vercel dev` to test locally


