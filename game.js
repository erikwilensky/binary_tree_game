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

// High Score Manager - Uses GitHub Gist for shared storage
class HighScoreManager {
    constructor() {
        this.gistId = 'd7d2b1f53b815c55770761c18fdfd534';
        this.filename = 'gistfile1.txt';
        this.scores = {};
    }

    async loadScores() {
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`);
            if (response.ok) {
                const gist = await response.json();
                const content = gist.files[this.filename]?.content || '{}';
                this.scores = JSON.parse(content);
                localStorage.setItem('binaryTreeHighScores', JSON.stringify(this.scores));
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem('binaryTreeHighScores');
                this.scores = stored ? JSON.parse(stored) : {};
            }
        } catch (error) {
            console.error('Failed to load scores:', error);
            const stored = localStorage.getItem('binaryTreeHighScores');
            this.scores = stored ? JSON.parse(stored) : {};
        }
    }

    async saveScores(scores) {
        this.scores = scores;
        localStorage.setItem('binaryTreeHighScores', JSON.stringify(scores));
        
        // Try to save to Gist via serverless function
        // Update this URL after deploying to Vercel/Netlify
        // For now, using direct save (see saveToGistDirect function below)
        const serverlessUrl = 'https://your-function.vercel.app/api/save-scores';
        
        // Also try direct save (for testing - remove in production)
        await this.saveToGistDirect(scores);
        
        // Try serverless function as backup
        try {
            const response = await fetch(serverlessUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scores: scores,
                    gistId: this.gistId,
                    filename: this.filename
                })
            });
            
            if (response.ok) {
                console.log('Successfully saved to Gist via serverless function!');
            }
        } catch (error) {
            // Serverless function not set up yet - that's okay
            console.log('Serverless function not available, using direct save');
        }
    }

    async saveToGistDirect(scores) {
        // Direct save using GitHub API (requires token)
        // NOTE: Token should be set via environment variable or serverless function
        // For now, this function is disabled - use the serverless function instead
        return false;
        
        // Uncomment and set your token here if needed (NOT RECOMMENDED):
        // const token = 'YOUR_TOKEN_HERE';
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'BinaryTreeGame'
                },
                body: JSON.stringify({
                    files: {
                        [this.filename]: {
                            content: JSON.stringify(scores, null, 2)
                        }
                    }
                })
            });
            
            if (response.ok) {
                console.log('Successfully saved to Gist directly!');
                return true;
            } else {
                const error = await response.text();
                console.error('Failed to save to Gist:', error);
                return false;
            }
        } catch (error) {
            console.error('Error saving to Gist:', error);
            return false;
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

