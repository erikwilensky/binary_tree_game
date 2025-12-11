// In-Class Quiz UI Controller
class InClassQuizController {
    constructor() {
        this.appSelect = document.getElementById('app-select');
        this.container = document.getElementById('in-class-quiz-app');
        this.teamNameInput = document.getElementById('quiz-team-name');
        this.answerTextarea = document.getElementById('quiz-answer');
        this.lockBtn = document.getElementById('quiz-lock-btn');
        this.resetBtn = document.getElementById('quiz-reset-btn');
        this.adminBtn = document.getElementById('quiz-admin-btn');
        this.statusDiv = document.getElementById('quiz-status');
        
        // Admin modal elements
        this.adminModal = document.getElementById('quiz-admin-modal');
        this.adminPasswordInput = document.getElementById('quiz-admin-password');
        this.adminPasswordSection = document.getElementById('quiz-admin-password-section');
        this.adminResults = document.getElementById('quiz-admin-results');
        this.adminTableContainer = document.getElementById('quiz-admin-table-container');
        this.adminSubmitBtn = document.getElementById('quiz-admin-submit-btn');
        this.adminCancelBtn = document.getElementById('quiz-admin-cancel-btn');
        this.adminCloseBtn = document.getElementById('quiz-admin-close-btn');
        
        this.storageManager = new QuizAnswerStorage();
        this.currentTeamName = '';
        this.isLocked = false;
        this.ADMIN_PASSWORD = 'gamey';
        
        this.initializeEventListeners();
        this.setupAppSwitching();
        // Ensure reset button is enabled on initialization
        if (this.resetBtn) {
            this.resetBtn.disabled = false;
        }
    }
    
    initializeEventListeners() {
        if (this.lockBtn) {
            this.lockBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.lockAnswer().catch(err => {
                    console.error('Error in lockAnswer:', err);
                    this.updateStatus('Error locking answer. Please try again.', 'error');
                });
            });
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.resetAnswer().catch(err => {
                    console.error('Error in resetAnswer:', err);
                    this.updateStatus('Error resetting answer. Please try again.', 'error');
                });
            });
        }
        
        if (this.adminBtn) {
            this.adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAdminModal();
            });
        }
        
        if (this.teamNameInput) {
            this.teamNameInput.addEventListener('input', () => this.onTeamNameChange());
        }
        
        if (this.answerTextarea) {
            this.answerTextarea.addEventListener('input', () => this.saveDraft());
        }
        
        // Admin modal event listeners
        if (this.adminSubmitBtn) {
            this.adminSubmitBtn.addEventListener('click', () => this.checkAdminPassword());
        }
        
        if (this.adminCancelBtn) {
            this.adminCancelBtn.addEventListener('click', () => this.hideAdminModal());
        }
        
        if (this.adminCloseBtn) {
            this.adminCloseBtn.addEventListener('click', () => this.hideAdminModal());
        }
        
        if (this.adminPasswordInput) {
            this.adminPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAdminPassword();
                }
            });
        }
    }
    
    setupAppSwitching() {
        // Listen for app switching to load data when quiz app is shown
        if (this.appSelect) {
            this.appSelect.addEventListener('change', () => {
                if (this.appSelect.value === 'quiz') {
                    // Load team data when quiz app is selected
                    this.loadTeamData();
                }
            });
        }
    }
    
    async loadTeamData() {
        const teamName = this.teamNameInput?.value.trim();
        if (!teamName) {
            this.updateStatus('Enter your team name to load your answer', 'info');
            return;
        }
        
        try {
            await this.storageManager.loadAnswers();
            const teamData = this.storageManager.getTeamAnswer(teamName);
            
            if (teamData) {
                if (this.answerTextarea) {
                    this.answerTextarea.value = teamData.answer || '';
                }
                this.isLocked = teamData.locked || false;
                this.updateUIState();
                this.updateStatus(`Loaded answer for ${teamName}`, 'success');
            } else {
                this.isLocked = false;
                this.updateUIState();
                this.updateStatus('Ready to submit answer', 'info');
            }
        } catch (error) {
            console.error('Error loading team data:', error);
            this.updateStatus('Error loading data. Please try again.', 'error');
        }
    }
    
    onTeamNameChange() {
        const teamName = this.teamNameInput.value.trim();
        if (teamName && teamName !== this.currentTeamName) {
            this.currentTeamName = teamName;
            this.loadTeamData();
        }
    }
    
    saveDraft() {
        // Auto-save draft to localStorage (not shared, just for convenience)
        const teamName = this.teamNameInput?.value.trim();
        if (teamName && !this.isLocked) {
            const answer = this.answerTextarea?.value || '';
            localStorage.setItem(`quiz_draft_${teamName}`, answer);
        }
    }
    
    async lockAnswer() {
        const teamName = this.teamNameInput?.value.trim();
        const answer = this.answerTextarea?.value.trim();
        
        if (!teamName) {
            this.updateStatus('Please enter a team name first', 'error');
            return;
        }
        
        if (!answer) {
            this.updateStatus('Please enter an answer before locking', 'error');
            return;
        }
        
        // Check if already locked
        await this.storageManager.loadAnswers();
        const existingData = this.storageManager.getTeamAnswer(teamName);
        if (existingData && existingData.locked) {
            this.updateStatus('This answer is already locked and cannot be modified', 'error');
            return;
        }
        
        try {
            const timestamp = new Date().toISOString();
            await this.storageManager.saveTeamAnswer(teamName, answer, true, timestamp);
            this.isLocked = true;
            this.updateUIState();
            this.updateStatus('Answer locked successfully!', 'success');
            
            // Clear draft from localStorage
            localStorage.removeItem(`quiz_draft_${teamName}`);
        } catch (error) {
            console.error('Error locking answer:', error);
            this.updateStatus('Error locking answer. Please try again.', 'error');
        }
    }
    
    async resetAnswer() {
        const teamName = this.teamNameInput?.value.trim();
        
        if (!teamName) {
            this.updateStatus('Please enter a team name first', 'error');
            return;
        }
        
        try {
            // Clear from storage
            await this.storageManager.loadAnswers();
            const teamData = this.storageManager.getTeamAnswer(teamName);
            
            // Remove from storage if exists (this also clears viewed status)
            if (teamData) {
                await this.storageManager.removeTeamAnswer(teamName);
            }
            
            // Clear textarea
            if (this.answerTextarea) {
                this.answerTextarea.value = '';
            }
            
            // Reset lock state
            this.isLocked = false;
            this.updateUIState();
            
            // Clear draft from localStorage
            localStorage.removeItem(`quiz_draft_${teamName}`);
            
            this.updateStatus('Answer cleared. You can now enter a new answer.', 'success');
        } catch (error) {
            console.error('Error resetting answer:', error);
            this.updateStatus('Error resetting answer. Please try again.', 'error');
        }
    }
    
    updateUIState() {
        // Always ensure reset button is enabled (can reset even when locked)
        if (this.resetBtn) {
            this.resetBtn.disabled = false;
        }
        
        if (this.isLocked) {
            if (this.answerTextarea) {
                this.answerTextarea.disabled = true;
                this.answerTextarea.classList.add('locked');
            }
            if (this.lockBtn) {
                this.lockBtn.disabled = true;
                this.lockBtn.textContent = 'Answer Locked';
            }
        } else {
            if (this.answerTextarea) {
                this.answerTextarea.disabled = false;
                this.answerTextarea.classList.remove('locked');
            }
            if (this.lockBtn) {
                this.lockBtn.disabled = false;
                this.lockBtn.textContent = 'Lock Answer';
            }
        }
    }
    
    updateStatus(message, type) {
        if (!this.statusDiv) return;
        
        this.statusDiv.textContent = message;
        this.statusDiv.className = `quiz-status ${type}`;
        this.statusDiv.classList.remove('hidden');
        
        // Auto-hide success/info messages after 3 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (this.statusDiv) {
                    this.statusDiv.classList.add('hidden');
                }
            }, 3000);
        }
    }
    
    showAdminModal() {
        if (this.adminModal) {
            this.adminModal.classList.remove('hidden');
            this.adminPasswordSection.classList.remove('hidden');
            this.adminResults.classList.add('hidden');
            if (this.adminPasswordInput) {
                this.adminPasswordInput.value = '';
                this.adminPasswordInput.focus();
            }
        }
    }
    
    hideAdminModal() {
        if (this.adminModal) {
            this.adminModal.classList.add('hidden');
            if (this.adminPasswordInput) {
                this.adminPasswordInput.value = '';
            }
        }
    }
    
    async checkAdminPassword() {
        const password = this.adminPasswordInput?.value.trim();
        
        if (password !== this.ADMIN_PASSWORD) {
            this.updateStatus('Incorrect password', 'error');
            if (this.adminPasswordInput) {
                this.adminPasswordInput.value = '';
                this.adminPasswordInput.focus();
            }
            return;
        }
        
        // Password correct - show all unviewed answers and mark them as viewed
        try {
            await this.storageManager.loadAnswers();
            const allAnswers = this.storageManager.getAllAnswers();
            
            // Filter to only show unviewed answers
            const unviewedAnswers = {};
            const teamsToMarkAsViewed = [];
            
            Object.keys(allAnswers).forEach(teamName => {
                const data = allAnswers[teamName];
                if (!data.viewed) {
                    unviewedAnswers[teamName] = data;
                    teamsToMarkAsViewed.push(teamName);
                }
            });
            
            // Mark answers as viewed
            for (const teamName of teamsToMarkAsViewed) {
                await this.storageManager.markAsViewed(teamName);
            }
            
            this.displayAllAnswers(unviewedAnswers);
            
            this.adminPasswordSection.classList.add('hidden');
            this.adminResults.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading answers:', error);
            this.updateStatus('Error loading answers. Please try again.', 'error');
        }
    }
    
    displayAllAnswers(allAnswers) {
        if (!this.adminTableContainer) return;
        
        const teams = Object.keys(allAnswers).sort();
        
        if (teams.length === 0) {
            this.adminTableContainer.innerHTML = '<p>No new team answers to view. All answers have already been viewed.</p>';
            return;
        }
        
        let html = '<table class="quiz-admin-table"><thead><tr>';
        html += '<th>Team Name</th>';
        html += '<th>Answer</th>';
        html += '<th>Status</th>';
        html += '<th>Timestamp</th>';
        html += '</tr></thead><tbody>';
        
        teams.forEach(teamName => {
            const data = allAnswers[teamName];
            const status = data.locked ? '<span class="status-locked">Locked</span>' : '<span class="status-unlocked">Unlocked</span>';
            const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A';
            
            html += '<tr>';
            html += `<td><strong>${this.escapeHtml(teamName)}</strong></td>`;
            html += `<td>${this.escapeHtml(data.answer || 'No answer')}</td>`;
            html += `<td>${status}</td>`;
            html += `<td>${timestamp}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        this.adminTableContainer.innerHTML = html;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Quiz Answer Storage Manager - Uses JSONBin.io for shared storage
class QuizAnswerStorage {
    constructor() {
        // Using a different bin ID for quiz answers
        // You can create a new bin at jsonbin.io or reuse the existing one
        this.binId = '692e87fad0ea881f400d3443'; // Same bin as high scores, but different structure
        this.apiKey = '$2a$10$ZZEnotrxZWf4OAffHwnXFen5GewLcBIqreyPOs4/eVuUUvuINk55u';
        this.answers = {};
    }
    
    async loadAnswers() {
        try {
            const url = `https://api.jsonbin.io/v3/b/${this.binId}/latest`;
            const response = await fetch(url, {
                headers: {
                    'X-Access-Key': this.apiKey
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                const record = data.record || {};
                // Check if quizAnswers exists, otherwise use the whole record
                this.answers = record.quizAnswers || {};
                localStorage.setItem('inClassQuizAnswers', JSON.stringify(this.answers));
                console.log('Loaded quiz answers from JSONBin');
            } else {
                // Fallback to localStorage
                const errorText = await response.text();
                console.warn(`Cannot load from JSONBin (${response.status}):`, errorText);
                const stored = localStorage.getItem('inClassQuizAnswers');
                this.answers = stored ? JSON.parse(stored) : {};
            }
        } catch (error) {
            console.error('Failed to load quiz answers:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('inClassQuizAnswers');
            this.answers = stored ? JSON.parse(stored) : {};
        }
    }
    
    async saveAnswers() {
        localStorage.setItem('inClassQuizAnswers', JSON.stringify(this.answers));
        
        try {
            // First, load the existing record to preserve other data (like high scores)
            const url = `https://api.jsonbin.io/v3/b/${this.binId}/latest`;
            const loadResponse = await fetch(url, {
                headers: {
                    'X-Access-Key': this.apiKey
                },
                cache: 'no-cache'
            });
            
            let fullRecord = {};
            if (loadResponse.ok) {
                const data = await loadResponse.json();
                fullRecord = data.record || {};
            }
            
            // Merge quiz answers into the record
            fullRecord.quizAnswers = this.answers;
            
            // Save the merged record
            const saveUrl = `https://api.jsonbin.io/v3/b/${this.binId}`;
            const saveResponse = await fetch(saveUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key': this.apiKey
                },
                body: JSON.stringify(fullRecord)
            });
            
            if (saveResponse.ok) {
                console.log('Successfully saved quiz answers to JSONBin!');
            } else {
                const errorText = await saveResponse.text();
                console.error('Failed to save to JSONBin:', saveResponse.status, errorText);
            }
        } catch (error) {
            console.error('Error saving to JSONBin:', error);
        }
    }
    
    async saveTeamAnswer(teamName, answer, locked, timestamp) {
        // Preserve viewed status if it exists
        const existing = this.answers[teamName] || {};
        this.answers[teamName] = {
            answer: answer,
            locked: locked,
            timestamp: timestamp,
            viewed: existing.viewed || false
        };
        await this.saveAnswers();
    }
    
    async markAsViewed(teamName) {
        if (this.answers[teamName]) {
            this.answers[teamName].viewed = true;
            await this.saveAnswers();
        }
    }
    
    async removeTeamAnswer(teamName) {
        if (this.answers[teamName]) {
            delete this.answers[teamName];
            await this.saveAnswers();
        }
    }
    
    getTeamAnswer(teamName) {
        return this.answers[teamName] || null;
    }
    
    getAllAnswers() {
        return this.answers;
    }
}

// Initialize In-Class Quiz UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InClassQuizController();
});

