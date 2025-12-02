# Binary Tree Traversal Game

An interactive educational game for practicing binary tree traversals (in-order, pre-order, and post-order) with drag-and-drop mechanics.

## Features

- **Three Traversal Types**: Practice in-order, pre-order, and post-order traversals
- **Four Difficulty Levels**:
  - Easy: 3-5 nodes, 60 seconds
  - Medium: 6-9 nodes, 45 seconds
  - Hard: 10-15 nodes, 30 seconds
  - Expert: 15+ nodes, 20 seconds
- **Visual Tree Display**: See the binary tree structure clearly
- **Drag-and-Drop Interface**: Intuitive node arrangement
- **Timer System**: Countdown timer with visual warnings
- **Score Tracking**: Track your correct answers and total attempts

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

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- SVG rendering
- HTML5 Drag and Drop API

## License

Free to use for educational purposes.

