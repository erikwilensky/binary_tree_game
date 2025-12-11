// Game page controller
class GameController {
    constructor() {
        this.elements = {
            teamNameDisplay: document.getElementById('team-name-display'),
            scoreDisplay: document.getElementById('score-display'),
            questionText: document.getElementById('question-text'),
            timerText: document.getElementById('timer-text'),
            timerProgress: document.getElementById('timer-progress'),
            answerInput: document.getElementById('answer-input'),
            answerCard: document.getElementById('answer-card'),
            armLockBtn: document.getElementById('arm-lock-btn'),
            lockBtn: document.getElementById('lock-btn'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            answerStatus: document.getElementById('answer-status'),
            teamsStatusList: document.getElementById('teams-status-list'),
            powerupsInventory: document.getElementById('powerups-inventory'),
            buyPowerupBtn: document.getElementById('buy-powerup-btn'),
            leaveGameBtn: document.getElementById('leave-game-btn')
        };

        this.answerSyncInterval = null;
        this.currentAnswerId = null;
        this.lockArmed = false;
        this.isFullscreen = false;
        this.isTyping = false;
        this.lastTypingTime = 0;
        this.hasLocalChanges = false; // Track if user has made local edits
        this.lastSyncedValue = ''; // Track what we last synced to server
        
        // Expose to window for realtime manager to check
        window.gameController = this;
        
        this.init();
    }

    async init() {
        // Load state
        classroomState.loadState();

        // Check if in session
        if (!classroomState.get('sessionId') || !classroomState.get('teamId')) {
            alert('Not in a session. Redirecting to lobby...');
            window.location.href = 'classroom-lobby.html';
            return;
        }

        // Setup UI
        this.setupUI();
        this.setupEventListeners();
        this.setupStateListeners();
        this.setupTimerCallbacks();
        this.setupRealtimeCallbacks();

        // Start syncing
        await this.syncState();
        this.startAnswerSyncing();
        realtimeManager.startPolling();

        // Update UI
        this.updateUI();
        
        // Check for forced theme on initial load
        const teams = classroomState.get('teams');
        if (teams) {
            this.checkForcedTheme(teams);
        }
    }

    setupUI() {
        const teamName = classroomState.get('teamName');
        this.elements.teamNameDisplay.textContent = `Team: ${teamName || 'Unknown'}`;
    }

    setupEventListeners() {
        // Arm lock button
        this.elements.armLockBtn.addEventListener('click', () => this.armLock());

        // Lock button
        this.elements.lockBtn.addEventListener('click', () => this.lockAnswer());

        // Fullscreen button
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Buy powerup button
        this.elements.buyPowerupBtn.addEventListener('click', () => this.buyPowerup());

        // Leave game button
        this.elements.leaveGameBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to leave the game?')) {
                classroomState.reset();
                window.location.href = 'classroom-lobby.html';
            }
        });

        // Answer input - sync on input
        let typingTimeout;
        this.elements.answerInput.addEventListener('input', (e) => {
            this.isTyping = true;
            this.lastTypingTime = Date.now();
            this.hasLocalChanges = true; // Mark that user has made local changes
            
            // Clear existing timeout
            clearTimeout(typingTimeout);
            // Mark as not typing after 10 seconds of inactivity (very extended to prevent overwrites)
            typingTimeout = setTimeout(() => {
                // Only mark as not typing if input is not focused
                if (document.activeElement !== this.elements.answerInput) {
                    this.isTyping = false;
                    // Sync after user stops typing
                    this.syncAnswer();
                }
            }, 10000);
            
            // Schedule sync only after user stops typing (debounced)
            this.scheduleAnswerSync();
        });

        // Track when user stops typing
        this.elements.answerInput.addEventListener('blur', () => {
            // Wait a bit before marking as not typing (in case they click back)
            setTimeout(() => {
                if (document.activeElement !== this.elements.answerInput) {
                    this.isTyping = false;
                    this.syncAnswer(); // Final sync when they leave the field
                }
            }, 100);
        });

        // Track focus to mark as typing
        this.elements.answerInput.addEventListener('focus', () => {
            this.isTyping = true;
            this.lastTypingTime = Date.now();
        });

        // Exit fullscreen on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreen();
            }
        });

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('msfullscreenchange', () => this.onFullscreenChange());
    }

    onFullscreenChange() {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                        document.webkitFullscreenElement || 
                                        document.msFullscreenElement);
        
        if (!isCurrentlyFullscreen && this.isFullscreen) {
            // User exited fullscreen via browser controls
            this.elements.answerCard.classList.remove('fullscreen-mode');
            this.elements.fullscreenBtn.textContent = '⛶ Fullscreen';
            this.isFullscreen = false;
        }
    }

    setupStateListeners() {
        // Listen for question changes
        classroomState.on('currentQuestion', (question) => {
            this.onQuestionChange(question);
        });

        // Listen for teams changes
        classroomState.on('teams', (teams) => {
            this.renderTeamsStatus(teams);
            this.updateScore();
            // Check for forced theme
            this.checkForcedTheme(teams);
        });

        // Listen for powerups changes
        classroomState.on('powerups', (powerups) => {
            this.renderPowerups(powerups);
        });
    }

    setupTimerCallbacks() {
        // Timer tick
        classroomTimer.onTick((remaining, limit) => {
            this.updateTimer(remaining, limit);
        });

        // Timer expire
        classroomTimer.onExpire(() => {
            this.lockAnswer(true); // Auto-lock
        });
    }

    setupRealtimeCallbacks() {
        // Powerup received
        realtimeManager.on('powerupReceived', (data) => {
            if (data.type === 'random_chars') {
                this.showPowerupEffect('Random characters injected into your answer!');
            }
        });

        // Early lock received
        realtimeManager.on('earlyLockReceived', (data) => {
            if (data.targetTeamId === classroomState.get('teamId')) {
                this.showPowerupEffect('⚠️ Your answer has been locked early by a powerup!', 'warning');
                // Force lock the answer
                this.lockAnswer(true);
            }
        });

        // Theme forced
        realtimeManager.on('themeForced', (data) => {
            if (data.targetTeamId === classroomState.get('teamId')) {
                this.showPowerupEffect('🎨 Your theme has been changed by a powerup!', 'warning');
                // Apply forced theme
                const teams = classroomState.get('teams');
                const team = teams.find(t => t.id === data.targetTeamId);
                if (team && team.forced_theme) {
                    if (window.themeManager) {
                        window.themeManager.applyTheme(team.forced_theme);
                    }
                    // Disable theme selector
                    const themeSelect = document.getElementById('theme-select');
                    if (themeSelect) {
                        themeSelect.disabled = true;
                        themeSelect.title = 'Theme locked by powerup';
                    }
                }
            }
        });
    }

    async syncState() {
        await classroomState.syncState();
    }

    onQuestionChange(question) {
        if (!question) {
            this.elements.questionText.textContent = 'Waiting for question...';
            // IMPORTANT: Do NOT clear the answer input when question ends
            // Just disable it so answers remain visible
            this.elements.answerInput.disabled = true;
            this.elements.lockBtn.disabled = true;
            this.elements.armLockBtn.disabled = true;
            classroomTimer.stopTimer();
            return;
        }

        // Display question
        this.elements.questionText.textContent = question.text;
        this.elements.answerInput.disabled = false;
        this.elements.lockBtn.disabled = false;
        this.elements.armLockBtn.disabled = false;

        // Start timer if active
        if (question.is_active && question.started_at) {
            classroomTimer.startTimer(question.time_limit_seconds, question.started_at);
        }

        // Load or create answer
        this.loadAnswer(question);
    }

    async loadAnswer(question) {
        const sessionId = classroomState.get('sessionId');
        const teamId = classroomState.get('teamId');

        try {
            let answer = await classroomAPI.getAnswer(sessionId, question.id, teamId);
            
            if (!answer) {
                // Create new answer
                answer = await classroomAPI.createAnswer(sessionId, question.id, teamId, '');
            }

            this.currentAnswerId = answer.id;
            
            // Only update input if user hasn't made local changes
            // This prevents overwriting what the user is typing
            if (!this.hasLocalChanges) {
                this.elements.answerInput.value = answer.answer || '';
                this.lastSyncedValue = answer.answer || '';
            } else {
                // User has local changes - don't overwrite, but update lastSyncedValue for comparison
                this.lastSyncedValue = answer.answer || '';
            }
            
            if (answer.locked) {
                this.elements.answerInput.disabled = true;
                this.elements.armLockBtn.disabled = true;
                this.elements.lockBtn.disabled = true;
                this.elements.answerStatus.textContent = '🔒 Answer Locked';
                this.elements.answerStatus.className = 'answer-status locked';
                this.lockArmed = false;
            } else {
                this.elements.answerInput.disabled = false;
                this.elements.armLockBtn.disabled = false;
                this.elements.lockBtn.disabled = false;
                this.elements.answerStatus.textContent = '';
                this.elements.answerStatus.className = 'answer-status';
                this.lockArmed = false;
                this.updateLockButtonState();
            }
        } catch (error) {
            console.error('Load answer error:', error);
        }
    }

    scheduleAnswerSync() {
        // Debounce answer syncing - only sync if not typing
        if (this.answerSyncTimeout) {
            clearTimeout(this.answerSyncTimeout);
        }

        // Only schedule sync if user is not actively typing
        if (!this.isTyping && document.activeElement !== this.elements.answerInput) {
            this.answerSyncTimeout = setTimeout(() => {
                // Double-check user isn't typing before syncing
                if (!this.isTyping && document.activeElement !== this.elements.answerInput) {
                    this.syncAnswer();
                }
            }, 1000); // Wait 1 second after typing stops
        }
    }

    startAnswerSyncing() {
        // DISABLED: Periodic sync is causing text deletion
        // We only sync on input events now, not periodically
        // This prevents any chance of overwriting user input
        // this.answerSyncInterval = setInterval(() => {
        //     // Only sync if user is definitely not typing
        //     if (!this.isTyping && 
        //         document.activeElement !== this.elements.answerInput &&
        //         (Date.now() - (this.lastTypingTime || 0)) > 10000) {
        //         this.syncAnswer();
        //     }
        // }, 5000);
    }

    async syncAnswer() {
        if (!this.currentAnswerId) return;
        
        // NEVER sync if user is typing - this prevents overwriting
        if (this.isTyping || document.activeElement === this.elements.answerInput) {
            return; // Don't sync while typing
        }

        const answerText = this.elements.answerInput.value;
        
        try {
            await classroomAPI.updateAnswer(this.currentAnswerId, { answer: answerText });
            this.lastSyncedValue = answerText; // Track what we synced
            this.hasLocalChanges = false; // Reset local changes flag
        } catch (error) {
            console.error('Sync answer error:', error);
        }
    }

    armLock() {
        if (this.lockArmed) {
            // Disarm
            this.lockArmed = false;
            this.elements.armLockBtn.textContent = 'Arm Lock';
            this.elements.armLockBtn.classList.remove('armed');
            this.updateLockButtonState();
        } else {
            // Arm
            this.lockArmed = true;
            this.elements.armLockBtn.textContent = 'Lock Armed';
            this.elements.armLockBtn.classList.add('armed');
            this.updateLockButtonState();
        }
    }

    updateLockButtonState() {
        if (this.lockArmed) {
            this.elements.lockBtn.disabled = false;
            this.elements.lockBtn.classList.add('armed-ready');
        } else {
            this.elements.lockBtn.disabled = true;
            this.elements.lockBtn.classList.remove('armed-ready');
        }
    }

    async lockAnswer(autoLock = false) {
        if (!this.currentAnswerId) {
            console.error('Cannot lock: no current answer ID');
            alert('No answer to lock. Please wait for a question to start.');
            return;
        }

        // Check if armed (unless auto-lock)
        if (!autoLock && !this.lockArmed) {
            alert('Please arm the lock first!');
            return;
        }

        // Disable button immediately to prevent double-clicks
        this.elements.lockBtn.disabled = true;
        this.elements.lockBtn.textContent = 'Locking...';

        try {
            const result = await classroomAPI.lockAnswer(this.currentAnswerId);
            console.log('Lock answer successful:', result);
            
            this.elements.answerInput.disabled = true;
            this.elements.armLockBtn.disabled = true;
            this.elements.lockBtn.disabled = true;
            this.elements.lockBtn.textContent = '🔒 Lock Answer';
            this.elements.answerStatus.textContent = '🔒 Answer Locked';
            this.elements.answerStatus.className = 'answer-status locked';
            this.lockArmed = false;

            // Visual feedback
            this.elements.answerInput.classList.add('success-flash');
            setTimeout(() => {
                this.elements.answerInput.classList.remove('success-flash');
            }, 500);

            if (!autoLock) {
                // Trigger time reduction for other teams
                realtimeManager.checkForLocks();
            }
        } catch (error) {
            console.error('Lock answer error:', error);
            // Re-enable button on error
            this.elements.lockBtn.disabled = false;
            this.elements.lockBtn.textContent = '🔒 Lock Answer';
            alert('Failed to lock answer: ' + (error.message || 'Please try again.'));
        }
    }

    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        const card = this.elements.answerCard;
        
        if (card.requestFullscreen) {
            card.requestFullscreen();
        } else if (card.webkitRequestFullscreen) {
            card.webkitRequestFullscreen();
        } else if (card.msRequestFullscreen) {
            card.msRequestFullscreen();
        }

        card.classList.add('fullscreen-mode');
        this.elements.fullscreenBtn.textContent = '✕ Exit Fullscreen';
        this.isFullscreen = true;
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        this.elements.answerCard.classList.remove('fullscreen-mode');
        this.elements.fullscreenBtn.textContent = '⛶ Fullscreen';
        this.isFullscreen = false;
    }

    async buyPowerup() {
        const teamId = classroomState.get('teamId');
        if (!teamId) return;

        try {
            const powerupType = await powerupEngine.buyPowerup(teamId);
            alert(`Purchased ${powerupEngine.getPowerupName(powerupType)}!`);
            
            // Refresh state
            await this.syncState();
        } catch (error) {
            alert(error.message || 'Failed to buy powerup');
        }
    }

    updateTimer(remaining, limit) {
        this.elements.timerText.textContent = classroomTimer.formatTime(remaining);
        
        const progress = classroomTimer.getProgress();
        this.elements.timerProgress.style.width = `${progress * 100}%`;
        
        // Change color based on time remaining
        if (progress > 0.5) {
            this.elements.timerProgress.className = 'timer-progress green';
        } else if (progress > 0.25) {
            this.elements.timerProgress.className = 'timer-progress yellow';
        } else {
            this.elements.timerProgress.className = 'timer-progress red';
        }
    }

    async renderTeamsStatus(teams) {
        const question = classroomState.get('currentQuestion');
        if (!question) return;

        // Get all answers at once to avoid multiple async calls
        const sessionId = classroomState.get('sessionId');
        let answers = [];
        try {
            answers = await classroomAPI.getAnswersForQuestion(sessionId, question.id);
        } catch (error) {
            console.error('Error loading answers for team status:', error);
        }

        const answerMap = new Map(answers.map(a => [a.team_id, a]));

        // Build new HTML
        let newHTML = '';
        teams.forEach((team) => {
            const answer = answerMap.get(team.id);
            const status = answer && answer.locked ? 'locked' : 'working';
            const statusText = answer && answer.locked ? '🔒 Locked' : '✏️ Working';
            const modifier = team.score >= 0 ? `+${team.score}` : `${team.score}`;

            newHTML += `
                <div class="team-status-item ${status}">
                    <span class="team-name">${this.escapeHtml(team.team_name)}</span>
                    <span class="team-status ${status}">${statusText}</span>
                    <span class="team-score">${modifier}</span>
                </div>
            `;
        });

        // Only update DOM if content actually changed (prevent flashing)
        const currentHTML = this.elements.teamsStatusList.innerHTML;
        if (currentHTML !== newHTML) {
            this.elements.teamsStatusList.innerHTML = newHTML;
        }
    }

    renderPowerups(powerups) {
        this.elements.powerupsInventory.innerHTML = '';

        if (!powerups || powerups.length === 0) {
            this.elements.powerupsInventory.innerHTML = '<p class="no-powerups">No powerups</p>';
            return;
        }

        powerups.forEach((powerupType, index) => {
            const powerupEl = document.createElement('div');
            powerupEl.className = 'powerup-item';
            powerupEl.innerHTML = `
                <span class="powerup-name">${powerupEngine.getPowerupName(powerupType)}</span>
                <button class="btn btn-small use-powerup-btn" data-powerup="${powerupType}" data-index="${index}">
                    Use
                </button>
            `;
            
            // Add use button handler
            const useBtn = powerupEl.querySelector('.use-powerup-btn');
            useBtn.addEventListener('click', () => this.usePowerup(powerupType, index));
            
            this.elements.powerupsInventory.appendChild(powerupEl);
        });
    }

    async usePowerup(powerupType, index) {
        const teamId = classroomState.get('teamId');
        const teams = classroomState.get('teams');
        
        // For powerups that need a target, show team selection
        if (powerupType === 'random_chars' || powerupType === 'score_bash' || powerupType === 'early_lock' || powerupType === 'hard_to_read') {
            const targetTeam = await this.selectTargetTeam(teams, teamId);
            if (!targetTeam) return;
            
            try {
                await powerupEngine.usePowerup(powerupType, teamId, targetTeam.id);
                await this.syncState();
            } catch (error) {
                alert(error.message || 'Failed to use powerup');
            }
        } else {
            try {
                await powerupEngine.usePowerup(powerupType, teamId);
                await this.syncState();
            } catch (error) {
                alert(error.message || 'Failed to use powerup');
            }
        }
    }

    async selectTargetTeam(teams, excludeTeamId) {
        const availableTeams = teams.filter(t => t.id !== excludeTeamId);
        if (availableTeams.length === 0) {
            alert('No other teams available');
            return null;
        }

        const teamNames = availableTeams.map(t => t.team_name);
        const selected = prompt(`Select target team:\n${teamNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\nEnter number:`);
        
        const index = parseInt(selected) - 1;
        if (index >= 0 && index < availableTeams.length) {
            return availableTeams[index];
        }
        return null;
    }

    updateScore() {
        const teams = classroomState.get('teams');
        const teamId = classroomState.get('teamId');
        const team = teams.find(t => t.id === teamId);
        
        if (team) {
            const modifier = team.score >= 0 ? `+${team.score}` : `${team.score}`;
            this.elements.scoreDisplay.textContent = `Modifier: ${modifier}`;
        }
    }

    updateUI() {
        this.updateScore();
        
        const question = classroomState.get('currentQuestion');
        if (question) {
            this.onQuestionChange(question);
        }

        const teams = classroomState.get('teams');
        if (teams) {
            this.renderTeamsStatus(teams);
        }

        const powerups = classroomState.get('powerups');
        if (powerups) {
            this.renderPowerups(powerups);
        }
    }

    showPowerupEffect(message, type = 'info') {
        // Show visual feedback
        const notification = document.createElement('div');
        notification.className = `powerup-notification powerup-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Add shake effect to answer input if random chars
        if (message.includes('Random characters')) {
            this.elements.answerInput.classList.add('error');
            setTimeout(() => {
                this.elements.answerInput.classList.remove('error');
            }, 500);
        }
        
        // Flash effect for early lock
        if (message.includes('locked early')) {
            document.body.style.animation = 'flash 0.5s ease-in-out 3';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 1500);
        }
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    checkForcedTheme(teams) {
        const teamId = classroomState.get('teamId');
        if (!teamId) return;
        
        const team = teams.find(t => t.id === teamId);
        if (team && team.forced_theme) {
            // Apply forced theme
            if (window.themeManager) {
                window.themeManager.applyTheme(team.forced_theme);
            }
            // Disable theme selector
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) {
                themeSelect.disabled = true;
                themeSelect.title = 'Theme locked by powerup';
            }
        } else {
            // Re-enable theme selector if no forced theme
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) {
                themeSelect.disabled = false;
                themeSelect.title = '';
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    cleanup() {
        if (this.answerSyncInterval) {
            clearInterval(this.answerSyncInterval);
        }
        if (this.answerSyncTimeout) {
            clearTimeout(this.answerSyncTimeout);
        }
        realtimeManager.stopPolling();
        classroomTimer.stopTimer();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.gameController) {
            window.gameController.cleanup();
        }
    });
});

