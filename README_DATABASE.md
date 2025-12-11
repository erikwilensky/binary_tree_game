# Database Migration Guide

This project has been migrated from JSONBin.io to a proper PostgreSQL database with Vercel serverless functions.

## What Changed

- **High Scores**: Now stored in PostgreSQL database via `/api/high-scores`
- **Quiz Answers**: Now stored in PostgreSQL database via `/api/quiz-answers`
- **Game Sessions**: New analytics tracking via `/api/game-sessions`

## Quick Setup

1. **Set up a PostgreSQL database** (see `DATABASE_SETUP.md`)
2. **Run the schema**: Execute `database/schema.sql` in your database
3. **Deploy to Vercel**: 
   ```bash
   npm install
   vercel deploy
   ```
4. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `DATABASE_SSL`: `true` or `false`
5. **Update frontend config**: Create `config.js` with your Vercel API URL:
   ```javascript
   const API_URL = 'https://your-project.vercel.app/api';
   ```

## API Endpoints

### High Scores
- `GET /api/high-scores` - Get all high scores
- `GET /api/high-scores?difficulty=medium&traversalType=inorder` - Get specific high score
- `POST /api/high-scores` - Save/update high score

### Quiz Answers
- `GET /api/quiz-answers` - Get all quiz answers
- `POST /api/quiz-answers` - Save/update quiz answer
- `DELETE /api/quiz-answers?teamName=Team1` - Delete quiz answer

### Game Sessions
- `POST /api/game-sessions` - Log a game session
- `GET /api/game-sessions?limit=100` - Get recent sessions

## Frontend Changes

The frontend automatically falls back to localStorage if the API is unavailable, ensuring the game still works offline.

## Migration from JSONBin

If you have existing data in JSONBin:
1. Export your data from JSONBin
2. Use the database migration script (if needed) or manually insert into the new database
3. The new system will start fresh if you don't migrate

