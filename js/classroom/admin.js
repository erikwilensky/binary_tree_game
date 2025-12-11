// Admin dashboard controller
class AdminController {
    constructor() {
        this.elements = {
            sessionCodeDisplay: document.getElementById('session-code-display'),
            backToLobbyBtn: document.getElementById('back-to-lobby-btn'),
            questionText: document.getElementById('question-text'),
            timeLimit: document.getElementById('time-limit'),
            startQuestionBtn: document.getElementById('start-question-btn'),
            endQuestionBtn: document.getElementById('end-question-btn'),
            currentQuestionDisplay: document.getElementById('current-question-display'),
            refreshAnswersBtn: document.getElementById('refresh-answers-btn'),
            copyAnswersBtn: document.getElementById('copy-answers-btn'),
            answersTableBody: document.getElementById('answers-table-body'),
            teamsAdminList: document.getElementById('teams-admin-list')
        };

        this.currentQuestion = null;
        this.pollInterval = null;
        this.init();
    }

    async init() {
        // Load state
        classroomState.loadState();

        // Check if admin
        if (!classroomState.get('isAdmin') || !classroomState.get('sessionId')) {
            alert('Admin access required. Redirecting to lobby...');
            window.location.href = 'classroom-lobby.html';
            return;
        }

        // Setup UI
        this.elements.sessionCodeDisplay.textContent = `Session: ${classroomState.get('sessionCode')}`;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadData();
        this.startPolling();
    }

    setupEventListeners() {
        this.elements.backToLobbyBtn.addEventListener('click', () => {
            window.location.href = 'classroom-lobby.html';
        });

        this.elements.startQuestionBtn.addEventListener('click', () => this.startQuestion());
        this.elements.endQuestionBtn.addEventListener('click', () => this.endQuestion());
        this.elements.refreshAnswersBtn.addEventListener('click', () => this.loadAnswers());
        this.elements.copyAnswersBtn.addEventListener('click', () => this.copyAnswers());
    }

    async loadData() {
        await this.loadCurrentQuestion();
        await this.loadTeams();
        await this.loadAnswers();
    }

    async loadCurrentQuestion() {
        const sessionId = classroomState.get('sessionId');
        const question = await classroomAPI.getActiveQuestion(sessionId);
        
        this.currentQuestion = question;
        
        if (question) {
            this.elements.currentQuestionDisplay.innerHTML = `
                <h3>Active Question</h3>
                <p><strong>${this.escapeHtml(question.text)}</strong></p>
                <p>Time Limit: ${question.time_limit_seconds}s</p>
                <p>Started: ${new Date(question.started_at).toLocaleTimeString()}</p>
            `;
            this.elements.startQuestionBtn.disabled = true;
            this.elements.endQuestionBtn.disabled = false;
        } else {
            this.elements.currentQuestionDisplay.innerHTML = '<p>No active question</p>';
            this.elements.startQuestionBtn.disabled = false;
            this.elements.endQuestionBtn.disabled = true;
        }
    }

    async startQuestion() {
        const questionText = this.elements.questionText.value.trim();
        const timeLimit = parseInt(this.elements.timeLimit.value);

        if (!questionText) {
            alert('Please enter a question');
            return;
        }

        if (timeLimit < 10 || timeLimit > 600) {
            alert('Time limit must be between 10 and 600 seconds');
            return;
        }

        this.elements.startQuestionBtn.disabled = true;
        this.elements.startQuestionBtn.textContent = 'Starting...';

        try {
            const sessionId = classroomState.get('sessionId');
            
            // Create question
            const question = await classroomAPI.createQuestion(sessionId, questionText, timeLimit);
            
            // Start question
            await classroomAPI.startQuestion(question.id);
            
            // Clear input
            this.elements.questionText.value = '';
            
            // Reload
            await this.loadCurrentQuestion();
            await this.loadAnswers();
            
            this.elements.startQuestionBtn.textContent = 'Start Question';
        } catch (error) {
            console.error('Start question error:', error);
            alert('Failed to start question. Please try again.');
            this.elements.startQuestionBtn.disabled = false;
            this.elements.startQuestionBtn.textContent = 'Start Question';
        }
    }

    async endQuestion() {
        if (!this.currentQuestion) return;

        if (!confirm('End the current question early?')) return;

        this.elements.endQuestionBtn.disabled = true;
        this.elements.endQuestionBtn.textContent = 'Ending...';

        try {
            await classroomAPI.endQuestion(this.currentQuestion.id);
            await this.loadCurrentQuestion();
            await this.loadAnswers();
            
            this.elements.endQuestionBtn.textContent = 'End Question Early';
        } catch (error) {
            console.error('End question error:', error);
            alert('Failed to end question. Please try again.');
            this.elements.endQuestionBtn.disabled = false;
            this.elements.endQuestionBtn.textContent = 'End Question Early';
        }
    }

    async loadAnswers() {
        if (!this.currentQuestion) {
            this.elements.answersTableBody.innerHTML = '<tr><td colspan="4">No active question</td></tr>';
            return;
        }

        try {
            const sessionId = classroomState.get('sessionId');
            const answers = await classroomAPI.getAnswersForQuestion(sessionId, this.currentQuestion.id);
            
            this.renderAnswers(answers);
        } catch (error) {
            console.error('Load answers error:', error);
            this.elements.answersTableBody.innerHTML = '<tr><td colspan="4">Error loading answers</td></tr>';
        }
    }

    async renderAnswers(answers) {
        this.elements.answersTableBody.innerHTML = '';

        if (answers.length === 0) {
            this.elements.answersTableBody.innerHTML = '<tr><td colspan="4">No answers yet</td></tr>';
            return;
        }

        // Get teams for team names
        const teams = await classroomAPI.getTeams(classroomState.get('sessionId'));
        const teamMap = new Map(teams.map(t => [t.id, t]));

        answers.forEach(answer => {
            const team = teamMap.get(answer.team_id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(team ? team.team_name : 'Unknown')}</td>
                <td>${this.escapeHtml(answer.answer || '')}</td>
                <td>${answer.locked ? '🔒 Locked' : '✏️ Working'}</td>
                <td>${answer.submitted_at ? new Date(answer.submitted_at).toLocaleTimeString() : '-'}</td>
            `;
            this.elements.answersTableBody.appendChild(row);
        });
    }

    async loadTeams() {
        try {
            const sessionId = classroomState.get('sessionId');
            const teams = await classroomAPI.getTeams(sessionId);
            this.renderTeams(teams);
        } catch (error) {
            console.error('Load teams error:', error);
        }
    }

    renderTeams(teams) {
        this.elements.teamsAdminList.innerHTML = '';

        if (teams.length === 0) {
            this.elements.teamsAdminList.innerHTML = '<p>No teams yet</p>';
            return;
        }

        teams.forEach(team => {
            const teamEl = document.createElement('div');
            teamEl.className = 'team-admin-item';
            teamEl.innerHTML = `
                <div class="team-info">
                    <span class="team-name">${this.escapeHtml(team.team_name)}</span>
                    <span class="team-score">Score: ${team.score}</span>
                </div>
                <div class="team-actions">
                    <input type="number" class="score-adjust-input" placeholder="±score" data-team-id="${team.id}">
                    <button class="btn btn-small adjust-score-btn" data-team-id="${team.id}">Adjust Score</button>
                </div>
            `;
            
            // Add score adjustment handler
            const adjustBtn = teamEl.querySelector('.adjust-score-btn');
            adjustBtn.addEventListener('click', () => {
                const input = teamEl.querySelector('.score-adjust-input');
                const delta = parseInt(input.value);
                if (!isNaN(delta)) {
                    this.adjustTeamScore(team.id, delta);
                    input.value = '';
                }
            });
            
            this.elements.teamsAdminList.appendChild(teamEl);
        });
    }

    async adjustTeamScore(teamId, delta) {
        try {
            await classroomAPI.updateTeamScore(teamId, delta);
            await this.loadTeams();
        } catch (error) {
            console.error('Adjust score error:', error);
            alert('Failed to adjust score');
        }
    }

    async copyAnswers() {
        if (!this.currentQuestion) {
            alert('No active question');
            return;
        }

        try {
            const sessionId = classroomState.get('sessionId');
            const answers = await classroomAPI.getAnswersForQuestion(sessionId, this.currentQuestion.id);
            const teams = await classroomAPI.getTeams(sessionId);
            const teamMap = new Map(teams.map(t => [t.id, t]));

            const text = answers.map(answer => {
                const team = teamMap.get(answer.team_id);
                return `${team ? team.team_name : 'Unknown'}: ${answer.answer || '(no answer)'}`;
            }).join('\n');

            await navigator.clipboard.writeText(text);
            alert('Answers copied to clipboard!');
        } catch (error) {
            console.error('Copy answers error:', error);
            alert('Failed to copy answers');
        }
    }

    startPolling() {
        // Poll for updates every 2 seconds
        this.pollInterval = setInterval(async () => {
            await this.loadCurrentQuestion();
            await this.loadAnswers();
            await this.loadTeams();
        }, 2000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    cleanup() {
        this.stopPolling();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminController = new AdminController();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.adminController) {
            window.adminController.cleanup();
        }
    });
});

