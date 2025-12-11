-- Migration: Add forced_theme column to teams table
-- Run this in Supabase SQL Editor

ALTER TABLE teams ADD COLUMN IF NOT EXISTS forced_theme TEXT;

-- Add comment for documentation
COMMENT ON COLUMN teams.forced_theme IS 'Theme forced on this team by a powerup (e.g., "hardtoread")';

