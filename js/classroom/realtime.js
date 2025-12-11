// Realtime subscriptions and event routing
class RealtimeManager {
    constructor() {
        this.pollIntervals = new Map();
        this.lastUpdateTimes = new Map();
        this.pollingEnabled = true;
        this.pollInterval = 2000; // 2 seconds
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
            classroomState.set('teams', teams || []);
        });

        // Poll for answer updates (if in a question)
        this.startPollingFor('answers', async () => {
            const sessionId = classroomState.get('sessionId');
            const question = classroomState.get('currentQuestion');
            const teamId = classroomState.get('teamId');

            if (!sessionId || !question || !teamId) return;

            const answer = await classroomAPI.getAnswer(sessionId, question.id, teamId);
            if (answer) {
                const currentAnswer = classroomState.get('answers')[question.id];
                if (!currentAnswer || currentAnswer.answer !== answer.answer) {
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
        answers[question.id] = answer;
        classroomState.set('answers', { ...answers });

        // Check if any team locked (triggers time reduction)
        this.checkForLocks();
    }

    // Check for team locks and trigger time reduction
    async checkForLocks() {
        const sessionId = classroomState.get('sessionId');
        const question = classroomState.get('currentQuestion');
        if (!sessionId || !question) return;

        const answers = await classroomAPI.getAnswersForQuestion(sessionId, question.id);
        const lockedCount = answers.filter(a => a.locked).length;
        
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

