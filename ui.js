// UI Controller
class UIController {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.timerInterval = null;
    }

    initializeElements() {
        this.traversalSelect = document.getElementById('traversal-type');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.checkAnswerBtn = document.getElementById('check-answer-btn');
        this.resetAnswerBtn = document.getElementById('reset-answer-btn');
        this.timerDisplay = document.getElementById('timer');
        this.treeVisualization = document.getElementById('tree-visualization');
        this.treeHeightDisplay = document.getElementById('tree-height');
        this.treeDepthDisplay = document.getElementById('tree-depth');
        this.nodePool = document.getElementById('node-pool');
        this.answerSlots = document.getElementById('answer-slots');
        this.feedback = document.getElementById('feedback');
        this.correctCount = document.getElementById('correct-count');
        this.totalCount = document.getElementById('total-count');
        this.highScoresDisplay = document.getElementById('high-scores-display');
        this.highScoreModal = document.getElementById('high-score-modal');
        this.initialsInput = document.getElementById('initials-input');
        this.submitInitialsBtn = document.getElementById('submit-initials-btn');
    }

    initializeEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
        this.resetAnswerBtn.addEventListener('click', () => this.resetAnswer());
        this.submitInitialsBtn.addEventListener('click', () => this.submitInitials());
        this.initialsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitInitials();
            }
        });
        this.initialsInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
        });
    }

    startNewGame() {
        const traversalType = this.traversalSelect.value;
        const difficulty = this.difficultySelect.value;
        
        const gameData = gameState.startNewGame(traversalType, difficulty);
        
        this.renderTree(gameData.tree);
        this.renderNodePool(gameData.correctAnswer);
        this.clearAnswerArea();
        this.hideFeedback();
        this.startTimer(gameData.timeRemaining);
        this.updateScore();
        this.updateHighScoresDisplay();
    }

    renderTree(tree) {
        this.treeVisualization.innerHTML = '';
        
        if (!tree || !tree.root) return;
        
        const height = tree.getHeight();
        const nodeDepths = tree.getNodeDepths();
        
        // Calculate maximum depth
        const maxDepth = Math.max(...Array.from(nodeDepths.values()));
        
        // Display tree height and max depth
        this.treeHeightDisplay.textContent = height - 1; // Height is number of edges from root to deepest leaf
        this.treeDepthDisplay.textContent = maxDepth; // Maximum depth in the tree
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '400');
        svg.setAttribute('class', 'tree-svg');
        
        const nodes = tree.getAllNodes();
        const positions = this.calculateNodePositions(tree.root, height);
        
        // Draw edges first
        this.drawEdges(svg, tree.root, positions);
        
        // Draw nodes
        nodes.forEach(node => {
            const pos = positions.get(node);
            if (pos) {
                this.drawNode(svg, node.value, pos.x, pos.y);
            }
        });
        
        this.treeVisualization.appendChild(svg);
    }

    calculateNodePositions(root, height) {
        const positions = new Map();
        const levelWidth = Math.pow(2, height);
        const nodeWidth = 50;
        const nodeHeight = 50;
        const horizontalSpacing = 80;
        const verticalSpacing = 100;
        
        const traverse = (node, level, position, leftBound, rightBound) => {
            if (!node) return;
            
            const x = leftBound + (rightBound - leftBound) / 2;
            const y = 50 + level * verticalSpacing;
            
            positions.set(node, { x, y });
            
            traverse(node.left, level + 1, position * 2, leftBound, x);
            traverse(node.right, level + 1, position * 2 + 1, x, rightBound);
        };
        
        const svgWidth = this.treeVisualization.offsetWidth || 800;
        traverse(root, 0, 0, 50, svgWidth - 50);
        
        return positions;
    }

    drawEdges(svg, node, positions, parentPos = null) {
        if (!node) return;
        
        const nodePos = positions.get(node);
        if (!nodePos) return;
        
        if (parentPos) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', parentPos.x);
            line.setAttribute('y1', parentPos.y);
            line.setAttribute('x2', nodePos.x);
            line.setAttribute('y2', nodePos.y);
            line.setAttribute('class', 'tree-edge');
            svg.appendChild(line);
        }
        
        if (node.left) {
            this.drawEdges(svg, node.left, positions, nodePos);
        }
        if (node.right) {
            this.drawEdges(svg, node.right, positions, nodePos);
        }
    }

    drawNode(svg, value, x, y) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 25);
        circle.setAttribute('class', 'tree-node-svg');
        circle.setAttribute('fill', '#667eea');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '16');
        text.setAttribute('font-weight', 'bold');
        text.textContent = value;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.appendChild(circle);
        group.appendChild(text);
        svg.appendChild(group);
    }

    renderNodePool(correctAnswer) {
        this.nodePool.innerHTML = '';
        
        // Shuffle the answer to randomize node pool order
        const shuffled = [...correctAnswer].sort(() => Math.random() - 0.5);
        
        shuffled.forEach(value => {
            const node = document.createElement('div');
            node.className = 'draggable-node';
            node.textContent = value;
            node.draggable = true;
            node.dataset.value = value;
            
            node.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', value);
                node.classList.add('dragging');
            });
            
            node.addEventListener('dragend', () => {
                node.classList.remove('dragging');
            });
            
            this.nodePool.appendChild(node);
        });
    }

    clearAnswerArea() {
        this.answerSlots.innerHTML = '';
        const answerLength = gameState.correctAnswer.length;
        
        for (let i = 0; i < answerLength; i++) {
            const slot = document.createElement('div');
            slot.className = 'answer-slot';
            slot.dataset.index = i;
            
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });
            
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                const value = parseInt(e.dataTransfer.getData('text/plain'));
                this.handleDrop(slot, value);
            });
            
            slot.addEventListener('click', () => {
                if (slot.classList.contains('filled')) {
                    this.removeFromSlot(slot);
                }
            });
            
            this.answerSlots.appendChild(slot);
        }
    }

    handleDrop(slot, value) {
        // Check if slot is already filled
        if (slot.classList.contains('filled')) {
            return;
        }
        
        // Check if value is already in answer
        if (gameState.userAnswer.includes(value)) {
            return;
        }
        
        // Add to answer
        if (gameState.addToAnswer(value)) {
            slot.textContent = value;
            slot.classList.add('filled');
            slot.dataset.value = value;
            
            // Mark node as used
            const node = this.nodePool.querySelector(`[data-value="${value}"]`);
            if (node) {
                node.classList.add('used');
            }
        }
    }

    removeFromSlot(slot) {
        const value = parseInt(slot.dataset.value);
        if (gameState.removeFromAnswer(value)) {
            slot.textContent = '';
            slot.classList.remove('filled');
            slot.removeAttribute('data-value');
            
            // Mark node as available
            const node = this.nodePool.querySelector(`[data-value="${value}"]`);
            if (node) {
                node.classList.remove('used');
            }
        }
    }

    resetAnswer() {
        gameState.resetAnswer();
        this.clearAnswerArea();
        
        // Reset all nodes
        const nodes = this.nodePool.querySelectorAll('.draggable-node');
        nodes.forEach(node => {
            node.classList.remove('used');
        });
    }

    checkAnswer() {
        if (!gameState.isGameActive) return;
        
        const result = gameState.checkAnswer();
        this.stopTimer();
        
        if (result.correct) {
            this.showFeedback('Correct! Well done!', 'correct');
            
            // Check for high score
            const currentHigh = highScoreManager.getHighScore(gameState.difficulty, gameState.traversalType);
            if (!currentHigh || result.timeRemaining > currentHigh.time) {
                this.showHighScoreModal(result.timeRemaining);
            }
        } else {
            const correctStr = result.correctAnswer.join(' → ');
            this.showFeedback(`Incorrect. Correct answer: ${correctStr}`, 'incorrect');
        }
        
        this.updateScore();
        this.updateHighScoresDisplay();
        
        // Disable further interactions
        const nodes = this.nodePool.querySelectorAll('.draggable-node');
        nodes.forEach(node => {
            node.draggable = false;
        });
    }

    startTimer(seconds) {
        this.stopTimer();
        gameState.timeRemaining = seconds;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            gameState.timeRemaining--;
            this.updateTimerDisplay();
            
            if (gameState.timeRemaining <= 0) {
                this.stopTimer();
                this.checkAnswer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(gameState.timeRemaining / 60);
        const seconds = gameState.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.timerDisplay.textContent = timeString;
        
        // Update timer styling based on time remaining
        this.timerDisplay.classList.remove('warning', 'danger');
        if (gameState.timeRemaining <= 10) {
            this.timerDisplay.classList.add('danger');
        } else if (gameState.timeRemaining <= 20) {
            this.timerDisplay.classList.add('warning');
        }
    }

    showFeedback(message, type) {
        this.feedback.textContent = message;
        this.feedback.className = `feedback ${type}`;
        this.feedback.classList.remove('hidden');
    }

    hideFeedback() {
        this.feedback.classList.add('hidden');
    }

    updateScore() {
        const score = gameState.getScore();
        this.correctCount.textContent = score.correct;
        this.totalCount.textContent = score.total;
    }

    showHighScoreModal(timeRemaining) {
        this.highScoreModal.classList.remove('hidden');
        this.initialsInput.value = '';
        this.initialsInput.focus();
        this.pendingTimeRemaining = timeRemaining;
    }

    hideHighScoreModal() {
        this.highScoreModal.classList.add('hidden');
        this.pendingTimeRemaining = null;
    }

    submitInitials() {
        const initials = this.initialsInput.value.trim();
        if (initials.length < 1) {
            alert('Please enter at least one initial');
            return;
        }
        
        if (this.pendingTimeRemaining !== null) {
            highScoreManager.setHighScore(
                gameState.difficulty,
                gameState.traversalType,
                initials,
                this.pendingTimeRemaining
            );
            this.hideHighScoreModal();
            this.updateHighScoresDisplay();
        }
    }

    updateHighScoresDisplay() {
        const allScores = highScoreManager.getAllHighScores();
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const traversalTypes = [
            { key: 'inorder', label: 'In-Order' },
            { key: 'preorder', label: 'Pre-Order' },
            { key: 'postorder', label: 'Post-Order' }
        ];
        
        this.highScoresDisplay.innerHTML = '';
        
        difficulties.forEach(difficulty => {
            const difficultyDiv = document.createElement('div');
            difficultyDiv.className = 'high-score-category';
            
            const difficultyLabel = document.createElement('h3');
            difficultyLabel.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            difficultyDiv.appendChild(difficultyLabel);
            
            traversalTypes.forEach(traversal => {
                const key = `${difficulty}_${traversal.key}`;
                const score = allScores[key];
                
                const scoreRow = document.createElement('div');
                scoreRow.className = 'high-score-row';
                
                const traversalLabel = document.createElement('span');
                traversalLabel.className = 'traversal-label';
                traversalLabel.textContent = traversal.label + ':';
                
                const scoreValue = document.createElement('span');
                scoreValue.className = 'high-score-value';
                
                if (score) {
                    scoreValue.textContent = `${score.initials} - ${score.time}s`;
                } else {
                    scoreValue.textContent = '---';
                    scoreValue.style.color = '#999';
                }
                
                scoreRow.appendChild(traversalLabel);
                scoreRow.appendChild(scoreValue);
                difficultyDiv.appendChild(scoreRow);
            });
            
            this.highScoresDisplay.appendChild(difficultyDiv);
        });
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
    // Display high scores
    ui.updateHighScoresDisplay();
    // Auto-start first game
    ui.startNewGame();
});

