# Supabase REST API Setup (Simplified!)

This setup uses Supabase's REST API directly from the frontend - **no serverless functions needed!**

## Step 1: Run the Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/zihmxkuwkyqcwqrjbgoo
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the entire contents of `database/supabase-schema.sql`
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Successfully created" messages

## Step 2: Configure Row Level Security (RLS)

Since we're using the anon key from the frontend, we need to allow public access. Run this in SQL Editor:

```sql
-- Enable RLS
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on high_scores" 
ON high_scores FOR SELECT 
USING (true);

CREATE POLICY "Allow public read on quiz_answers" 
ON quiz_answers FOR SELECT 
USING (true);

-- Allow public insert/update on high_scores (for saving scores)
CREATE POLICY "Allow public insert on high_scores" 
ON high_scores FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on high_scores" 
ON high_scores FOR UPDATE 
USING (true);

-- Allow public insert/update/delete on quiz_answers
CREATE POLICY "Allow public insert on quiz_answers" 
ON quiz_answers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on quiz_answers" 
ON quiz_answers FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on quiz_answers" 
ON quiz_answers FOR DELETE 
USING (true);

-- Allow public insert on game_sessions (for analytics)
CREATE POLICY "Allow public insert on game_sessions" 
ON game_sessions FOR INSERT 
WITH CHECK (true);
```

## Step 3: Update Frontend Config (Optional)

The code already has your Supabase credentials as defaults, but you can override them by creating a `config.js` file:

```javascript
const SUPABASE_URL = 'https://zihmxkuwkyqcwqrjbgoo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaG14a3V3a3lxY3dxcmpiZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTYzMDcsImV4cCI6MjA4MTAzMjMwN30.RyR5KRDAfL29rQGJ5V2fl6Dr0FyLJhyPUPeymCN8TV8';
```

## That's It!

No Vercel deployment needed! The frontend talks directly to Supabase REST API.

## How It Works

- **High Scores**: Stored in `high_scores` table, accessed via `/rest/v1/high_scores`
- **Quiz Answers**: Stored in `quiz_answers` table, accessed via `/rest/v1/quiz_answers`
- **Game Sessions**: Stored in `game_sessions` table (for future analytics)

All operations use Supabase's REST API with your anon key. The code automatically falls back to localStorage if Supabase is unavailable.

## Security Note

The anon key is safe to use in the frontend because:
1. RLS policies control what users can access
2. The policies we created allow public read/write (which is fine for a game)
3. If you need more security later, you can tighten the RLS policies

## Testing

1. Open the game in your browser
2. Play a game and set a high score
3. Check Supabase dashboard → Table Editor → `high_scores` to see your score!


