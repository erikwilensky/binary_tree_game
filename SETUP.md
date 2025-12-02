# Setup Instructions for Shared High Scores

## Quick Setup (5 minutes)

### Step 1: Deploy Serverless Function to Vercel

1. Go to https://vercel.com and sign up/login with GitHub
2. Click "New Project"
3. Import your `binary_tree_game` repository
4. In "Environment Variables", add:
   - Name: `GITHUB_TOKEN`
   - Value: `YOUR_GITHUB_TOKEN_HERE` (use your actual token)
5. Click "Deploy"

### Step 2: Update game.js

After deployment, Vercel will give you a URL like `https://your-project.vercel.app`

Update line 258 in `game.js`:
```javascript
const serverlessUrl = 'https://your-project.vercel.app/api/save-scores';
```

Replace `your-project.vercel.app` with your actual Vercel URL.

### Step 3: Test

1. Play the game and get a correct answer
2. Enter your initials
3. Check your Gist at: https://gist.github.com/erikwilensky/d7d2b1f53b815c55770761c18fdfd534
4. The high score should appear in the `highscores.json` file

## Alternative: Use Netlify Functions

If you prefer Netlify:

1. Create a `netlify.toml` file:
```toml
[build]
  functions = "api"
```

2. Deploy to Netlify and set the `GITHUB_TOKEN` environment variable
3. Update the URL in `game.js` to point to your Netlify function

## Security Note

The token is currently hardcoded in the serverless function for convenience. For production, you should:
1. Remove the hardcoded token from `api/save-scores.js`
2. Only use the environment variable
3. Never commit tokens to Git

