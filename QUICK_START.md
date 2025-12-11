# Quick Start Guide

✅ **Database is set up!** Your game is ready to use.

## What's Already Configured

- ✅ Database tables created (`high_scores`, `quiz_answers`, `game_sessions`)
- ✅ Row Level Security (RLS) policies configured
- ✅ Frontend code updated to use Supabase REST API
- ✅ Your Supabase credentials are already in the code as defaults

## Test It Out

1. **Open the game** in your browser (`index.html`)
2. **Play a game** - select a traversal type and difficulty
3. **Set a high score** - when you complete a game, enter your initials
4. **Check Supabase** - Go to your Supabase dashboard → Table Editor → `high_scores` to see your score!

## How It Works

- **High Scores**: Automatically saved to Supabase when you beat a record
- **Quiz Answers**: Saved to Supabase when teams submit answers
- **Offline Support**: Falls back to localStorage if Supabase is unavailable

## Verify Database Connection

Open your browser's Developer Console (F12) and look for:
- ✅ "Loaded scores from Supabase" - means connection is working!
- ⚠️ "Cannot load from Supabase" - check your RLS policies

## Troubleshooting

**If scores aren't saving:**
1. Check browser console for errors
2. Verify RLS policies are set up (run the RLS section of `database/complete-setup.sql` again)
3. Check Supabase dashboard → Table Editor to see if tables exist

**If you see CORS errors:**
- Make sure you're accessing the game via `http://localhost` or a web server, not `file://`

## Next Steps

- The game works immediately - no additional configuration needed!
- Optional: Create a `config.js` file if you want to override the default Supabase settings
- Optional: Deploy to GitHub Pages for public access

Enjoy your game! 🎮


