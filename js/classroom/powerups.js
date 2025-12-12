// Powerup engine with realtime effects
class PowerupEngine {
    constructor() {
        this.powerupTypes = ['random_chars', 'score_bash', 'roll_dice', 'early_lock', 'hard_to_read'];
        // Track active random char injection intervals
        // Key: `${sessionId}_${questionId}_${targetTeamId}`, Value: intervalId
        this.randomCharIntervals = new Map();
    }

    // Buy a powerup (costs 3 points)
    async buyPowerup(teamId, powerupType) {
        try {
            if (!powerupType) {
                throw new Error('Powerup type is required');
            }

            if (!this.powerupTypes.includes(powerupType)) {
                throw new Error(`Invalid powerup type: ${powerupType}`);
            }

            const team = await classroomAPI.getTeam(teamId);
            if (!team) throw new Error('Team not found');

            const cost = 3;
            if (team.score < cost) {
                throw new Error('Not enough modifier points to buy powerup (need 3 points)');
            }

            // Deduct cost
            await classroomAPI.updateTeamScore(teamId, -cost);

            // Add selected powerup
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
            case 'hard_to_read':
                result = await this.handleHardToRead(sessionId, teamId, targetTeamId);
                payload = { targetTeamId, forcedTheme: result.forcedTheme };
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

    // Random Characters powerup - inject random chars into target's answer every 10 seconds
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

        // Check if answer is already locked - if so, don't start injection
        if (answer.locked) {
            throw new Error('Target team\'s answer is already locked');
        }

        // Stop any existing interval for this target
        const intervalKey = `${sessionId}_${question.id}_${targetTeamId}`;
        this.stopRandomCharInjection(intervalKey);

        // Inject immediately
        const randomChars = this.generateRandomChars(3);
        const newAnswer = (answer.answer || '') + randomChars;
        await classroomAPI.updateAnswer(answer.id, { answer: newAnswer });

        // Start interval to inject every 10 seconds
        const intervalId = setInterval(async () => {
            try {
                // Check if question is still active
                const currentQuestion = classroomState.get('currentQuestion');
                if (!currentQuestion || currentQuestion.id !== question.id || !currentQuestion.is_active) {
                    this.stopRandomCharInjection(intervalKey);
                    return;
                }

                // Get current answer and check if locked
                const currentAnswer = await classroomAPI.getAnswer(sessionId, question.id, targetTeamId);
                if (!currentAnswer || currentAnswer.locked) {
                    this.stopRandomCharInjection(intervalKey);
                    return;
                }

                // Inject more random characters
                const chars = this.generateRandomChars(3);
                const updatedAnswer = (currentAnswer.answer || '') + chars;
                await classroomAPI.updateAnswer(currentAnswer.id, { answer: updatedAnswer });
            } catch (error) {
                console.error('Error in random char injection interval:', error);
                // Stop interval on error
                this.stopRandomCharInjection(intervalKey);
            }
        }, 10000); // Every 10 seconds

        // Store interval
        this.randomCharIntervals.set(intervalKey, intervalId);

        return { injectedChars: randomChars, continuous: true };
    }

    // Stop random char injection for a specific target
    stopRandomCharInjection(intervalKey) {
        const intervalId = this.randomCharIntervals.get(intervalKey);
        if (intervalId) {
            clearInterval(intervalId);
            this.randomCharIntervals.delete(intervalKey);
        }
    }

    // Stop all random char injections (called when question ends)
    stopAllRandomCharInjections() {
        this.randomCharIntervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.randomCharIntervals.clear();
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

    // Hard to Read powerup - forces target team to use a hard-to-read theme
    async handleHardToRead(sessionId, teamId, targetTeamId) {
        if (!targetTeamId) throw new Error('Target team required for hard_to_read');

        const targetTeam = await classroomAPI.getTeam(targetTeamId);
        if (!targetTeam) throw new Error('Target team not found');

        // Force the hard-to-read theme on the target team
        await classroomAPI.updateTeam(targetTeamId, { forced_theme: 'hardtoread' });

        // Trigger event for visual feedback on target team's device
        realtimeManager.triggerEvent('themeForced', {
            type: 'hard_to_read',
            targetTeamId: targetTeamId,
            forcedTheme: 'hardtoread'
        });

        return { forcedTheme: 'hardtoread' };
    }

    // Get powerup display name
    getPowerupName(powerupType) {
        const names = {
            'random_chars': 'Random Characters',
            'score_bash': 'Score Bash',
            'roll_dice': 'Roll the Dice',
            'early_lock': 'Early Lock',
            'hard_to_read': 'Hard to Read'
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
            'hard_to_read': 'Force target team to use a hard-to-read theme'
        };
        return descriptions[powerupType] || '';
    }
}

// Export singleton instance
const powerupEngine = new PowerupEngine();

// Expose globally for realtime manager to access
window.powerupEngine = powerupEngine;

