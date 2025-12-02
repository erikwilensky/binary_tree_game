# Binary Tree Traversal Game

An interactive educational game for practicing binary tree traversals (in-order, pre-order, and post-order) with drag-and-drop mechanics.

## Features

- **Three Traversal Types**: Practice in-order, pre-order, and post-order traversals
- **Four Difficulty Levels**:
  - Easy: 3-5 nodes, 60 seconds
  - Medium: 6-9 nodes, 90 seconds
  - Hard: 10-15 nodes, 120 seconds
  - Expert: 15+ nodes, 150 seconds
- **Visual Tree Display**: See the binary tree structure clearly
- **Drag-and-Drop Interface**: Intuitive node arrangement
- **Timer System**: Countdown timer with visual warnings
- **Score Tracking**: Track your correct answers and total attempts
- **Shared High Scores**: High scores are shared across all players via GitHub Gist

## How to Play

1. Select a traversal type (in-order, pre-order, or post-order)
2. Choose a difficulty level
3. Click "New Game" to generate a random binary tree
4. Drag nodes from the "Available Nodes" area into the answer slots in the correct traversal order
5. Click "Check Answer" to verify your solution
6. Use "Reset" to clear your current answer and try again

## Traversal Rules

- **In-Order**: Left subtree → Root → Right subtree
- **Pre-Order**: Root → Left subtree → Right subtree
- **Post-Order**: Left subtree → Right subtree → Root

## Setting Up Shared High Scores

The game uses a GitHub Gist to share high scores across all players. To enable writing to the Gist:

### Option 1: Use a Serverless Function (Recommended)

1. Deploy the `api/save-scores.js` function to Vercel, Netlify, or similar
2. Set `GITHUB_TOKEN` as an environment variable (create a GitHub Personal Access Token with `gist` scope)
3. Update the `serverlessUrl` in `game.js` to point to your deployed function

### Option 2: Manual Setup

1. Create a public GitHub Gist at https://gist.github.com
2. Create a file named `highscores.json` with content: `{}`
3. Copy the Gist ID from the URL
4. Update `gistId` in `game.js` with your Gist ID

**Note**: Without a serverless function, high scores will only be saved locally. The Gist will be read for displaying shared scores, but new scores won't be written to it.

## Hosting on GitHub Pages

1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to repository Settings → Pages
4. Select the branch containing your files (usually `main` or `master`)
5. Select the root folder (`/`)
6. Click Save
7. Your game will be available at `https://[username].github.io/[repository-name]`

## Files

- `index.html` - Main game page structure
- `styles.css` - Game styling and layout
- `game.js` - Binary tree implementation and game logic
- `ui.js` - User interface and drag-and-drop functionality
- `api/save-scores.js` - Serverless function for saving scores to Gist

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- SVG rendering
- HTML5 Drag and Drop API

## License

Free to use for educational purposes.
