-- Classroom Answer Race Game Database Schema
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS powerup_events CASCADE;
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;

-- Game Sessions Table
CREATE TABLE game_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_code TEXT UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    question_count INTEGER DEFAULT 0,
    team_count INTEGER DEFAULT 0
);

-- Teams Table
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES game_sessions(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    powerups JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (session_id, team_name)
);

-- Questions Table
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES game_sessions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    time_limit_seconds INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false
);

-- Quiz Answers Table
CREATE TABLE quiz_answers (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    answer TEXT DEFAULT '',
    locked BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Powerup Events Table
CREATE TABLE powerup_events (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES game_sessions(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    target_team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    powerup_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_teams_session_id ON teams(session_id);
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_team_id ON quiz_answers(team_id);
CREATE INDEX idx_powerup_events_session_id ON powerup_events(session_id);
CREATE INDEX idx_powerup_events_team_id ON powerup_events(team_id);
CREATE INDEX idx_game_sessions_session_code ON game_sessions(session_code);

-- Grant necessary permissions
GRANT ALL ON game_sessions TO postgres;
GRANT ALL ON teams TO postgres;
GRANT ALL ON questions TO postgres;
GRANT ALL ON quiz_answers TO postgres;
GRANT ALL ON powerup_events TO postgres;

-- Grant usage on sequences (for auto-increment)
GRANT USAGE, SELECT ON SEQUENCE game_sessions_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE teams_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE questions_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE quiz_answers_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE powerup_events_id_seq TO postgres;

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE powerup_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow public read on game_sessions" ON game_sessions;
DROP POLICY IF EXISTS "Allow public write on game_sessions" ON game_sessions;
DROP POLICY IF EXISTS "Allow public read on teams" ON teams;
DROP POLICY IF EXISTS "Allow public write on teams" ON teams;
DROP POLICY IF EXISTS "Allow public read on questions" ON questions;
DROP POLICY IF EXISTS "Allow public write on questions" ON questions;
DROP POLICY IF EXISTS "Allow public read on quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public write on quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public read on powerup_events" ON powerup_events;
DROP POLICY IF EXISTS "Allow public write on powerup_events" ON powerup_events;

-- RLS Policies: Allow public read/write for all gameplay tables
-- Game Sessions
CREATE POLICY "Allow public read on game_sessions" 
ON game_sessions FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on game_sessions" 
ON game_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on game_sessions" 
ON game_sessions FOR UPDATE 
USING (true);

-- Teams
CREATE POLICY "Allow public read on teams" 
ON teams FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on teams" 
ON teams FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on teams" 
ON teams FOR UPDATE 
USING (true);

-- Questions
CREATE POLICY "Allow public read on questions" 
ON questions FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on questions" 
ON questions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on questions" 
ON questions FOR UPDATE 
USING (true);

-- Quiz Answers
CREATE POLICY "Allow public read on quiz_answers" 
ON quiz_answers FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on quiz_answers" 
ON quiz_answers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on quiz_answers" 
ON quiz_answers FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on quiz_answers" 
ON quiz_answers FOR DELETE 
USING (true);

-- Powerup Events
CREATE POLICY "Allow public read on powerup_events" 
ON powerup_events FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on powerup_events" 
ON powerup_events FOR INSERT 
WITH CHECK (true);

-- Success message
-- ✅ Database schema complete! Run this in Supabase SQL Editor.

