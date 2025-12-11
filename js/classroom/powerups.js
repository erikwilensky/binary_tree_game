// Powerup engine with realtime effects
class PowerupEngine {
    constructor() {
        this.powerupTypes = ['random_chars', 'score_bash', 'roll_dice', 'early_lock', 'edit_name'];
    }

    // Buy a powerup (costs 25% of team modifier, minimum 1)
    async buyPowerup(teamId) {
        try {
            const team = await classroomAPI.getTeam(teamId);
            if (!team) throw new Error('Team not found');

            const cost = Math.max(1, Math.floor(Math.abs(team.score) * 0.25));
            if (team.score < cost) {
                throw new Error('Not enough modifier points to buy powerup');
            }

            // Deduct cost
            await classroomAPI.updateTeamScore(teamId, -cost);

            // Add random powerup
            const powerupType = this.powerupTypes[Math.floor(Math.random() * this.powerupTypes.length)];
            const powerups = team.powerups || [];
            powerups.push(powerupType);

            await classroomAPI.updateTeam(teamId, { powerups });

            return powerupType;
        } catch (error) {
            console.error('Buy powerup error:', error);
            throw error;
        }
    }

    // Use a powerup
    async usePowerup(powerupType, teamId, targetTeamId = null) {
        const sessionId = classroomState.get('sessionId');
        if (!sessionId) throw new Error('Not in a session');

        let payload = {};
        let result = null;

        switch (powerupType) {
            case 'random_chars':
                result = await this.handleRandomChars(sessionId, teamId, targetTeamId);
                payload = { targetTeamId, injectedChars: result.injectedChars };
                break;
            case 'score_bash':
                result = await this.handleScoreBash(sessionId, teamId, targetTeamId);
                payload = { targetTeamId, scoreReduction: result.scoreReduction };
                break;
            case 'roll_dice':
                result = await this.handleRollDice(sessionId, teamId);
                payload = { scoreChange: result.scoreChange, success: result.success };
                break;
            case 'early_lock':
                result = await this.handleEarlyLock(sessionId, teamId, targetTeamId);
                payload = { targetTeamId, lockedAt: result.lockedAt };
                break;
            case 'edit_name':
                result = await this.handleEditTeamName(sessionId, teamId, targetTeamId);
                payload = { targetTeamId, newName: result.newName, editorName: result.editorName };
                break;
            default:
                throw new Error(`Unknown powerup type: ${powerupType}`);
        }

        // Create powerup event
        await classroomAPI.createPowerupEvent(sessionId, teamId, powerupType, targetTeamId, payload);

        // Remove powerup from inventory
        const team = await classroomAPI.getTeam(teamId);
        if (team && team.powerups) {
            const powerups = team.powerups.filter(p => p !== powerupType);
            await classroomAPI.updateTeam(teamId, { powerups });
        }

        return result;
    }

    // Random Characters powerup - inject random chars into target's answer
    async handleRandomChars(sessionId, teamId, targetTeamId) {
        if (!targetTeamId) throw new Error('Target team required for random_chars');

        const question = classroomState.get('currentQuestion');
        if (!question) throw new Error('No active question');

        // Get or create target team's answer
        let answer = await classroomAPI.getAnswer(sessionId, question.id, targetTeamId);
        if (!answer) {
            // Create answer if it doesn't exist
            answer = await classroomAPI.createAnswer(sessionId, question.id, targetTeamId, '');
        }

        // Generate random characters to inject
        const randomChars = this.generateRandomChars(3);
        const newAnswer = (answer.answer || '') + randomChars;

        // Update answer
        await classroomAPI.updateAnswer(answer.id, { answer: newAnswer });

        return { injectedChars: randomChars };
    }

    // Score Bash powerup - reduce target team's modifier by 10% (minimum 1)
    async handleScoreBash(sessionId, teamId, targetTeamId) {
        if (!targetTeamId) throw new Error('Target team required for score_bash');

        const targetTeam = await classroomAPI.getTeam(targetTeamId);
        if (!targetTeam) throw new Error('Target team not found');

        const reduction = Math.max(1, Math.floor(Math.abs(targetTeam.score) * 0.1));
        await classroomAPI.updateTeamScore(targetTeamId, -reduction);

        return { scoreReduction: reduction };
    }

    // Roll the Dice powerup - 50% chance +20% modifier, 50% chance -10% modifier
    async handleRollDice(sessionId, teamId) {
        const team = await classroomAPI.getTeam(teamId);
        if (!team) throw new Error('Team not found');

        const success = Math.random() < 0.5;
        let scoreChange;

        if (success) {
            // +20% of current modifier (minimum +1)
            scoreChange = Math.max(1, Math.floor(Math.abs(team.score) * 0.2));
            await classroomAPI.updateTeamScore(teamId, scoreChange);
        } else {
            // -10% of current modifier (minimum -1)
            scoreChange = -Math.max(1, Math.floor(Math.abs(team.score) * 0.1));
            await classroomAPI.updateTeamScore(teamId, scoreChange);
        }

        return { scoreChange, success };
    }

    // Generate random characters
    generateRandomChars(count) {
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let result = '';
        for (let i = 0; i < count; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Early Lock powerup - locks target team's answer 30 seconds before time is up
    async handleEarlyLock(sessionId, teamId, targetTeamId) {
        if (!targetTeamId) throw new Error('Target team required for early_lock');

        const question = classroomState.get('currentQuestion');
        if (!question) throw new Error('No active question');

        // Get target team's answer
        let answer = await classroomAPI.getAnswer(sessionId, question.id, targetTeamId);
        if (!answer) {
            answer = await classroomAPI.createAnswer(sessionId, question.id, targetTeamId, '');
        }

        // Check if answer is already locked
        if (answer.locked) {
            throw new Error('Target team\'s answer is already locked');
        }

        // Check if we're within 30 seconds of the end
        const now = new Date();
        const started = new Date(question.started_at);
        const elapsed = Math.floor((now - started) / 1000);
        const remaining = question.time_limit_seconds - elapsed;

        if (remaining <= 30) {
            // Lock the answer immediately
            await classroomAPI.lockAnswer(answer.id);
            
            // Trigger event for visual feedback
            realtimeManager.triggerEvent('earlyLockReceived', {
                type: 'early_lock',
                targetTeamId: targetTeamId
            });

            return { lockedAt: new Date().toISOString(), immediate: true };
        } else {
            // Schedule lock for 30 seconds before end
            const lockTime = question.time_limit_seconds - 30;
            const lockDelay = (lockTime - elapsed) * 1000;

            setTimeout(async () => {
                try {
                    const currentAnswer = await classroomAPI.getAnswer(sessionId, question.id, targetTeamId);
                    if (currentAnswer && !currentAnswer.locked) {
                        await classroomAPI.lockAnswer(currentAnswer.id);
                        
                        // Trigger event for visual feedback
                        realtimeManager.triggerEvent('earlyLockReceived', {
                            type: 'early_lock',
                            targetTeamId: targetTeamId
                        });
                    }
                } catch (error) {
                    console.error('Error executing early lock:', error);
                }
            }, lockDelay);

            return { lockedAt: new Date(Date.now() + lockDelay).toISOString(), immediate: false };
        }
    }

    // Edit Team Name powerup - allows editing another team's name with accountability
    async handleEditTeamName(sessionId, teamId, targetTeamId) {
        if (!targetTeamId) throw new Error('Target team required for edit_name');

        const editingTeam = await classroomAPI.getTeam(teamId);
        if (!editingTeam) throw new Error('Editing team not found');

        const targetTeam = await classroomAPI.getTeam(targetTeamId);
        if (!targetTeam) throw new Error('Target team not found');

        // Check if name already has "edited by" suffix - if so, remove it first
        let baseName = targetTeam.team_name;
        const editedByMatch = baseName.match(/^(.+?)\s*\(edited by .+?\)$/);
        if (editedByMatch) {
            baseName = editedByMatch[1].trim();
        }

        // Prompt for new name
        const newName = prompt(`Enter new name for "${baseName}":`, baseName);
        
        if (!newName || newName.trim() === '') {
            throw new Error('Name cannot be empty');
        }

        // Create new name with accountability
        const editedName = `${newName.trim()} (edited by ${editingTeam.team_name})`;

        // Update team name
        await classroomAPI.updateTeam(targetTeamId, { team_name: editedName });

        return { newName: editedName, editorName: editingTeam.team_name, originalName: baseName };
    }

    // Get powerup display name
    getPowerupName(powerupType) {
        const names = {
            'random_chars': 'Random Characters',
            'score_bash': 'Score Bash',
            'roll_dice': 'Roll the Dice',
            'early_lock': 'Early Lock',
            'edit_name': 'Edit Team Name'
        };
        return names[powerupType] || powerupType;
    }

    // Get powerup description
    getPowerupDescription(powerupType) {
        const descriptions = {
            'random_chars': 'Inject random characters into target team\'s answer',
            'score_bash': 'Reduce target team\'s modifier by 10%',
            'roll_dice': '50% chance: +20% modifier, 50% chance: -10% modifier',
            'early_lock': 'Lock target team\'s answer 30 seconds before time ends',
            'edit_name': 'Edit another team\'s name (shows who edited it)'
        };
        return descriptions[powerupType] || '';
    }
}

// Export singleton instance
const powerupEngine = new PowerupEngine();

