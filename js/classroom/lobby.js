// Lobby page logic
class LobbyController {
    constructor() {
        this.elements = {
            sessionCodeInput: document.getElementById('session-code'),
            teamNameInput: document.getElementById('team-name'),
            joinBtn: document.getElementById('join-btn'),
            joinError: document.getElementById('join-error'),
            createSessionBtn: document.getElementById('create-session-btn'),
            sessionInfo: document.getElementById('session-info'),
            generatedCode: document.getElementById('generated-code'),
            goAdminBtn: document.getElementById('go-admin-btn'),
            teamsListCard: document.getElementById('teams-list-card'),
            teamsList: document.getElementById('teams-list'),
            startGameBtn: document.getElementById('start-game-btn')
        };

        this.init();
    }

    init() {
        // Load saved state
        classroomState.loadState();
        
        // Check if already in a session
        if (classroomState.get('sessionCode')) {
            this.elements.sessionCodeInput.value = classroomState.get('sessionCode');
        }
        if (classroomState.get('teamName')) {
            this.elements.teamNameInput.value = classroomState.get('teamName');
        }

        // Event listeners
        this.elements.joinBtn.addEventListener('click', () => this.joinSession());
        this.elements.createSessionBtn.addEventListener('click', () => this.createSession());
        this.elements.goAdminBtn.addEventListener('click', () => this.goToAdmin());
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());

        // Enter key handlers
        this.elements.sessionCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinSession();
        });
        this.elements.teamNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinSession();
        });

        // If already in session, show teams list
        if (classroomState.get('sessionId')) {
            this.loadTeams();
            this.startPolling();
        }
    }

    async joinSession() {
        const sessionCode = this.elements.sessionCodeInput.value.trim().toUpperCase();
        const teamName = this.elements.teamNameInput.value.trim();

        if (!sessionCode) {
            this.showError('Please enter a session code');
            return;
        }
        if (!teamName) {
            this.showError('Please enter a team name');
            return;
        }

        this.elements.joinBtn.disabled = true;
        this.elements.joinBtn.textContent = 'Joining...';
        this.hideError();

        try {
            // Get session
            const session = await classroomAPI.getSession(sessionCode);
            if (!session) {
                this.showError('Session not found. Please check the code.');
                this.elements.joinBtn.disabled = false;
                this.elements.joinBtn.textContent = 'Join Game';
                return;
            }

            // Get or create team
            let team = await classroomAPI.getTeamByName(session.id, teamName);
            if (!team) {
                team = await classroomAPI.createTeam(session.id, teamName);
            }

            // Update state
            classroomState.update({
                sessionId: session.id,
                sessionCode: sessionCode,
                teamId: team.id,
                teamName: teamName,
                isAdmin: false
            });

            // Load teams and show game
            await this.loadTeams();
            this.startPolling();
            
            // Redirect to game page
            window.location.href = 'classroom-game.html';
        } catch (error) {
            console.error('Join session error:', error);
            this.showError('Failed to join session. Please try again.');
            this.elements.joinBtn.disabled = false;
            this.elements.joinBtn.textContent = 'Join Game';
        }
    }

    async createSession() {
        this.elements.createSessionBtn.disabled = true;
        this.elements.createSessionBtn.textContent = 'Creating...';

        try {
            // Generate session code
            const sessionCode = this.generateSessionCode();
            
            // Create session
            const session = await classroomAPI.createSession(sessionCode);

            // Update state
            classroomState.update({
                sessionId: session.id,
                sessionCode: sessionCode,
                isAdmin: true
            });

            // Show session info
            this.elements.generatedCode.textContent = sessionCode;
            this.elements.sessionInfo.style.display = 'block';
            this.elements.createSessionBtn.style.display = 'none';

            // Load teams
            await this.loadTeams();
            this.startPolling();
        } catch (error) {
            console.error('Create session error:', error);
            alert('Failed to create session. Please try again.');
            this.elements.createSessionBtn.disabled = false;
            this.elements.createSessionBtn.textContent = 'Create New Session';
        }
    }

    generateSessionCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async loadTeams() {
        const sessionId = classroomState.get('sessionId');
        if (!sessionId) return;

        try {
            const teams = await classroomAPI.getTeams(sessionId);
            classroomState.set('teams', teams || []);
            this.renderTeams(teams || []);
        } catch (error) {
            console.error('Load teams error:', error);
        }
    }

    renderTeams(teams) {
        if (teams.length === 0) {
            this.elements.teamsListCard.style.display = 'none';
            return;
        }

        this.elements.teamsListCard.style.display = 'block';
        this.elements.teamsList.innerHTML = '';

        teams.forEach(team => {
            const teamEl = document.createElement('div');
            teamEl.className = 'team-item';
            teamEl.innerHTML = `
                <span class="team-name">${this.escapeHtml(team.team_name)}</span>
                <span class="team-score">Score: ${team.score}</span>
            `;
            this.elements.teamsList.appendChild(teamEl);
        });

        // Show start button for admin
        if (classroomState.get('isAdmin')) {
            this.elements.startGameBtn.style.display = 'block';
        }
    }

    startPolling() {
        // Poll for team updates every 2 seconds
        this.pollInterval = setInterval(() => {
            this.loadTeams();
        }, 2000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    goToAdmin() {
        window.location.href = 'classroom-admin.html';
    }

    startGame() {
        window.location.href = 'classroom-admin.html';
    }

    showError(message) {
        this.elements.joinError.textContent = message;
        this.elements.joinError.style.display = 'block';
    }

    hideError() {
        this.elements.joinError.style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LobbyController();
});

