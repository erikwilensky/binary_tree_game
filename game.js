// Binary Tree Node Class
class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

// Binary Tree Class
class BinaryTree {
    constructor() {
        this.root = null;
    }

    // Generate a random binary tree based on difficulty
    generateTree(difficulty) {
        const nodeCounts = {
            easy: { min: 3, max: 5 },
            medium: { min: 6, max: 9 },
            hard: { min: 10, max: 15 },
            expert: { min: 15, max: 20 }
        };

        const config = nodeCounts[difficulty] || nodeCounts.medium;
        const nodeCount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        
        // Generate unique values (using numbers for simplicity)
        const values = this.generateUniqueValues(nodeCount);
        this.root = this.buildTree(values, 0, values.length - 1);
        
        return this.root;
    }

    // Generate unique sorted values
    generateUniqueValues(count) {
        const values = [];
        const used = new Set();
        
        while (values.length < count) {
            const value = Math.floor(Math.random() * 99) + 1;
            if (!used.has(value)) {
                used.add(value);
                values.push(value);
            }
        }
        
        return values.sort((a, b) => a - b);
    }

    // Build a balanced binary search tree from sorted array
    buildTree(values, start, end) {
        if (start > end) return null;
        
        const mid = Math.floor((start + end) / 2);
        const node = new TreeNode(values[mid]);
        
        node.left = this.buildTree(values, start, mid - 1);
        node.right = this.buildTree(values, mid + 1, end);
        
        return node;
    }

    // In-order traversal: Left, Root, Right
    inOrderTraversal(node = this.root, result = []) {
        if (node === null) return result;
        this.inOrderTraversal(node.left, result);
        result.push(node.value);
        this.inOrderTraversal(node.right, result);
        return result;
    }

    // Pre-order traversal: Root, Left, Right
    preOrderTraversal(node = this.root, result = []) {
        if (node === null) return result;
        result.push(node.value);
        this.preOrderTraversal(node.left, result);
        this.preOrderTraversal(node.right, result);
        return result;
    }

    // Post-order traversal: Left, Right, Root
    postOrderTraversal(node = this.root, result = []) {
        if (node === null) return result;
        this.postOrderTraversal(node.left, result);
        this.postOrderTraversal(node.right, result);
        result.push(node.value);
        return result;
    }

    // Get the correct traversal based on type
    getTraversal(type) {
        switch (type) {
            case 'inorder':
                return this.inOrderTraversal();
            case 'preorder':
                return this.preOrderTraversal();
            case 'postorder':
                return this.postOrderTraversal();
            default:
                return this.inOrderTraversal();
        }
    }

    // Calculate tree height for visualization
    getHeight(node = this.root) {
        if (node === null) return 0;
        return 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    }

    // Get all nodes for visualization
    getAllNodes(node = this.root, result = []) {
        if (node === null) return result;
        result.push(node);
        this.getAllNodes(node.left, result);
        this.getAllNodes(node.right, result);
        return result;
    }

    // Calculate depth of each node (distance from root)
    getNodeDepths(node = this.root, depth = 0, depths = new Map()) {
        if (node === null) return depths;
        depths.set(node, depth);
        this.getNodeDepths(node.left, depth + 1, depths);
        this.getNodeDepths(node.right, depth + 1, depths);
        return depths;
    }
}

// Game State Manager
class GameState {
    constructor() {
        this.tree = null;
        this.traversalType = 'inorder';
        this.difficulty = 'medium';
        this.correctAnswer = [];
        this.userAnswer = [];
        this.timer = null;
        this.timeRemaining = 0;
        this.initialTime = 0;
        this.isGameActive = false;
        this.correctCount = 0;
        this.totalCount = 0;
    }

    startNewGame(traversalType, difficulty) {
        this.traversalType = traversalType;
        this.difficulty = difficulty;
        this.tree = new BinaryTree();
        this.tree.generateTree(difficulty);
        this.correctAnswer = this.tree.getTraversal(traversalType);
        this.userAnswer = [];
        this.isGameActive = true;
        
        // Set timer based on difficulty
        const timers = {
            easy: 60,
            medium: 45,
            hard: 30,
            expert: 20
        };
        this.initialTime = timers[difficulty] || 45;
        this.timeRemaining = this.initialTime;
        
        return {
            tree: this.tree,
            correctAnswer: this.correctAnswer,
            timeRemaining: this.timeRemaining
        };
    }

    addToAnswer(value) {
        if (!this.isGameActive) return false;
        if (this.userAnswer.includes(value)) return false;
        this.userAnswer.push(value);
        return true;
    }

    removeFromAnswer(value) {
        const index = this.userAnswer.indexOf(value);
        if (index > -1) {
            this.userAnswer.splice(index, 1);
            return true;
        }
        return false;
    }

    checkAnswer() {
        if (!this.isGameActive) return null;
        
        this.totalCount++;
        const isCorrect = this.arraysEqual(this.userAnswer, this.correctAnswer);
        
        if (isCorrect) {
            this.correctCount++;
        }
        
        this.isGameActive = false;
        
        // Calculate time taken
        const timeTaken = this.initialTime - this.timeRemaining;
        
        return {
            correct: isCorrect,
            userAnswer: [...this.userAnswer],
            correctAnswer: [...this.correctAnswer],
            timeRemaining: this.timeRemaining,
            timeTaken: timeTaken
        };
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, idx) => val === arr2[idx]);
    }

    resetAnswer() {
        this.userAnswer = [];
    }

    updateTimer(seconds) {
        this.timeRemaining = seconds;
    }

    getScore() {
        return {
            correct: this.correctCount,
            total: this.totalCount
        };
    }
}

// High Score Manager
class HighScoreManager {
    constructor() {
        this.storageKey = 'binaryTreeHighScores';
    }

    getHighScores() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
    }

    saveHighScores(scores) {
        localStorage.setItem(this.storageKey, JSON.stringify(scores));
    }

    getHighScore(difficulty, traversalType) {
        const scores = this.getHighScores();
        const key = `${difficulty}_${traversalType}`;
        return scores[key] || null;
    }

    setHighScore(difficulty, traversalType, initials, timeTaken) {
        const scores = this.getHighScores();
        const key = `${difficulty}_${traversalType}`;
        const currentHigh = scores[key];
        
        // Lower time taken = better score
        if (!currentHigh || timeTaken < currentHigh.time) {
            scores[key] = {
                initials: initials.toUpperCase().substring(0, 2),
                time: timeTaken,
                date: new Date().toISOString()
            };
            this.saveHighScores(scores);
            return true;
        }
        return false;
    }

    getAllHighScores() {
        return this.getHighScores();
    }
}

// Statistics Manager
class StatsManager {
    constructor() {
        this.storageKey = 'binaryTreeStats';
    }

    getStats() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : { games: [], players: new Set() };
    }

    saveStats(stats) {
        // Convert Set to Array for JSON storage
        const statsToSave = {
            games: stats.games,
            players: Array.from(stats.players)
        };
        localStorage.setItem(this.storageKey, JSON.stringify(statsToSave));
    }

    recordGame(initials = null) {
        const stats = this.getStats();
        
        // Restore Set from Array
        if (!(stats.players instanceof Set)) {
            stats.players = new Set(stats.players || []);
        }
        
        const gameRecord = {
            timestamp: new Date().toISOString(),
            initials: initials || 'ANON'
        };
        
        stats.games.push(gameRecord);
        
        if (initials) {
            stats.players.add(initials.toUpperCase());
        }
        
        this.saveStats(stats);
    }

    getGamesToday() {
        const stats = this.getStats();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return stats.games.filter(game => {
            const gameDate = new Date(game.timestamp);
            gameDate.setHours(0, 0, 0, 0);
            return gameDate.getTime() === today.getTime();
        }).length;
    }

    getGamesThisWeek() {
        const stats = this.getStats();
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        return stats.games.filter(game => {
            const gameDate = new Date(game.timestamp);
            return gameDate >= weekAgo;
        }).length;
    }

    getUniquePlayers() {
        const stats = this.getStats();
        if (!(stats.players instanceof Set)) {
            stats.players = new Set(stats.players || []);
        }
        return stats.players.size;
    }

    getTotalGames() {
        const stats = this.getStats();
        return stats.games.length;
    }

    getAllStats() {
        return {
            today: this.getGamesToday(),
            week: this.getGamesThisWeek(),
            uniquePlayers: this.getUniquePlayers(),
            total: this.getTotalGames()
        };
    }
}

// Create global game state instance
const gameState = new GameState();
const highScoreManager = new HighScoreManager();
const statsManager = new StatsManager();

