-- Complete Database Setup for Binary Tree Game
-- Paste this entire file into Supabase SQL Editor and run it

-- High Scores Table
CREATE TABLE IF NOT EXISTS high_scores (
    id BIGSERIAL PRIMARY KEY,
    difficulty VARCHAR(20) NOT NULL,
    traversal_type VARCHAR(20) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    time_taken INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(difficulty, traversal_type)
);

-- Quiz Answers Table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id BIGSERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    answer TEXT NOT NULL,
    locked BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_name)
);

-- Game Sessions Table (for tracking game attempts and analytics)
CREATE TABLE IF NOT EXISTS game_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20),
    traversal_type VARCHAR(20),
    correct BOOLEAN DEFAULT FALSE,
    time_taken INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_high_scores_difficulty_traversal ON high_scores(difficulty, traversal_type);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_team_name ON quiz_answers(team_name);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);

-- Grant necessary permissions
GRANT ALL ON high_scores TO postgres;
GRANT ALL ON quiz_answers TO postgres;
GRANT ALL ON game_sessions TO postgres;

-- Grant usage on sequences (for auto-increment)
GRANT USAGE, SELECT ON SEQUENCE high_scores_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE quiz_answers_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE game_sessions_id_seq TO postgres;

-- Enable Row Level Security
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow public read on high_scores" ON high_scores;
DROP POLICY IF EXISTS "Allow public read on quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public insert on high_scores" ON high_scores;
DROP POLICY IF EXISTS "Allow public update on high_scores" ON high_scores;
DROP POLICY IF EXISTS "Allow public insert on quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public update on quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public delete on quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public insert on game_sessions" ON game_sessions;

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

-- Success message (won't show in Supabase, but helps when reading this file)
-- ✅ Database setup complete! Your game is ready to use.

