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
            medium: 90,
            hard: 120,
            expert: 150
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

// High Score Manager - Uses JSONBin.io for shared storage (free, no auth needed)
class HighScoreManager {
    constructor() {
        // Replace with your JSONBin.io bin ID after creating one
        // Go to https://jsonbin.io, create a free account, create a bin, copy the bin ID
        this.binId = 'YOUR_BIN_ID_HERE';
        this.apiKey = '$2b$10$YOUR_API_KEY_HERE'; // Optional: for private bins
        this.scores = {};
    }

    async loadScores() {
        try {
            // Load from JSONBin.io (public bin, no auth needed)
            const url = `https://api.jsonbin.io/v3/b/${this.binId}/latest`;
            const headers = {};
            
            // Only add API key if provided (for private bins)
            if (this.apiKey && !this.apiKey.includes('YOUR_API_KEY')) {
                headers['X-Master-Key'] = this.apiKey;
            }
            
            const response = await fetch(url, {
                headers: headers,
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.scores = data.record || {};
                localStorage.setItem('binaryTreeHighScores', JSON.stringify(this.scores));
                console.log('Loaded scores from JSONBin');
            } else {
                // Fallback to localStorage
                console.warn(`Cannot load from JSONBin (${response.status}). Using localStorage.`);
                const stored = localStorage.getItem('binaryTreeHighScores');
                this.scores = stored ? JSON.parse(stored) : {};
            }
        } catch (error) {
            console.error('Failed to load scores:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('binaryTreeHighScores');
            this.scores = stored ? JSON.parse(stored) : {};
        }
    }

    async saveScores(scores) {
        this.scores = scores;
        localStorage.setItem('binaryTreeHighScores', JSON.stringify(scores));
        
        try {
            // Save to JSONBin.io
            const url = `https://api.jsonbin.io/v3/b/${this.binId}`;
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Only add API key if provided (for private bins)
            if (this.apiKey && !this.apiKey.includes('YOUR_API_KEY')) {
                headers['X-Master-Key'] = this.apiKey;
            } else {
                // For public bins, we can use a simpler approach
                // But JSONBin.io requires auth for writes, so we'll use a public read-only approach
                // and save locally
                console.log('JSONBin API key not configured. Scores saved locally only.');
                console.log('To enable shared storage, set up JSONBin.io and add your bin ID and API key.');
                return;
            }
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(scores)
            });
            
            if (response.ok) {
                console.log('Successfully saved to JSONBin!');
            } else {
                const error = await response.text();
                console.warn('Failed to save to JSONBin:', error);
            }
        } catch (error) {
            console.error('Error saving to JSONBin:', error);
        }
    }

    async getHighScores() {
        if (Object.keys(this.scores).length === 0) {
            await this.loadScores();
        }
        return this.scores;
    }

    async getHighScore(difficulty, traversalType) {
        const scores = await this.getHighScores();
        const key = `${difficulty}_${traversalType}`;
        return scores[key] || null;
    }

    async setHighScore(difficulty, traversalType, initials, timeTaken) {
        const scores = await this.getHighScores();
        const key = `${difficulty}_${traversalType}`;
        const currentHigh = scores[key];
        
        if (!currentHigh || timeTaken < currentHigh.time) {
            scores[key] = {
                initials: initials.toUpperCase().substring(0, 2),
                time: timeTaken,
                date: new Date().toISOString()
            };
            await this.saveScores(scores);
            return true;
        }
        return false;
    }

    async getAllHighScores() {
        return await this.getHighScores();
    }
}

// Create global game state instance
const gameState = new GameState();
const highScoreManager = new HighScoreManager();

