// Python Algorithm Tracing UI Controller
// Front-end only: loads precomputed challenges and golden traces from JSON files.

class PythonTraceController {
    constructor() {
        this.challenges = [];
        this.currentChallenge = null;
        this.currentTrace = null;

        this.initializeElements();
        this.initializeEventListeners();
        this.loadChallenges();
    }

    initializeElements() {
        this.appSelect = document.getElementById('app-select');
        this.container = document.getElementById('python-tracing-app');

        this.challengeSelect = document.getElementById('python-challenge-select');
        this.codeDisplay = document.getElementById('python-code-display');
        this.difficultyTag = document.getElementById('python-difficulty-tag');
        this.topicTag = document.getElementById('python-topic-tag');

        this.titleEl = document.getElementById('python-challenge-title');
        this.descriptionEl = document.getElementById('python-challenge-description');
        this.inputsEl = document.getElementById('python-challenge-inputs');

        this.tableHead = document.getElementById('python-trace-head');
        this.tableBody = document.getElementById('python-trace-body');
        this.feedbackEl = document.getElementById('python-trace-feedback');

        this.checkBtn = document.getElementById('python-check-btn');
        this.retryBtn = document.getElementById('python-retry-btn');
    }

    initializeEventListeners() {
        if (this.challengeSelect) {
            this.challengeSelect.addEventListener('change', () => {
                const id = this.challengeSelect.value;
                this.loadChallengeById(id);
            });
        }

        if (this.checkBtn) {
            this.checkBtn.addEventListener('click', () => this.checkTrace());
        }

        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', () => this.retryWrongCells());
        }
    }

    async loadChallenges() {
        try {
            const response = await fetch('challenges/algorithms.json', { cache: 'no-cache' });
            if (!response.ok) {
                console.warn('Could not load Python tracing challenges:', response.status);
                return;
            }
            this.challenges = await response.json();
            this.populateChallengeSelector();
        } catch (error) {
            console.error('Error loading Python tracing challenges:', error);
        }
    }

    populateChallengeSelector() {
        if (!this.challengeSelect || !Array.isArray(this.challenges)) return;

        this.challengeSelect.innerHTML = '';

        this.challenges.forEach((ch) => {
            const option = document.createElement('option');
            option.value = ch.id;
            option.textContent = ch.title;
            this.challengeSelect.appendChild(option);
        });

        if (this.challenges.length > 0) {
            this.loadChallengeById(this.challenges[0].id);
        }
    }

    async loadChallengeById(id) {
        const challenge = this.challenges.find((c) => c.id === id);
        if (!challenge) return;

        this.currentChallenge = challenge;
        if (this.challengeSelect && this.challengeSelect.value !== id) {
            this.challengeSelect.value = id;
        }

        // Render basic metadata
        this.renderChallengeMeta(challenge);

        // Load trace data for this challenge
        await this.loadTraceForChallenge(challenge);
    }

    renderChallengeMeta(challenge) {
        if (this.titleEl) this.titleEl.textContent = challenge.title || '';
        if (this.descriptionEl) this.descriptionEl.textContent = challenge.description || '';

        if (this.inputsEl) {
            const inputs = challenge.inputs || {};
            this.inputsEl.textContent = 'Input: ' + JSON.stringify(inputs);
        }

        if (this.difficultyTag) {
            this.difficultyTag.textContent = challenge.difficulty || '';
            this.difficultyTag.style.display = challenge.difficulty ? 'inline-block' : 'none';
        }

        if (this.topicTag) {
            this.topicTag.textContent = challenge.topic || '';
            this.topicTag.style.display = challenge.topic ? 'inline-block' : 'none';
        }

        if (this.codeDisplay) {
            // Add line numbers and preserve formatting
            const lines = (challenge.python_code || '').split('\n');
            const numberedCode = lines.map((line, idx) => {
                const lineNum = (idx + 1).toString().padStart(3, ' ');
                return `${lineNum} | ${line}`;
            }).join('\n');
            this.codeDisplay.textContent = numberedCode;
        }
    }

    async loadTraceForChallenge(challenge) {
        try {
            const tracePath = `challenges/traces/${challenge.id}.json`;
            const response = await fetch(tracePath, { cache: 'no-cache' });
            if (!response.ok) {
                console.warn('Could not load trace for challenge', challenge.id, response.status);
                this.currentTrace = null;
                this.renderEmptyTable();
                return;
            }
            const data = await response.json();
            this.currentTrace = Array.isArray(data.steps) ? data.steps : [];
            this.renderTraceTable();
        } catch (error) {
            console.error('Error loading trace for challenge', challenge.id, error);
            this.currentTrace = null;
            this.renderEmptyTable();
        }
    }

    renderEmptyTable() {
        if (this.tableHead) this.tableHead.innerHTML = '';
        if (this.tableBody) this.tableBody.innerHTML = '';
        if (this.feedbackEl) this.feedbackEl.textContent = '';
    }

    renderTraceTable() {
        if (!this.tableHead || !this.tableBody || !this.currentChallenge || !this.currentTrace) return;

        const config = this.currentChallenge.trace_config || {};
        const columns = config.columns || [];

        // Build header
        this.tableHead.innerHTML = '';
        const headerRow = document.createElement('tr');
        columns.forEach((col) => {
            const th = document.createElement('th');
            th.textContent = col.label || col.key;
            headerRow.appendChild(th);
        });
        this.tableHead.appendChild(headerRow);

        // Build body
        this.tableBody.innerHTML = '';

        this.currentTrace.forEach((step, rowIndex) => {
            const tr = document.createElement('tr');

            columns.forEach((col) => {
                const td = document.createElement('td');
                td.classList.remove('trace-cell-correct', 'trace-cell-incorrect');

                const key = col.key;
                const type = col.type || 'value';
                const editable = !!col.editable;

                let value = '';

                if (type === 'step') {
                    value = step.step_index != null ? step.step_index : rowIndex + 1;
                } else if (type === 'line') {
                    value = step.line_number != null ? step.line_number : '';
                } else if (type === 'variable') {
                    const vars = step.variables || {};
                    value = vars[key] != null ? vars[key] : '';
                } else if (type === 'condition') {
                    const conds = step.condition_results || {};
                    value = conds[key] != null ? conds[key] : '';
                } else if (type === 'output') {
                    value = step.output != null ? step.output : '';
                } else if (type === 'meta') {
                    value = step[key] != null ? step[key] : '';
                }

                if (editable) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.dataset.stepIndex = String(rowIndex);
                    input.dataset.colKey = key;
                    input.dataset.colType = type;
                    
                    // If this variable/condition doesn't exist in this step, mark as not applicable
                    let isApplicableInStep = false;
                    if (type === 'variable') {
                        const vars = step.variables || {};
                        isApplicableInStep = colKey in vars;
                    } else if (type === 'condition') {
                        const conds = step.condition_results || {};
                        isApplicableInStep = colKey in conds;
                    } else if (type === 'output') {
                        isApplicableInStep = step.output !== undefined && step.output !== null;
                    } else if (type === 'meta') {
                        isApplicableInStep = colKey in step && step[colKey] !== undefined;
                    }
                    
                    if (!isApplicableInStep) {
                        td.classList.add('trace-cell-not-applicable');
                        input.disabled = true;
                    }
                    
                    td.appendChild(input);
                } else {
                    td.textContent = value;
                }

                tr.appendChild(td);
            });

            this.tableBody.appendChild(tr);
        });

        if (this.feedbackEl) {
            this.feedbackEl.textContent = '';
            this.feedbackEl.className = 'python-trace-feedback';
        }
    }

    normalizeValue(raw) {
        if (raw == null) return '';
        const s = String(raw).trim();
        if (s === '') return '';

        // Try integer
        if (/^-?\d+$/.test(s)) {
            return String(parseInt(s, 10));
        }

        // Booleans
        if (/^(true|false)$/i.test(s)) {
            return String(s.toLowerCase() === 'true');
        }

        return s;
    }

    checkTrace() {
        if (!this.currentTrace || !this.currentChallenge) return;

        const config = this.currentChallenge.trace_config || {};
        const columns = config.columns || [];

        // Map for quick lookup of column definition
        const colByKey = {};
        columns.forEach((c) => { colByKey[c.key] = c; });

        const inputs = Array.from(
            this.tableBody.querySelectorAll('input[data-step-index][data-col-key]')
        );

        if (inputs.length === 0) {
            if (this.feedbackEl) {
                this.feedbackEl.textContent = 'No editable cells in this challenge.';
                this.feedbackEl.className = 'python-trace-feedback';
            }
            return;
        }

        let correctCount = 0;
        let total = inputs.length;

        inputs.forEach((input) => {
            const td = input.parentElement;
            if (!td) return;

            td.classList.remove('trace-cell-correct', 'trace-cell-incorrect');

            const rowIndex = parseInt(input.dataset.stepIndex || '0', 10);
            const colKey = input.dataset.colKey;
            const colType = input.dataset.colType || 'value';

            const step = this.currentTrace[rowIndex];
            if (!step) return;

            let expected;
            let isApplicable = true;

            if (colType === 'variable') {
                const vars = step.variables || {};
                // Check if the variable key exists in this step
                isApplicable = colKey in vars;
                expected = vars[colKey];
            } else if (colType === 'condition') {
                const conds = step.condition_results || {};
                // Check if the condition key exists in this step
                isApplicable = colKey in conds;
                expected = conds[colKey];
            } else if (colType === 'output') {
                isApplicable = step.output !== undefined && step.output !== null;
                expected = step.output;
            } else if (colType === 'meta') {
                isApplicable = colKey in step && step[colKey] !== undefined;
                expected = step[colKey];
            } else if (colType === 'line') {
                isApplicable = true; // Line numbers are always applicable
                expected = step.line_number;
            } else if (colType === 'step') {
                isApplicable = true; // Step numbers are always applicable
                expected = step.step_index != null ? step.step_index : rowIndex + 1;
            }

            const studentVal = this.normalizeValue(input.value);
            const expectedNorm = this.normalizeValue(expected);

            // If this cell is not applicable for this step, grey it out
            if (!isApplicable) {
                if (studentVal === '') {
                    // Both empty - mark as not applicable (greyed out)
                    td.classList.add('trace-cell-not-applicable');
                    // Don't count this in total for scoring
                    total--;
                } else {
                    // Student entered something but it's not applicable - mark as incorrect
                    td.classList.add('trace-cell-incorrect');
                }
            } else if (studentVal === expectedNorm) {
                td.classList.add('trace-cell-correct');
                correctCount++;
            } else {
                td.classList.add('trace-cell-incorrect');
            }
        });

        const percent = Math.round((correctCount / total) * 100);

        if (this.feedbackEl) {
            this.feedbackEl.textContent = `Score: ${correctCount}/${total} cells correct (${percent}%)`;
            this.feedbackEl.className = 'python-trace-feedback ' + (percent >= 80 ? 'good' : 'bad');
        }
    }

    retryWrongCells() {
        const inputs = Array.from(
            this.tableBody.querySelectorAll('input[data-step-index][data-col-key]')
        );

        inputs.forEach((input) => {
            const td = input.parentElement;
            if (!td) return;

            if (td.classList.contains('trace-cell-incorrect')) {
                input.value = '';
                td.classList.remove('trace-cell-incorrect');
            }
        });

        if (this.feedbackEl) {
            this.feedbackEl.textContent = 'Wrong cells cleared. Try again!';
            this.feedbackEl.className = 'python-trace-feedback';
        }
    }
}

// Initialize Python tracing UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // We can safely construct this even if the Python app is hidden initially.
    new PythonTraceController();
});


