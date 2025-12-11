// DOM rendering and event handlers utility
class UIManager {
    constructor() {
        this.notifications = [];
    }

    // Render team list
    renderTeamList(teams, container) {
        if (!container) return;

        container.innerHTML = '';

        if (!teams || teams.length === 0) {
            container.innerHTML = '<p class="no-teams">No teams yet</p>';
            return;
        }

        teams.forEach(team => {
            const teamEl = document.createElement('div');
            teamEl.className = 'team-item';
            teamEl.innerHTML = `
                <span class="team-name">${this.escapeHtml(team.team_name)}</span>
                <span class="team-score">Score: ${team.score}</span>
            `;
            container.appendChild(teamEl);
        });
    }

    // Render question
    renderQuestion(question, container) {
        if (!container) return;

        if (!question) {
            container.textContent = 'Waiting for question...';
            return;
        }

        container.textContent = question.text;
    }

    // Render timer
    renderTimer(seconds, limit, textElement, progressElement) {
        if (textElement) {
            textElement.textContent = this.formatTime(seconds);
        }

        if (progressElement) {
            const progress = limit > 0 ? seconds / limit : 0;
            progressElement.style.width = `${progress * 100}%`;
            
            // Update color
            progressElement.className = 'timer-progress';
            if (progress > 0.5) {
                progressElement.classList.add('green');
            } else if (progress > 0.25) {
                progressElement.classList.add('yellow');
            } else {
                progressElement.classList.add('red');
            }
        }
    }

    // Render powerups
    renderPowerups(powerups, container, onUse) {
        if (!container) return;

        container.innerHTML = '';

        if (!powerups || powerups.length === 0) {
            container.innerHTML = '<p class="no-powerups">No powerups</p>';
            return;
        }

        powerups.forEach((powerupType, index) => {
            const powerupEl = document.createElement('div');
            powerupEl.className = 'powerup-item';
            powerupEl.innerHTML = `
                <span class="powerup-name">${this.getPowerupName(powerupType)}</span>
                <button class="btn btn-small use-powerup-btn" data-index="${index}">
                    Use
                </button>
            `;
            
            const useBtn = powerupEl.querySelector('.use-powerup-btn');
            if (useBtn && onUse) {
                useBtn.addEventListener('click', () => onUse(powerupType, index));
            }
            
            container.appendChild(powerupEl);
        });
    }

    // Render answer field
    renderAnswerField(answer, inputElement) {
        if (!inputElement) return;

        if (answer) {
            inputElement.value = answer.answer || '';
            inputElement.disabled = answer.locked || false;
        } else {
            inputElement.value = '';
            inputElement.disabled = false;
        }
    }

    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        this.notifications.push(notification);
    }

    // Format time as MM:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Get powerup name
    getPowerupName(powerupType) {
        const names = {
            'random_chars': 'Random Characters',
            'score_bash': 'Score Bash',
            'roll_dice': 'Roll the Dice'
        };
        return names[powerupType] || powerupType;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show loading state
    showLoading(element, message = 'Loading...') {
        if (element) {
            element.innerHTML = `<div class="loading">${message}</div>`;
        }
    }

    // Hide loading state
    hideLoading(element) {
        if (element && element.querySelector('.loading')) {
            element.querySelector('.loading').remove();
        }
    }
}

// Export singleton instance
const uiManager = new UIManager();

