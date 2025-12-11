// Realtime subscriptions and event routing
class RealtimeManager {
    constructor() {
        this.pollIntervals = new Map();
        this.lastUpdateTimes = new Map();
        this.pollingEnabled = true;
        this.pollInterval = 5000; // 5 seconds (reduced flashing)
    }

    // Start polling for updates
    startPolling() {
        if (!this.pollingEnabled) return;

        // Poll for question updates
        this.startPollingFor('question', async () => {
            const sessionId = classroomState.get('sessionId');
            if (!sessionId) return;

            const question = await classroomAPI.getActiveQuestion(sessionId);
            const currentQuestion = classroomState.get('currentQuestion');

            // Check if question changed or started
            if (question && (!currentQuestion || currentQuestion.id !== question.id || 
                (question.is_active && !currentQuestion.is_active))) {
                this.onQuestionStart(question);
            } else if (!question && currentQuestion) {
                classroomState.set('currentQuestion', null);
            } else if (question && currentQuestion && question.id === currentQuestion.id) {
                classroomState.set('currentQuestion', question);
            }
        });

        // Poll for team updates
        this.startPollingFor('teams', async () => {
            const sessionId = classroomState.get('sessionId');
            if (!sessionId) return;

            const teams = await classroomAPI.getTeams(sessionId);
            const currentTeams = classroomState.get('teams');
            
            // Only update if teams actually changed (prevent flashing)
            // Deep comparison to avoid unnecessary updates
            if (!currentTeams || teams.length !== currentTeams.length) {
                classroomState.set('teams', teams || []);
                return;
            }
            
            // Check if any team data actually changed
            let hasChanges = false;
            for (let i = 0; i < teams.length; i++) {
                const team = teams[i];
                const currentTeam = currentTeams.find(t => t.id === team.id);
                if (!currentTeam || 
                    currentTeam.score !== team.score ||
                    currentTeam.team_name !== team.team_name ||
                    JSON.stringify(currentTeam.powerups || []) !== JSON.stringify(team.powerups || [])) {
                    hasChanges = true;
                    break;
                }
            }
            
            if (hasChanges) {
                classroomState.set('teams', teams || []);
            }
        });

        // Poll for answer updates (if in a question)
        this.startPollingFor('answers', async () => {
            const sessionId = classroomState.get('sessionId');
            const question = classroomState.get('currentQuestion');
            const teamId = classroomState.get('teamId');

            if (!sessionId || !question || !teamId) return;

            // Check if user is currently typing - if so, skip this poll
            const answerInput = document.getElementById('answer-input');
            const isUserTyping = answerInput && (
                document.activeElement === answerInput || 
                (window.gameController && window.gameController.isTyping) ||
                (Date.now() - (window.gameController?.lastTypingTime || 0)) < 2000
            );
            
            if (isUserTyping) {
                // User is typing - don't poll to avoid overwriting their input
                return;
            }

            const answer = await classroomAPI.getAnswer(sessionId, question.id, teamId);
            if (answer) {
                const currentAnswer = classroomState.get('answers')[question.id];
                // Only update if answer actually changed
                if (!currentAnswer || currentAnswer.answer !== answer.answer || currentAnswer.locked !== answer.locked) {
                    // Always call onAnswerUpdate - it will handle the typing check internally
                    this.onAnswerUpdate(answer);
                }
            }
        });

        // Poll for powerup events
        this.startPollingFor('powerups', async () => {
            const sessionId = classroomState.get('sessionId');
            if (!sessionId) return;

            const lastUpdate = this.lastUpdateTimes.get('powerups') || new Date(0).toISOString();
            const events = await classroomAPI.getPowerupEvents(sessionId, lastUpdate);
            
            if (events && events.length > 0) {
                events.forEach(event => {
                    this.onPowerupUsed(event);
                });
                this.lastUpdateTimes.set('powerups', new Date().toISOString());
            }
        });
    }

    // Start polling for a specific resource
    startPollingFor(resource, callback) {
        this.stopPollingFor(resource);
        
        const intervalId = setInterval(async () => {
            try {
                await callback();
            } catch (error) {
                console.error(`Polling error for ${resource}:`, error);
            }
        }, this.pollInterval);

        this.pollIntervals.set(resource, intervalId);
    }

    // Stop polling for a specific resource
    stopPollingFor(resource) {
        const intervalId = this.pollIntervals.get(resource);
        if (intervalId) {
            clearInterval(intervalId);
            this.pollIntervals.delete(resource);
        }
    }

    // Stop all polling
    stopPolling() {
        this.pollIntervals.forEach(intervalId => clearInterval(intervalId));
        this.pollIntervals.clear();
    }

    // Question started handler
    onQuestionStart(question) {
        classroomState.set('currentQuestion', question);
        
        // Start timer if question is active
        if (question.is_active && question.started_at) {
            classroomTimer.startTimer(question.time_limit_seconds, question.started_at);
        }
    }

    // Answer update handler
    onAnswerUpdate(answer) {
        const question = classroomState.get('currentQuestion');
        if (!question || answer.question_id !== question.id) return;

        // Update state
        const answers = classroomState.get('answers');
        const currentAnswer = answers[question.id];
        
        // Only update if actually changed
        if (!currentAnswer || currentAnswer.answer !== answer.answer || currentAnswer.locked !== answer.locked) {
            answers[question.id] = answer;
            classroomState.set('answers', { ...answers });
            
            // Update UI if on game page
            const answerInput = document.getElementById('answer-input');
            if (answerInput && !answerInput.disabled) {
                const isUserTyping = document.activeElement === answerInput;
                const currentValue = answerInput.value;
                const newValue = answer.answer || '';
                const oldValue = currentAnswer?.answer || '';
                
                // NEVER update if user is actively typing (unless it's a powerup injection)
                if (isUserTyping) {
                    // Only allow powerup injection if:
                    // 1. New value is longer than old value (powerup added characters)
                    // 2. Current input value matches the old value exactly (user hasn't typed new chars)
                    // 3. New value starts with the old value (powerup appended, not replaced)
                    if (newValue.length > oldValue.length && 
                        currentValue === oldValue && 
                        newValue.startsWith(oldValue)) {
                        // Powerup injection - append new characters
                        const newChars = newValue.substring(oldValue.length);
                        answerInput.value = currentValue + newChars;
                    }
                    // Otherwise, don't touch the input - user is typing!
                } else {
                    // User not typing - safe to update
                    if (currentValue !== newValue) {
                        answerInput.value = newValue;
                    }
                }
            }
        }

        // Check if any team locked (triggers time reduction)
        this.checkForLocks();
    }

    // Check for team locks and trigger time reduction
    async checkForLocks() {
        const sessionId = classroomState.get('sessionId');
        const question = classroomState.get('currentQuestion');
        if (!sessionId || !question) return;

        const answers = await classroomAPI.getAnswersForQuestion(sessionId, question.id);
        const teams = classroomState.get('teams');
        const lockedCount = answers.filter(a => a.locked).length;
        const totalTeams = teams.length;
        
        // If all teams have locked, set timer to zero
        if (totalTeams > 0 && lockedCount >= totalTeams) {
            classroomTimer.forceToZero();
            return;
        }
        
        // If any team locked and timer hasn't been reduced yet
        if (lockedCount > 0 && !classroomTimer.reduced) {
            classroomTimer.reduceTimeByOneThird();
        }
    }

    // Powerup used handler
    async onPowerupUsed(event) {
        const teamId = classroomState.get('teamId');
        const question = classroomState.get('currentQuestion');

        // Handle random characters powerup if we're the target
        if (event.powerup_type === 'random_chars' && 
            event.target_team_id === teamId && 
            question) {
            // Visual feedback will be handled in UI
            this.triggerEvent('powerupReceived', {
                type: 'random_chars',
                payload: event.payload
            });
        }

        // Handle early lock powerup if we're the target
        if (event.powerup_type === 'early_lock' && 
            event.target_team_id === teamId) {
            // Check if answer is now locked
            const sessionId = classroomState.get('sessionId');
            if (question) {
                const answer = await classroomAPI.getAnswer(sessionId, question.id, teamId);
                if (answer && answer.locked) {
                    this.triggerEvent('earlyLockReceived', {
                        type: 'early_lock',
                        targetTeamId: teamId
                    });
                }
            }
        }

        // Update teams to reflect score changes
        if (event.powerup_type === 'score_bash' || event.powerup_type === 'roll_dice') {
            const sessionId = classroomState.get('sessionId');
            const teams = await classroomAPI.getTeams(sessionId);
            classroomState.set('teams', teams || []);
        }
    }

    // Event system for UI updates
    eventListeners = new Map();

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    triggerEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }
}

// Export singleton instance
const realtimeManager = new RealtimeManager();

