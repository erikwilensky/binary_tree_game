# Supabase Setup Guide

Your Supabase project is ready! Follow these steps to complete the setup.

## Step 1: Get Your Database Connection String

1. Go to your Supabase project: https://supabase.com/dashboard/project/zihmxkuwkyqcwqrjbgoo
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection string** section
4. Select **URI** format
5. Copy the connection string (it will look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.zihmxkuwkyqcwqrjbgoo.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password (found in Settings → Database → Database password)

## Step 2: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `database/schema.sql`
4. Click **Run** (or press Ctrl+Enter)
5. You should see "Successfully created" messages

## Step 3: Set Up Row Level Security (RLS)

For security, you should enable RLS on your tables. Run this in the SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we're using serverless functions with service role)
-- For public read access (optional):
CREATE POLICY "Allow public read on high_scores" ON high_scores FOR SELECT USING (true);
CREATE POLICY "Allow public read on quiz_answers" ON quiz_answers FOR SELECT USING (true);

-- For serverless function access (using service role key):
-- The serverless functions will use the service role key which bypasses RLS
```

**Note**: Since you're using serverless functions, you can use the **service role key** which bypasses RLS. Get it from Settings → API → service_role key.

## Step 4: Configure Environment Variables

### For Vercel Deployment:

1. In Vercel dashboard, go to your project → **Settings** → **Environment Variables**
2. Add these variables:

   - **DATABASE_URL**: Your PostgreSQL connection string from Step 1
   - **DATABASE_SSL**: `true` (Supabase requires SSL)

### For Local Testing:

1. Create a `.env` file in the project root:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.zihmxkuwkyqcwqrjbgoo.supabase.co:5432/postgres
   DATABASE_SSL=true
   ```

## Step 5: Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Deploy: `vercel --prod`

After deployment, you'll get a URL like `https://your-project.vercel.app`

## Step 6: Update Frontend Config

Create a `config.js` file in the root directory:

```javascript
// Your Vercel API URL (replace with your actual Vercel URL)
const API_URL = 'https://your-project.vercel.app/api';
```

## Your Supabase Details

- **Project URL**: https://zihmxkuwkyqcwqrjbgoo.supabase.co
- **Project Reference**: zihmxkuwkyqcwqrjbgoo
- **API Key (anon)**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaG14a3V3a3lxY3dxcmpiZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTYzMDcsImV4cCI6MjA4MTAzMjMwN30.RyR5KRDAfL29rQGJ5V2fl6Dr0FyLJhyPUPeymCN8TV8

## Troubleshooting

- **Connection refused**: Make sure you're using the correct database password
- **SSL required**: Make sure `DATABASE_SSL=true` is set
- **Table doesn't exist**: Make sure you ran the schema.sql in the SQL Editor
- **Permission denied**: Check your RLS policies or use the service role key


