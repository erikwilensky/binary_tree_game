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

// High Score Manager - Uses Supabase REST API directly
class HighScoreManager {
    constructor() {
        // Get Supabase config from config.js or use defaults
        this.supabaseUrl = (typeof config !== 'undefined' && config.SUPABASE_URL) || 
                          window.SUPABASE_URL || 
                          'https://zihmxkuwkyqcwqrjbgoo.supabase.co';
        this.supabaseKey = (typeof config !== 'undefined' && config.SUPABASE_KEY) || 
                          window.SUPABASE_KEY || 
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaG14a3V3a3lxY3dxcmpiZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTYzMDcsImV4cCI6MjA4MTAzMjMwN30.RyR5KRDAfL29rQGJ5V2fl6Dr0FyLJhyPUPeymCN8TV8';
        this.scores = {};
    }

    async loadScores() {
        try {
            const url = `${this.supabaseUrl}/rest/v1/high_scores?select=*`;
            const response = await fetch(url, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                // Convert array to object format
                this.scores = {};
                data.forEach(row => {
                    const key = `${row.difficulty}_${row.traversal_type}`;
                    this.scores[key] = {
                        initials: row.initials,
                        time: row.time_taken,
                        date: row.created_at
                    };
                });
                localStorage.setItem('binaryTreeHighScores', JSON.stringify(this.scores));
                console.log('Loaded scores from Supabase');
            } else {
                // Fallback to localStorage
                const errorText = await response.text();
                console.warn(`Cannot load from Supabase (${response.status}):`, errorText);
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

    async getHighScores() {
        if (Object.keys(this.scores).length === 0) {
            await this.loadScores();
        }
        return this.scores;
    }

    async getHighScore(difficulty, traversalType) {
        try {
            const url = `${this.supabaseUrl}/rest/v1/high_scores?difficulty=eq.${difficulty}&traversal_type=eq.${traversalType}&select=*&limit=1`;
            const response = await fetch(url, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.length === 0) {
                    return null;
                }
                const row = data[0];
                return {
                    initials: row.initials,
                    time: row.time_taken,
                    date: row.created_at
                };
            } else {
                // Fallback to local scores
                const scores = await this.getHighScores();
                const key = `${difficulty}_${traversalType}`;
                const score = scores[key];
                if (!score || !score.initials || score.time === undefined) {
                    return null;
                }
                return score;
            }
        } catch (error) {
            console.error('Failed to get high score:', error);
            // Fallback to local scores
            const scores = await this.getHighScores();
            const key = `${difficulty}_${traversalType}`;
            const score = scores[key];
            if (!score || !score.initials || score.time === undefined) {
                return null;
            }
            return score;
        }
    }

    async setHighScore(difficulty, traversalType, initials, timeTaken) {
        try {
            // First check if a record exists
            const existing = await this.getHighScore(difficulty, traversalType);
            const isNewHighScore = !existing || timeTaken < existing.time;
            
            if (isNewHighScore) {
                const url = `${this.supabaseUrl}/rest/v1/high_scores`;
                const method = existing ? 'PATCH' : 'POST';
                const filter = existing ? `?difficulty=eq.${difficulty}&traversal_type=eq.${traversalType}` : '';
                
                const body = {
                    difficulty: difficulty,
                    traversal_type: traversalType,
                    initials: initials.toUpperCase().substring(0, 10),
                    time_taken: timeTaken
                };
                
                const response = await fetch(`${url}${filter}`, {
                    method: method,
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(body)
                });
                
                if (response.ok) {
                    // Update local cache
                    const key = `${difficulty}_${traversalType}`;
                    this.scores[key] = {
                        initials: initials.toUpperCase().substring(0, 10),
                        time: timeTaken,
                        date: new Date().toISOString()
                    };
                    localStorage.setItem('binaryTreeHighScores', JSON.stringify(this.scores));
                    return true;
                } else {
                    const errorText = await response.text();
                    console.error('Failed to save high score:', response.status, errorText);
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('Error saving high score:', error);
            return false;
        }
    }

    async getAllHighScores() {
        return await this.getHighScores();
    }
}

// Create global game state instance
const gameState = new GameState();
const highScoreManager = new HighScoreManager();

