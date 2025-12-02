# Complete Setup Instructions for Shared High Scores

## Overview
The game uses a GitHub Gist to store and share high scores across all players. There are two ways to set this up:

1. **Quick Setup (Works Immediately)** - Direct save using token (less secure, but works right away)
2. **Production Setup (Recommended)** - Serverless function (more secure, proper setup)

---

## Option 1: Quick Setup (Works Immediately) ✅

This is already configured in the code. The game will write directly to your Gist using the token.

### What's Already Done:
- ✅ Gist ID is set: `d7d2b1f53b815c55770761c18fdfd534`
- ✅ Token is configured in `game.js`
- ✅ Direct save function is implemented

### Steps:
1. **Create the Gist file** (if not already done):
   - Go to: https://gist.github.com/erikwilensky/d7d2b1f53b815c55770761c18fdfd534
   - Click "Edit" (pencil icon)
   - Make sure there's a file named `highscores.json`
   - Content should be: `{}` (empty JSON object)
   - Click "Update public gist"

2. **Test the game**:
   - Open your game: https://erikwilensky.github.io/binary_tree_game/
   - Play a game and get a correct answer
   - Enter your initials when the modal appears
   - Check your Gist to see if the score was saved

3. **Verify it's working**:
   - Go to: https://gist.github.com/erikwilensky/d7d2b1f53b815c55770761c18fdfd534
   - You should see the `highscores.json` file with your score

### Security Warning ⚠️
The token is currently in the client-side code, which means anyone can see it. For production:
- This is okay for a classroom/educational game
- If you want better security, use Option 2 below

---

## Option 2: Production Setup (Recommended for Long-term) 🔒

This uses a serverless function to keep the token secure.

### Step 1: Deploy to Vercel (Free)

1. **Go to Vercel**:
   - Visit: https://vercel.com
   - Sign up or log in with your GitHub account

2. **Create New Project**:
   - Click "Add New..." → "Project"
   - Import your `binary_tree_game` repository
   - Click "Import"

3. **Configure Project**:
   - Framework Preset: "Other" (or leave default)
   - Root Directory: `./` (default)
   - Build Command: Leave empty (static site)
   - Output Directory: Leave empty

4. **Add Environment Variable**:
   - Scroll down to "Environment Variables"
   - Click "Add New"
   - Name: `GITHUB_TOKEN`
   - Value: `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`
   - Click "Add"

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete (about 1-2 minutes)
   - Copy your deployment URL (e.g., `https://binary-tree-game.vercel.app`)

### Step 2: Update game.js

1. **Open `game.js`** in your editor

2. **Find line 258** (or search for `serverlessUrl`)

3. **Replace the URL**:
   ```javascript
   // Change this:
   const serverlessUrl = 'https://your-function.vercel.app/api/save-scores';
   
   // To your actual Vercel URL:
   const serverlessUrl = 'https://your-actual-url.vercel.app/api/save-scores';
   ```

4. **Remove the direct save function** (optional, for security):
   - Find the `saveToGistDirect` function (around line 280)
   - Comment it out or remove it
   - In `saveScores`, remove the line: `await this.saveToGistDirect(scores);`

5. **Save and push to GitHub**:
   ```bash
   git add game.js
   git commit -m "Update serverless function URL"
   git push origin main
   ```

### Step 3: Test

1. Wait for GitHub Pages to update (1-2 minutes)
2. Play the game and get a correct answer
3. Enter your initials
4. Check your Gist to verify the score was saved

---

## Troubleshooting

### High scores not showing up?

1. **Check browser console** (F12 → Console tab):
   - Look for any error messages
   - Should see "Successfully saved to Gist!" message

2. **Verify Gist exists**:
   - Go to: https://gist.github.com/erikwilensky/d7d2b1f53b815c55770761c18fdfd534
   - Make sure the file `highscores.json` exists

3. **Check token permissions**:
   - Go to: https://github.com/settings/tokens
   - Make sure your token has the `gist` scope checked

4. **Verify Gist ID in code**:
   - Open `game.js`
   - Check line 227: `this.gistId = 'd7d2b1f53b815c55770761c18fdfd534';`
   - Make sure it matches your Gist ID

### Modal not appearing?

1. **Check if you got a correct answer**:
   - The modal only appears on correct answers
   - Try an easy difficulty to test

2. **Check browser console**:
   - Look for JavaScript errors
   - Make sure all files are loading correctly

3. **Verify CSS is loaded**:
   - Check if `styles.css` is loading
   - The modal should be visible when not hidden

### Serverless function not working?

1. **Check Vercel deployment**:
   - Go to your Vercel dashboard
   - Check the "Functions" tab
   - Look for any errors

2. **Verify environment variable**:
   - In Vercel dashboard → Settings → Environment Variables
   - Make sure `GITHUB_TOKEN` is set correctly

3. **Test the function directly**:
   - Go to: `https://your-url.vercel.app/api/save-scores`
   - Should see an error (that's normal - it needs POST data)
   - If you see 405 Method Not Allowed, the function is working

---

## File Structure

```
binary_tree_game/
├── index.html          # Main game page
├── styles.css          # Game styling
├── game.js             # Game logic and high score manager
├── ui.js               # User interface
├── api/
│   └── save-scores.js  # Serverless function (for Vercel/Netlify)
├── vercel.json         # Vercel configuration
└── README.md           # Game documentation
```

---

## Current Configuration

- **Gist ID**: `d7d2b1f53b815c55770761c18fdfd534`
- **Gist File**: `highscores.json`
- **Token**: Configured in code (Option 1) or Vercel env var (Option 2)

---

## Next Steps

1. ✅ Test the game and verify high scores are saving
2. ✅ Check that all students can see the same high scores
3. ⚠️ For production, consider moving to Option 2 (serverless function)
4. 📝 Update the Gist URL in your game if you move it

---

## Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Verify the Gist is public and accessible
3. Make sure the token has the correct permissions
4. Test the serverless function URL directly

