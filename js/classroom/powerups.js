// Powerup engine with realtime effects
class PowerupEngine {
    constructor() {
        this.powerupTypes = ['random_chars', 'score_bash', 'roll_dice'];
    }

    // Buy a powerup (costs 25% of team score)
    async buyPowerup(teamId) {
        try {
            const team = await classroomAPI.getTeam(teamId);
            if (!team) throw new Error('Team not found');

            const cost = Math.floor(team.score * 0.25);
            if (cost <= 0 || team.score < cost) {
                throw new Error('Not enough score to buy powerup');
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

        // Get target team's answer
        const answer = await classroomAPI.getAnswer(sessionId, question.id, targetTeamId);
        if (!answer) throw new Error('Target team has no answer');

        // Generate random characters to inject
        const randomChars = this.generateRandomChars(3);
        const newAnswer = answer.answer + randomChars;

        // Update answer
        await classroomAPI.updateAnswer(answer.id, { answer: newAnswer });

        return { injectedChars: randomChars };
    }

    // Score Bash powerup - reduce target team's score by 10%
    async handleScoreBash(sessionId, teamId, targetTeamId) {
        if (!targetTeamId) throw new Error('Target team required for score_bash');

        const targetTeam = await classroomAPI.getTeam(targetTeamId);
        if (!targetTeam) throw new Error('Target team not found');

        const reduction = Math.floor(targetTeam.score * 0.1);
        await classroomAPI.updateTeamScore(targetTeamId, -reduction);

        return { scoreReduction: reduction };
    }

    // Roll the Dice powerup - 50% chance +20% score, 50% chance -10% score
    async handleRollDice(sessionId, teamId) {
        const team = await classroomAPI.getTeam(teamId);
        if (!team) throw new Error('Team not found');

        const success = Math.random() < 0.5;
        let scoreChange;

        if (success) {
            // +20% of current score
            scoreChange = Math.floor(team.score * 0.2);
            await classroomAPI.updateTeamScore(teamId, scoreChange);
        } else {
            // -10% of current score
            scoreChange = -Math.floor(team.score * 0.1);
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

    // Get powerup display name
    getPowerupName(powerupType) {
        const names = {
            'random_chars': 'Random Characters',
            'score_bash': 'Score Bash',
            'roll_dice': 'Roll the Dice'
        };
        return names[powerupType] || powerupType;
    }

    // Get powerup description
    getPowerupDescription(powerupType) {
        const descriptions = {
            'random_chars': 'Inject random characters into target team\'s answer',
            'score_bash': 'Reduce target team\'s score by 10%',
            'roll_dice': '50% chance: +20% score, 50% chance: -10% score'
        };
        return descriptions[powerupType] || '';
    }
}

// Export singleton instance
const powerupEngine = new PowerupEngine();

