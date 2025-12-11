// CRUD helpers for each table using Supabase REST API
class ClassroomAPI {
    constructor() {
        this.client = supabaseClient;
    }

    // Game Sessions
    async createSession(sessionCode) {
        const data = await this.client.post('game_sessions', {
            session_code: sessionCode,
            started_at: new Date().toISOString()
        });
        return Array.isArray(data) ? data[0] : data;
    }

    async getSession(sessionCode) {
        try {
            const data = await this.client.get('game_sessions', `session_code=eq.${encodeURIComponent(sessionCode)}&limit=1`);
            return Array.isArray(data) && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Get session error:', error);
            // Try localStorage fallback
            const saved = localStorage.getItem(`session_${sessionCode}`);
            return saved ? JSON.parse(saved) : null;
        }
    }

    async getSessionById(sessionId) {
        const data = await this.client.get('game_sessions', `id=eq.${sessionId}&limit=1`);
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }

    async updateSession(sessionId, updates) {
        const data = await this.client.patch('game_sessions', updates, `id=eq.${sessionId}`);
        return Array.isArray(data) ? data[0] : data;
    }

    // Teams
    async createTeam(sessionId, teamName) {
        const data = await this.client.post('teams', {
            session_id: sessionId,
            team_name: teamName,
            score: 10, // Start with 10 points (modifier)
            powerups: []
        });
        return Array.isArray(data) ? data[0] : data;
    }

    async getTeams(sessionId) {
        return await this.client.get('teams', `session_id=eq.${sessionId}&order=created_at.asc`);
    }

    async getTeam(teamId) {
        const data = await this.client.get('teams', `id=eq.${teamId}&limit=1`);
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }

    async getTeamByName(sessionId, teamName) {
        const data = await this.client.get('teams', `session_id=eq.${sessionId}&team_name=eq.${encodeURIComponent(teamName)}&limit=1`);
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }

    async updateTeam(teamId, updates) {
        const data = await this.client.patch('teams', updates, `id=eq.${teamId}`);
        return Array.isArray(data) ? data[0] : data;
    }

    async updateTeamScore(teamId, scoreDelta) {
        // Get current team
        const team = await this.getTeam(teamId);
        if (!team) return null;
        
        // Modifiers can go negative, but we'll keep a reasonable floor
        const newScore = team.score + scoreDelta;
        return await this.updateTeam(teamId, { score: newScore });
    }

    // Questions
    async createQuestion(sessionId, text, timeLimitSeconds) {
        const data = await this.client.post('questions', {
            session_id: sessionId,
            text: text,
            time_limit_seconds: timeLimitSeconds,
            is_active: false
        });
        return Array.isArray(data) ? data[0] : data;
    }

    async getActiveQuestion(sessionId) {
        const data = await this.client.get('questions', `session_id=eq.${sessionId}&is_active=eq.true&order=started_at.desc&limit=1`);
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }

    async getQuestion(questionId) {
        const data = await this.client.get('questions', `id=eq.${questionId}&limit=1`);
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }

    async updateQuestion(questionId, updates) {
        const data = await this.client.patch('questions', updates, `id=eq.${questionId}`);
        return Array.isArray(data) ? data[0] : data;
    }

    async startQuestion(questionId) {
        return await this.updateQuestion(questionId, {
            is_active: true,
            started_at: new Date().toISOString()
        });
    }

    async endQuestion(questionId) {
        return await this.updateQuestion(questionId, {
            is_active: false,
            ended_at: new Date().toISOString()
        });
    }

    // Quiz Answers
    async getAnswer(sessionId, questionId, teamId) {
        const data = await this.client.get('quiz_answers', 
            `session_id=eq.${sessionId}&question_id=eq.${questionId}&team_id=eq.${teamId}&limit=1`);
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }

    async createAnswer(sessionId, questionId, teamId, answer = '') {
        const data = await this.client.post('quiz_answers', {
            session_id: sessionId,
            question_id: questionId,
            team_id: teamId,
            answer: answer,
            locked: false
        });
        return Array.isArray(data) ? data[0] : data;
    }

    async updateAnswer(answerId, updates) {
        const data = await this.client.patch('quiz_answers', {
            ...updates,
            updated_at: new Date().toISOString()
        }, `id=eq.${answerId}`);
        return Array.isArray(data) ? data[0] : data;
    }

    async lockAnswer(answerId) {
        return await this.updateAnswer(answerId, {
            locked: true,
            submitted_at: new Date().toISOString()
        });
    }

    async getAnswersForQuestion(sessionId, questionId) {
        return await this.client.get('quiz_answers', 
            `session_id=eq.${sessionId}&question_id=eq.${questionId}&order=submitted_at.asc`);
    }

    async getOrCreateAnswer(sessionId, questionId, teamId, answer = '') {
        let answerRecord = await this.getAnswer(sessionId, questionId, teamId);
        if (!answerRecord) {
            answerRecord = await this.createAnswer(sessionId, questionId, teamId, answer);
        }
        return answerRecord;
    }

    // Powerup Events
    async createPowerupEvent(sessionId, teamId, powerupType, targetTeamId = null, payload = {}) {
        const data = await this.client.post('powerup_events', {
            session_id: sessionId,
            team_id: teamId,
            target_team_id: targetTeamId,
            powerup_type: powerupType,
            payload: payload
        });
        return Array.isArray(data) ? data[0] : data;
    }

    async getPowerupEvents(sessionId, since = null) {
        let query = `session_id=eq.${sessionId}&order=created_at.desc`;
        if (since) {
            query += `&created_at=gt.${since}`;
        }
        return await this.client.get('powerup_events', query);
    }
}

// Export singleton instance
const classroomAPI = new ClassroomAPI();

