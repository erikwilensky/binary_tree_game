// In-Class Quiz UI Controller
class InClassQuizController {
    constructor() {
        this.appSelect = document.getElementById('app-select');
        this.container = document.getElementById('in-class-quiz-app');
        this.teamNameInput = document.getElementById('quiz-team-name');
        this.answerTextarea = document.getElementById('quiz-answer');
        this.lockBtn = document.getElementById('quiz-lock-btn');
        this.resetBtn = document.getElementById('quiz-reset-btn');
        this.statusDiv = document.getElementById('quiz-status');
        
        // Admin panel elements
        this.adminTableContainer = document.getElementById('quiz-admin-table-container');
        this.admin1Btn = document.getElementById('quiz-admin-1-btn');
        this.admin2Btn = document.getElementById('quiz-admin-2-btn');
        this.adminRefreshBtn = document.getElementById('quiz-admin-refresh-btn');
        
        this.storageManager = new QuizAnswerStorage();
        this.currentTeamName = '';
        this.isLocked = false;
        this.isProcessing = false; // Prevent multiple simultaneous operations
        this.adminActivated = false; // Track if Admin 1 has been pressed
        this.answersLoaded = false; // Track if answers have been loaded
        
        this.initializeEventListeners();
        this.setupAppSwitching();
        this.initializeUI();
    }
    
    initializeUI() {
        // Ensure buttons are enabled
        if (this.resetBtn) {
            this.resetBtn.disabled = false;
        }
        if (this.lockBtn) {
            this.lockBtn.disabled = false;
        }
        if (this.answerTextarea) {
            this.answerTextarea.disabled = false;
        }
        
        // Initialize admin buttons state
        this.updateAdminButtons();
    }
    
    initializeEventListeners() {
        if (this.lockBtn) {
            this.lockBtn.addEventListener('click', () => {
                if (!this.isProcessing) {
                    this.handleLockAnswer();
                }
            });
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                if (!this.isProcessing) {
                    this.handleResetAnswer();
                }
            });
        }
        
        if (this.teamNameInput) {
            this.teamNameInput.addEventListener('input', () => {
                this.onTeamNameChange();
            });
        }
        
        if (this.answerTextarea) {
            this.answerTextarea.addEventListener('input', () => {
                this.saveDraft();
            });
        }
        
        if (this.admin1Btn) {
            this.admin1Btn.addEventListener('click', () => {
                this.activateAdmin1();
            });
        }
        
        if (this.admin2Btn) {
            this.admin2Btn.addEventListener('click', () => {
                if (this.adminActivated) {
                    this.loadAdminPanel();
                }
            });
        }
        
        if (this.adminRefreshBtn) {
            this.adminRefreshBtn.addEventListener('click', () => {
                if (this.adminActivated) {
                    this.loadAdminPanel();
                }
            });
        }
    }
    
    setupAppSwitching() {
        if (this.appSelect) {
            this.appSelect.addEventListener('change', () => {
                if (this.appSelect.value === 'quiz') {
                    this.loadTeamData();
                    // Reset admin state when switching to quiz
                    this.adminActivated = false;
                    this.answersLoaded = false;
                    this.updateAdminButtons();
                    if (this.adminTableContainer) {
                        this.adminTableContainer.innerHTML = '';
                    }
                }
            });
        }
    }
    
    async loadTeamData() {
        const teamName = this.teamNameInput?.value.trim();
        if (!teamName) {
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
            } else {
                this.isLocked = false;
                this.updateUIState();
            }
        } catch (error) {
            console.error('Error loading team data:', error);
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
        const teamName = this.teamNameInput?.value.trim();
        if (teamName && !this.isLocked && this.answerTextarea) {
            const answer = this.answerTextarea.value || '';
            localStorage.setItem(`quiz_draft_${teamName}`, answer);
        }
    }
    
    handleLockAnswer() {
        if (this.isProcessing) {
            console.log('Already processing, ignoring click');
            return;
        }
        
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
        
        if (this.isLocked) {
            this.updateStatus('This answer is already locked', 'error');
            return;
        }
        
        this.isProcessing = true;
        
        // Update UI immediately
        this.isLocked = true;
        this.updateUIState();
        this.updateStatus('Answer locked successfully!', 'success');
        localStorage.removeItem(`quiz_draft_${teamName}`);
        
        // Save in background
        const timestamp = new Date().toISOString();
        this.storageManager.saveTeamAnswer(teamName, answer, true, timestamp)
            .then(() => {
                this.isProcessing = false;
                this.updateUIState(); // Update button states
                // Only refresh admin panel if Admin 2 is activated
                if (this.adminActivated) {
                    this.loadAdminPanel();
                }
            })
            .catch(error => {
                console.error('Error saving locked answer:', error);
                this.isLocked = false;
                this.isProcessing = false;
                this.updateUIState();
                this.updateStatus('Error saving answer. Please try again.', 'error');
            });
    }
    
    handleResetAnswer() {
        if (this.isProcessing) return;
        
        const teamName = this.teamNameInput?.value.trim();
        
        if (!teamName) {
            this.updateStatus('Please enter a team name first', 'error');
            return;
        }
        
        this.isProcessing = true;
        this.resetBtn.disabled = true;
        
        // Update UI immediately
        if (this.answerTextarea) {
            this.answerTextarea.value = '';
        }
        this.isLocked = false;
        this.updateUIState();
        localStorage.removeItem(`quiz_draft_${teamName}`);
        this.updateStatus('Answer cleared. You can now enter a new answer.', 'success');
        
        // Remove from storage in background
        this.storageManager.loadAnswers()
            .then(() => {
                const teamData = this.storageManager.getTeamAnswer(teamName);
                if (teamData) {
                    return this.storageManager.removeTeamAnswer(teamName);
                }
            })
            .then(() => {
                this.isProcessing = false;
                // Only refresh admin panel if Admin 2 is activated
                if (this.adminActivated) {
                    this.loadAdminPanel();
                }
            })
            .catch(error => {
                console.error('Error removing answer from storage:', error);
                this.isProcessing = false;
            });
    }
    
    updateUIState() {
        if (this.resetBtn) {
            this.resetBtn.disabled = this.isProcessing;
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
                this.lockBtn.disabled = !this.isProcessing;
                this.lockBtn.textContent = 'Lock Answer';
            }
        }
    }
    
    updateStatus(message, type) {
        if (!this.statusDiv) return;
        
        this.statusDiv.textContent = message;
        this.statusDiv.className = `quiz-status ${type}`;
        this.statusDiv.classList.remove('hidden');
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (this.statusDiv) {
                    this.statusDiv.classList.add('hidden');
                }
            }, 3000);
        }
    }
    
    async loadAdminPanel() {
        if (!this.adminTableContainer) return;
        
        // Show loading state
        this.adminTableContainer.innerHTML = '<p>Loading...</p>';
        
        try {
            await this.storageManager.loadAnswers();
            const allAnswers = this.storageManager.getAllAnswers();
            
            // Convert to array and sort by timestamp (newest first)
            const answersArray = Object.keys(allAnswers)
                .map(teamName => ({
                    teamName: teamName,
                    ...allAnswers[teamName]
                }))
                .filter(item => item.timestamp);
            
            // Sort by timestamp descending
            answersArray.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return timeB - timeA;
            });
            
            // Get top 5
            const top5Answers = answersArray.slice(0, 5);
            
            if (top5Answers.length === 0) {
                this.adminTableContainer.innerHTML = '<p>No answers submitted yet.</p>';
                this.answersLoaded = true; // Still mark as loaded even if empty
                this.updateAdminButtons();
                return;
            }
            
            let html = '<table class="quiz-admin-table"><thead><tr>';
            html += '<th>Team Name</th>';
            html += '<th>Answer</th>';
            html += '<th>Status</th>';
            html += '<th>Timestamp</th>';
            html += '</tr></thead><tbody>';
            
            top5Answers.forEach(item => {
                const status = item.locked 
                    ? '<span class="status-locked">Locked</span>' 
                    : '<span class="status-unlocked">Unlocked</span>';
                const timestamp = item.timestamp 
                    ? new Date(item.timestamp).toLocaleString() 
                    : 'N/A';
                
                html += '<tr>';
                html += `<td><strong>${this.escapeHtml(item.teamName)}</strong></td>`;
                html += `<td>${this.escapeHtml(item.answer || 'No answer')}</td>`;
                html += `<td>${status}</td>`;
                html += `<td>${timestamp}</td>`;
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            this.adminTableContainer.innerHTML = html;
            this.answersLoaded = true;
            
            // Show refresh button after answers are loaded
            this.updateAdminButtons();
        } catch (error) {
            console.error('Error loading admin panel:', error);
            this.adminTableContainer.innerHTML = '<p>Error loading answers. Please try again.</p>';
            this.updateAdminButtons();
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    activateAdmin1() {
        this.adminActivated = true;
        this.updateAdminButtons();
        this.updateStatus('Admin 1 activated. Press Admin 2 to view answers.', 'success');
    }
    
    updateAdminButtons() {
        if (this.admin1Btn) {
            this.admin1Btn.disabled = this.adminActivated;
        }
        if (this.admin2Btn) {
            this.admin2Btn.disabled = !this.adminActivated;
        }
        // Refresh button is shown and enabled after Admin 2 is pressed and answers are loaded
        if (this.adminRefreshBtn) {
            if (this.adminActivated && this.answersLoaded) {
                this.adminRefreshBtn.style.display = 'inline-block';
                this.adminRefreshBtn.disabled = false;
            } else {
                this.adminRefreshBtn.style.display = 'none';
                this.adminRefreshBtn.disabled = true;
            }
        }
    }
}

// Quiz Answer Storage Manager - Uses Supabase REST API directly
class QuizAnswerStorage {
    constructor() {
        // Get Supabase config from config.js or use defaults
        this.supabaseUrl = (typeof config !== 'undefined' && config.SUPABASE_URL) || 
                          window.SUPABASE_URL || 
                          'https://zihmxkuwkyqcwqrjbgoo.supabase.co';
        this.supabaseKey = (typeof config !== 'undefined' && config.SUPABASE_KEY) || 
                          window.SUPABASE_KEY || 
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaG14a3V3a3lxY3dxcmpiZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTYzMDcsImV4cCI6MjA4MTAzMjMwN30.RyR5KRDAfL29rQGJ5V2fl6Dr0FyLJhyPUPeymCN8TV8';
        this.answers = {};
        this.loadPromise = null; // Cache load promise to prevent multiple simultaneous loads
    }
    
    async loadAnswers() {
        // If already loading, return the existing promise
        if (this.loadPromise) {
            return this.loadPromise;
        }
        
        this.loadPromise = this._doLoadAnswers();
        
        try {
            await this.loadPromise;
        } finally {
            this.loadPromise = null;
        }
    }
    
    async _doLoadAnswers() {
        try {
            // Try localStorage first for speed
            const stored = localStorage.getItem('inClassQuizAnswers');
            if (stored) {
                this.answers = JSON.parse(stored);
            }
            
            // Then try to sync from Supabase
            const url = `${this.supabaseUrl}/rest/v1/quiz_answers?select=*`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, {
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`
                },
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                // Convert array to object format
                this.answers = {};
                data.forEach(row => {
                    this.answers[row.team_name] = {
                        answer: row.answer,
                        locked: row.locked,
                        timestamp: row.timestamp
                    };
                });
                localStorage.setItem('inClassQuizAnswers', JSON.stringify(this.answers));
                console.log('Loaded quiz answers from Supabase');
            }
        } catch (error) {
            console.warn('Failed to load from Supabase, using localStorage:', error);
            // Use localStorage fallback
            const stored = localStorage.getItem('inClassQuizAnswers');
            if (stored) {
                this.answers = JSON.parse(stored);
            }
        }
    }
    
    async saveAnswers() {
        // Save to localStorage immediately
        localStorage.setItem('inClassQuizAnswers', JSON.stringify(this.answers));
        
        // Save to Supabase in background (don't await)
        this._saveToSupabase().catch(error => {
            console.error('Error saving to Supabase:', error);
        });
    }
    
    async _saveToSupabase() {
        // Save each team answer individually
        const savePromises = Object.keys(this.answers).map(teamName => {
            const answerData = this.answers[teamName];
            return this._saveTeamAnswerToSupabase(teamName, answerData.answer, answerData.locked, answerData.timestamp);
        });
        
        try {
            await Promise.all(savePromises);
            console.log('Successfully saved quiz answers to Supabase!');
        } catch (error) {
            console.error('Error saving quiz answers to Supabase:', error);
            throw error;
        }
    }
    
    async _saveTeamAnswerToSupabase(teamName, answer, locked, timestamp) {
        // Check if record exists
        const checkUrl = `${this.supabaseUrl}/rest/v1/quiz_answers?team_name=eq.${encodeURIComponent(teamName)}&select=id&limit=1`;
        const checkResponse = await fetch(checkUrl, {
            headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`
            }
        });
        
        const exists = checkResponse.ok && (await checkResponse.json()).length > 0;
        const method = exists ? 'PATCH' : 'POST';
        const filter = exists ? `?team_name=eq.${encodeURIComponent(teamName)}` : '';
        
        const body = {
            team_name: teamName,
            answer: answer,
            locked: locked || false,
            timestamp: timestamp || new Date().toISOString()
        };
        
        const url = `${this.supabaseUrl}/rest/v1/quiz_answers${filter}`;
        const response = await fetch(url, {
            method: method,
            headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save: ${response.status} ${errorText}`);
        }
    }
    
    async saveTeamAnswer(teamName, answer, locked, timestamp) {
        this.answers[teamName] = {
            answer: answer,
            locked: locked || false,
            timestamp: timestamp || new Date().toISOString()
        };
        
        // Save to localStorage immediately
        localStorage.setItem('inClassQuizAnswers', JSON.stringify(this.answers));
        
        // Save to Supabase
        try {
            await this._saveTeamAnswerToSupabase(teamName, answer, locked, timestamp);
            console.log(`Successfully saved answer for ${teamName}`);
        } catch (error) {
            console.error('Error saving team answer:', error);
        }
    }
    
    async removeTeamAnswer(teamName) {
        if (this.answers[teamName]) {
            delete this.answers[teamName];
            localStorage.setItem('inClassQuizAnswers', JSON.stringify(this.answers));
            
            // Delete from Supabase
            try {
                const url = `${this.supabaseUrl}/rest/v1/quiz_answers?team_name=eq.${encodeURIComponent(teamName)}`;
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                });
                
                if (response.ok) {
                    console.log(`Successfully removed answer for ${teamName}`);
                } else {
                    console.error('Failed to remove team answer:', response.status);
                }
            } catch (error) {
                console.error('Error removing team answer:', error);
            }
        }
    }
    
    getTeamAnswer(teamName) {
        return this.answers[teamName] || null;
    }
    
    getAllAnswers() {
        return this.answers;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InClassQuizController();
});
