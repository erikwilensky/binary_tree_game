# Classroom Answer Race Game

A realtime, multi-device classroom game where teams answer timed questions, lock answers, trigger time reductions, and use powerups. Built as a client-only static application using Supabase REST API.

## Features

- **Realtime Multi-Device Sync**: All teams see updates in real-time via polling
- **Timed Questions**: Admin broadcasts questions with time limits
- **Answer Locking**: Teams can lock answers, reducing other teams' time by 1/3
- **Powerups**: 
  - Random Characters: Inject random chars into target team's answer
  - Score Bash: Reduce target team's score by 10%
  - Roll the Dice: 50% chance +20% score, 50% chance -10% score
- **Admin Dashboard**: Create sessions, broadcast questions, view answers, adjust scores
- **Offline Support**: Falls back to localStorage if Supabase is unavailable

## Setup

1. **Run Database Schema**: Execute `database/classroom-game-schema.sql` in Supabase SQL Editor

2. **Configure Supabase**: The app uses the same Supabase credentials from `config.js` (or defaults)

3. **Open Pages**:
   - `classroom-lobby.html` - Join or create sessions
   - `classroom-game.html` - Student game view
   - `classroom-admin.html` - Admin dashboard

## How to Use

### For Students:
1. Go to `classroom-lobby.html`
2. Enter session code and team name
3. Click "Join Game"
4. Wait for admin to start a question
5. Type answer, use powerups, lock when ready

### For Admin:
1. Go to `classroom-lobby.html`
2. Click "Create New Session"
3. Share the session code with students
4. Go to admin dashboard
5. Enter question text and time limit
6. Click "Start Question"
7. View answers, adjust scores, end question early

## Architecture

- **Client-Only**: No server or serverless functions needed
- **Supabase REST API**: All data operations via `/rest/v1/` endpoints
- **Polling**: 2-second intervals for realtime updates (Supabase Realtime can be added later)
- **localStorage**: Offline fallback for critical state

## Files Structure

```
classroom-lobby.html       # Lobby page
classroom-game.html        # Student game page
classroom-admin.html       # Admin dashboard
classroom-styles.css       # Styling
js/classroom/
  ├── supabase.js         # Supabase REST API wrapper
  ├── api.js              # CRUD helpers
  ├── state.js            # State management
  ├── timer.js            # Timer logic
  ├── powerups.js         # Powerup engine
  ├── realtime.js         # Polling/realtime manager
  ├── ui.js               # UI utilities
  ├── lobby.js            # Lobby controller
  ├── game.js             # Game controller
  └── admin.js            # Admin controller
database/
  └── classroom-game-schema.sql  # Database schema
```

## Database Tables

- `game_sessions` - Session tracking
- `teams` - Team data with scores and powerups
- `questions` - Admin-broadcast questions
- `quiz_answers` - Team responses
- `powerup_events` - Powerup usage tracking

## Deployment

Deploy to GitHub Pages as static files. No build step required.

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- Fetch API
- localStorage
- CSS Grid and Flexbox


