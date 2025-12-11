-- Binary Tree Game Database Schema
-- Use this with a cloud database service like Supabase, Railway, or PlanetScale
-- PostgreSQL compatible

-- High Scores Table
CREATE TABLE IF NOT EXISTS high_scores (
    id SERIAL PRIMARY KEY,
    difficulty VARCHAR(20) NOT NULL,
    traversal_type VARCHAR(20) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    time_taken INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(difficulty, traversal_type)
);

-- Quiz Answers Table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    answer TEXT NOT NULL,
    locked BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_name)
);

-- Game Sessions Table (for tracking game attempts and analytics)
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20),
    traversal_type VARCHAR(20),
    correct BOOLEAN DEFAULT FALSE,
    time_taken INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_high_scores_difficulty_traversal ON high_scores(difficulty, traversal_type);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_team_name ON quiz_answers(team_name);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);
