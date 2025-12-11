// Timer logic with dynamic time reduction
class ClassroomTimer {
    constructor() {
        this.timerId = null;
        this.startTime = null;
        this.timeLimit = 0;
        this.remainingTime = 0;
        this.originalTimeLimit = 0;
        this.reduced = false;
        this.callbacks = {
            onTick: [],
            onExpire: []
        };
    }

    // Start timer
    startTimer(timeLimitSeconds, startedAt = null) {
        this.stopTimer();
        
        this.originalTimeLimit = timeLimitSeconds;
        this.timeLimit = timeLimitSeconds;
        this.remainingTime = timeLimitSeconds;
        this.reduced = false;

        // Calculate start time
        if (startedAt) {
            const started = new Date(startedAt);
            const now = new Date();
            const elapsed = Math.floor((now - started) / 1000);
            this.remainingTime = Math.max(0, timeLimitSeconds - elapsed);
        } else {
            this.startTime = new Date();
        }

        // Start countdown
        this.timerId = setInterval(() => {
            this.tick();
        }, 1000);

        // Initial tick
        this.tick();
    }

    // Timer tick
    tick() {
        if (this.startTime) {
            const now = new Date();
            const elapsed = Math.floor((now - this.startTime) / 1000);
            this.remainingTime = Math.max(0, this.timeLimit - elapsed);
        } else {
            this.remainingTime = Math.max(0, this.remainingTime - 1);
        }

        // Notify tick callbacks
        this.callbacks.onTick.forEach(callback => {
            try {
                callback(this.remainingTime, this.timeLimit);
            } catch (error) {
                console.error('Timer tick callback error:', error);
            }
        });

        // Check if expired
        if (this.remainingTime <= 0) {
            this.expire();
        }
    }

    // Reduce time by one third (when another team locks)
    reduceTimeByOneThird() {
        if (this.reduced) return; // Only reduce once
        
        const reduction = Math.floor(this.remainingTime / 3);
        this.remainingTime = Math.max(0, this.remainingTime - reduction);
        this.timeLimit = this.remainingTime;
        this.reduced = true;

        // Update start time to reflect new limit
        if (this.startTime) {
            this.startTime = new Date();
        }
    }

    // Timer expired
    expire() {
        this.stopTimer();
        this.remainingTime = 0;
        
        // Notify expire callbacks
        this.callbacks.onExpire.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Timer expire callback error:', error);
            }
        });
    }

    // Force timer to zero (when all teams lock)
    forceToZero() {
        this.stopTimer();
        this.remainingTime = 0;
        this.timeLimit = 0;
        
        // Notify tick callbacks with zero time
        this.callbacks.onTick.forEach(callback => {
            try {
                callback(0, 0);
            } catch (error) {
                console.error('Timer tick callback error:', error);
            }
        });
    }

    // Stop timer
    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.startTime = null;
    }

    // Get remaining time
    getRemainingTime() {
        return this.remainingTime;
    }

    // Get time limit
    getTimeLimit() {
        return this.timeLimit;
    }

    // Register tick callback
    onTick(callback) {
        this.callbacks.onTick.push(callback);
    }

    // Register expire callback
    onExpire(callback) {
        this.callbacks.onExpire.push(callback);
    }

    // Remove callbacks
    removeCallbacks() {
        this.callbacks.onTick = [];
        this.callbacks.onExpire = [];
    }

    // Format time as MM:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Get progress percentage (0-1)
    getProgress() {
        if (this.timeLimit === 0) return 0;
        return this.remainingTime / this.timeLimit;
    }
}

// Export singleton instance
const classroomTimer = new ClassroomTimer();

