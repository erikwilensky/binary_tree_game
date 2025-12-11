// Central application state manager with localStorage sync
class ClassroomState {
    constructor() {
        this.state = {
            sessionId: null,
            sessionCode: null,
            teamId: null,
            teamName: null,
            currentQuestion: null,
            answers: {},
            teams: [],
            powerups: [],
            isAdmin: false,
            connectionState: 'disconnected'
        };
        
        this.listeners = new Map();
        this.storageKey = 'classroomGameState';
    }

    // Get state value
    get(key) {
        return this.state[key];
    }

    // Set state value and trigger listeners
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.saveState();
        this.notifyListeners(key, value, oldValue);
    }

    // Update multiple state values at once
    update(updates) {
        const oldValues = {};
        Object.keys(updates).forEach(key => {
            oldValues[key] = this.state[key];
            this.state[key] = updates[key];
        });
        this.saveState();
        Object.keys(updates).forEach(key => {
            this.notifyListeners(key, updates[key], oldValues[key]);
        });
    }

    // Get entire state
    getAll() {
        return { ...this.state };
    }

    // Save state to localStorage
    saveState() {
        try {
            const stateToSave = {
                sessionId: this.state.sessionId,
                sessionCode: this.state.sessionCode,
                teamId: this.state.teamId,
                teamName: this.state.teamName,
                isAdmin: this.state.isAdmin
            };
            localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    // Load state from localStorage
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.update({
                    sessionId: parsed.sessionId || null,
                    sessionCode: parsed.sessionCode || null,
                    teamId: parsed.teamId || null,
                    teamName: parsed.teamName || null,
                    isAdmin: parsed.isAdmin || false
                });
                return parsed;
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
        return null;
    }

    // Sync state with Supabase data
    async syncState() {
        try {
            if (this.state.sessionId) {
                // Sync teams
                try {
                    const teams = await classroomAPI.getTeams(this.state.sessionId);
                    this.set('teams', teams || []);
                    // Save to localStorage as fallback
                    localStorage.setItem(`teams_${this.state.sessionId}`, JSON.stringify(teams || []));
                } catch (error) {
                    console.warn('Failed to sync teams, using localStorage:', error);
                    const saved = localStorage.getItem(`teams_${this.state.sessionId}`);
                    if (saved) {
                        this.set('teams', JSON.parse(saved));
                    }
                }

                // Sync current question
                try {
                    const question = await classroomAPI.getActiveQuestion(this.state.sessionId);
                    this.set('currentQuestion', question);
                    if (question) {
                        localStorage.setItem(`question_${this.state.sessionId}`, JSON.stringify(question));
                    }
                } catch (error) {
                    console.warn('Failed to sync question, using localStorage:', error);
                    const saved = localStorage.getItem(`question_${this.state.sessionId}`);
                    if (saved) {
                        this.set('currentQuestion', JSON.parse(saved));
                    }
                }

                // Sync team's answer if question exists
                if (this.state.currentQuestion && this.state.teamId) {
                    try {
                        const answer = await classroomAPI.getAnswer(
                            this.state.sessionId,
                            this.state.currentQuestion.id,
                            this.state.teamId
                        );
                        if (answer) {
                            this.update({
                                answers: {
                                    ...this.state.answers,
                                    [this.state.currentQuestion.id]: answer
                                }
                            });
                            localStorage.setItem(`answer_${this.state.teamId}_${this.state.currentQuestion.id}`, JSON.stringify(answer));
                        }
                    } catch (error) {
                        console.warn('Failed to sync answer, using localStorage:', error);
                        const saved = localStorage.getItem(`answer_${this.state.teamId}_${this.state.currentQuestion.id}`);
                        if (saved) {
                            const answers = this.state.answers;
                            answers[this.state.currentQuestion.id] = JSON.parse(saved);
                            this.set('answers', { ...answers });
                        }
                    }
                }

                // Sync team's powerups
                if (this.state.teamId) {
                    try {
                        const team = await classroomAPI.getTeam(this.state.teamId);
                        if (team) {
                            this.set('powerups', team.powerups || []);
                            localStorage.setItem(`team_${this.state.teamId}`, JSON.stringify(team));
                        }
                    } catch (error) {
                        console.warn('Failed to sync team, using localStorage:', error);
                        const saved = localStorage.getItem(`team_${this.state.teamId}`);
                        if (saved) {
                            const team = JSON.parse(saved);
                            this.set('powerups', team.powerups || []);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to sync state:', error);
        }
    }

    // Subscribe to state changes
    on(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }

    // Unsubscribe from state changes
    off(key, callback) {
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Notify listeners of state change
    notifyListeners(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue, this.state);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        }

        // Also notify wildcard listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                try {
                    callback(key, newValue, oldValue, this.state);
                } catch (error) {
                    console.error('State listener error:', error);
                }
            });
        }
    }

    // Reset state
    reset() {
        this.state = {
            sessionId: null,
            sessionCode: null,
            teamId: null,
            teamName: null,
            currentQuestion: null,
            answers: {},
            teams: [],
            powerups: [],
            isAdmin: false,
            connectionState: 'disconnected'
        };
        localStorage.removeItem(this.storageKey);
        this.notifyListeners('*', null, null);
    }
}

// Export singleton instance
const classroomState = new ClassroomState();

