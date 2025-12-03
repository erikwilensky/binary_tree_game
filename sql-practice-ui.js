// SQL Practice UI Controller
class SQLPracticeController {
    constructor() {
        this.challenges = [];
        this.currentChallenge = null;
        this.autocompleteSuggestions = [];
        this.autocompleteIndex = -1;
        this.syntaxErrors = [];

        // SQL keywords for autocomplete
        this.sqlKeywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
            'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
            'IS NULL', 'IS NOT NULL', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DISTINCT', 'LIMIT',
            'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'DATABASE',
            'ASC', 'DESC', 'UNION', 'INTERSECT', 'EXCEPT'
        ];

        this.initializeElements();
        this.initializeEventListeners();
        this.loadChallenges();
    }

    initializeElements() {
        this.appSelect = document.getElementById('app-select');
        this.container = document.getElementById('sql-practice-app');

        this.challengeSelect = document.getElementById('sql-challenge-select');
        this.challengeTitleEl = document.getElementById('sql-challenge-title');
        this.schemaDisplay = document.getElementById('sql-schema-display');
        this.descriptionEl = document.getElementById('sql-description');
        this.difficultyTag = document.getElementById('sql-difficulty-tag');
        this.topicTag = document.getElementById('sql-topic-tag');
        this.sqlEditor = document.getElementById('sql-editor');
        this.autocompleteList = document.getElementById('sql-autocomplete-list');
        this.syntaxAlerts = document.getElementById('sql-syntax-alerts');
        this.checkBtn = document.getElementById('sql-check-btn');
        this.clearBtn = document.getElementById('sql-clear-btn');
        this.feedbackEl = document.getElementById('sql-feedback');
    }

    initializeEventListeners() {
        if (this.challengeSelect) {
            this.challengeSelect.addEventListener('change', () => {
                const id = this.challengeSelect.value;
                this.loadChallengeById(id);
            });
        }

        if (this.sqlEditor) {
            this.sqlEditor.addEventListener('input', (e) => {
                this.handleEditorInput(e);
            });

            this.sqlEditor.addEventListener('keydown', (e) => {
                this.handleEditorKeydown(e);
            });

            this.sqlEditor.addEventListener('focus', () => {
                this.updateAutocomplete();
            });
        }

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (this.autocompleteList && 
                !this.sqlEditor.contains(e.target) && 
                !this.autocompleteList.contains(e.target)) {
                this.hideAutocomplete();
            }
        });

        if (this.checkBtn) {
            this.checkBtn.addEventListener('click', () => this.checkQuery());
        }

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearEditor());
        }
    }

    async loadChallenges() {
        try {
            const response = await fetch('challenges/sql-challenges.json', { cache: 'no-cache' });
            if (!response.ok) {
                console.warn('Could not load SQL challenges:', response.status);
                return;
            }
            this.challenges = await response.json();
            this.populateChallengeSelector();
        } catch (error) {
            console.error('Error loading SQL challenges:', error);
        }
    }

    populateChallengeSelector() {
        if (!this.challengeSelect || !Array.isArray(this.challenges)) return;

        this.challengeSelect.innerHTML = '';

        this.challenges.forEach((ch) => {
            const option = document.createElement('option');
            option.value = ch.id;
            option.textContent = `${ch.title} (${ch.difficulty})`;
            this.challengeSelect.appendChild(option);
        });

        if (this.challenges.length > 0) {
            this.loadChallengeById(this.challenges[0].id);
        }
    }

    loadChallengeById(id) {
        const challenge = this.challenges.find((c) => c.id === id);
        if (!challenge) return;

        this.currentChallenge = challenge;
        if (this.challengeSelect && this.challengeSelect.value !== id) {
            this.challengeSelect.value = id;
        }

        this.renderChallenge(challenge);
        this.clearEditor();
    }

    renderChallenge(challenge) {
        // Update metadata
        if (this.challengeTitleEl) {
            this.challengeTitleEl.textContent = challenge.title || 'Challenge';
        }

        if (this.descriptionEl) {
            this.descriptionEl.textContent = challenge.description || '';
        }

        if (this.difficultyTag) {
            this.difficultyTag.textContent = challenge.difficulty || '';
            this.difficultyTag.style.display = challenge.difficulty ? 'inline-block' : 'none';
        }

        if (this.topicTag) {
            this.topicTag.textContent = challenge.topic || '';
            this.topicTag.style.display = challenge.topic ? 'inline-block' : 'none';
        }

        // Render schema
        this.renderSchema(challenge.schema);
    }

    renderSchema(schema) {
        if (!this.schemaDisplay || !schema || !schema.tables) return;

        this.schemaDisplay.innerHTML = '';

        schema.tables.forEach((table) => {
            const tableDiv = document.createElement('div');
            tableDiv.className = 'sql-table-schema';

            const tableHeader = document.createElement('div');
            tableHeader.className = 'sql-table-header';
            tableHeader.innerHTML = `<strong>Table: ${table.name}</strong>`;
            tableDiv.appendChild(tableHeader);

            const columnsList = document.createElement('ul');
            columnsList.className = 'sql-columns-list';

            table.columns.forEach((column) => {
                const columnItem = document.createElement('li');
                columnItem.className = 'sql-column-item';
                
                let columnText = `${column.name} (${column.type})`;
                if (column.primary_key) {
                    columnText += ' <span class="sql-key-badge primary-key">PK</span>';
                }
                if (column.foreign_key) {
                    columnText += ` <span class="sql-key-badge foreign-key">FK → ${column.foreign_key}</span>`;
                }
                
                columnItem.innerHTML = columnText;
                columnsList.appendChild(columnItem);
            });

            tableDiv.appendChild(columnsList);
            this.schemaDisplay.appendChild(tableDiv);
        });
    }

    handleEditorInput(e) {
        this.updateAutocomplete();
        this.checkSyntax();
    }

    handleEditorKeydown(e) {
        if (this.autocompleteList && this.autocompleteList.children.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.autocompleteIndex = Math.min(
                    this.autocompleteIndex + 1,
                    this.autocompleteSuggestions.length - 1
                );
                this.highlightAutocompleteItem();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.autocompleteIndex = Math.max(this.autocompleteIndex - 1, -1);
                this.highlightAutocompleteItem();
            } else if (e.key === 'Enter' && this.autocompleteIndex >= 0) {
                e.preventDefault();
                this.insertAutocompleteSuggestion();
            } else if (e.key === 'Escape') {
                this.hideAutocomplete();
            }
        }
    }

    updateAutocomplete() {
        if (!this.sqlEditor) return;

        const cursorPos = this.sqlEditor.selectionStart;
        const text = this.sqlEditor.value;
        const textBeforeCursor = text.substring(0, cursorPos);
        
        // Find the current word being typed
        const wordMatch = textBeforeCursor.match(/(\w+)$/);
        const currentWord = wordMatch ? wordMatch[1].toUpperCase() : '';

        if (currentWord.length < 1) {
            this.hideAutocomplete();
            return;
        }

        // Get available suggestions
        const suggestions = this.getSuggestions(currentWord);
        
        if (suggestions.length === 0) {
            this.hideAutocomplete();
            return;
        }

        this.autocompleteSuggestions = suggestions;
        this.autocompleteIndex = -1;
        this.showAutocomplete(suggestions, currentWord);
    }

    getSuggestions(currentWord) {
        const suggestions = [];

        // Add SQL keywords
        this.sqlKeywords.forEach((keyword) => {
            if (keyword.startsWith(currentWord)) {
                suggestions.push({ type: 'keyword', value: keyword });
            }
        });

        // Add table names from current challenge
        if (this.currentChallenge && this.currentChallenge.schema) {
            this.currentChallenge.schema.tables.forEach((table) => {
                if (table.name.toUpperCase().startsWith(currentWord)) {
                    suggestions.push({ type: 'table', value: table.name });
                }

                // Add column names
                table.columns.forEach((column) => {
                    if (column.name.toUpperCase().startsWith(currentWord)) {
                        suggestions.push({ type: 'column', value: column.name });
                    }
                });
            });
        }

        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }

    showAutocomplete(suggestions, currentWord) {
        if (!this.autocompleteList) return;

        this.autocompleteList.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'sql-autocomplete-item';
            item.dataset.index = index;
            
            const typeIcon = this.getTypeIcon(suggestion.type);
            item.innerHTML = `${typeIcon} <span class="sql-suggestion-value">${suggestion.value}</span>`;
            
            item.addEventListener('click', () => {
                this.autocompleteIndex = index;
                this.insertAutocompleteSuggestion();
            });

            this.autocompleteList.appendChild(item);
        });

        this.autocompleteList.style.display = 'block';
    }

    getTypeIcon(type) {
        const icons = {
            keyword: '<span class="sql-icon-keyword">🔑</span>',
            table: '<span class="sql-icon-table">📊</span>',
            column: '<span class="sql-icon-column">📋</span>'
        };
        return icons[type] || '';
    }

    highlightAutocompleteItem() {
        if (!this.autocompleteList) return;

        const items = this.autocompleteList.querySelectorAll('.sql-autocomplete-item');
        items.forEach((item, index) => {
            if (index === this.autocompleteIndex) {
                item.classList.add('sql-autocomplete-active');
            } else {
                item.classList.remove('sql-autocomplete-active');
            }
        });
    }

    insertAutocompleteSuggestion() {
        if (!this.sqlEditor || this.autocompleteIndex < 0) return;

        const suggestion = this.autocompleteSuggestions[this.autocompleteIndex];
        if (!suggestion) return;

        const cursorPos = this.sqlEditor.selectionStart;
        const text = this.sqlEditor.value;
        const textBeforeCursor = text.substring(0, cursorPos);
        
        // Find the current word
        const wordMatch = textBeforeCursor.match(/(\w+)$/);
        const wordStart = wordMatch ? cursorPos - wordMatch[1].length : cursorPos;

        // Insert the suggestion
        const newText = text.substring(0, wordStart) + suggestion.value + ' ' + text.substring(cursorPos);
        this.sqlEditor.value = newText;
        
        // Set cursor position after inserted text
        const newCursorPos = wordStart + suggestion.value.length + 1;
        this.sqlEditor.setSelectionRange(newCursorPos, newCursorPos);

        this.hideAutocomplete();
        this.updateAutocomplete();
    }

    hideAutocomplete() {
        if (this.autocompleteList) {
            this.autocompleteList.style.display = 'none';
        }
        this.autocompleteIndex = -1;
        this.autocompleteSuggestions = [];
    }

    checkSyntax() {
        if (!this.sqlEditor || !this.syntaxAlerts) return;

        const query = this.sqlEditor.value.trim();
        this.syntaxErrors = [];

        if (query.length === 0) {
            this.syntaxAlerts.innerHTML = '';
            return;
        }

        // Basic syntax checks
        const checks = [
            {
                test: () => {
                    const openParens = (query.match(/\(/g) || []).length;
                    const closeParens = (query.match(/\)/g) || []).length;
                    return openParens === closeParens;
                },
                message: 'Mismatched parentheses'
            },
            {
                test: () => {
                    const openQuotes = (query.match(/'/g) || []).length;
                    return openQuotes % 2 === 0;
                },
                message: 'Unclosed string literal (check quotes)'
            },
            {
                test: () => {
                    return query.match(/SELECT/i) || query.match(/INSERT/i) || query.match(/UPDATE/i) || query.match(/DELETE/i);
                },
                message: 'Query should start with SELECT, INSERT, UPDATE, or DELETE'
            },
            {
                test: () => {
                    if (query.match(/SELECT/i)) {
                        return query.match(/FROM/i);
                    }
                    return true;
                },
                message: 'SELECT statement requires a FROM clause'
            },
            {
                test: () => {
                    if (query.match(/JOIN/i)) {
                        return query.match(/ON\s+\w+\.\w+\s*=\s*\w+\.\w+/i);
                    }
                    return true;
                },
                message: 'JOIN statement requires an ON clause with join condition'
            }
        ];

        checks.forEach((check) => {
            if (!check.test()) {
                this.syntaxErrors.push(check.message);
            }
        });

        this.renderSyntaxAlerts();
    }

    renderSyntaxAlerts() {
        if (!this.syntaxAlerts) return;

        if (this.syntaxErrors.length === 0) {
            this.syntaxAlerts.innerHTML = '<div class="sql-syntax-ok">✓ Syntax looks good!</div>';
            this.syntaxAlerts.className = 'sql-syntax-alerts sql-syntax-ok-container';
        } else {
            let html = '<div class="sql-syntax-errors-title">⚠ Syntax Issues:</div>';
            this.syntaxErrors.forEach((error) => {
                html += `<div class="sql-syntax-error">• ${error}</div>`;
            });
            this.syntaxAlerts.innerHTML = html;
            this.syntaxAlerts.className = 'sql-syntax-alerts sql-syntax-error-container';
        }
    }

    checkQuery() {
        if (!this.currentChallenge || !this.sqlEditor) return;

        const userQuery = this.sqlEditor.value.trim();
        
        if (userQuery.length === 0) {
            this.showFeedback('Please write a SQL query first.', 'error');
            return;
        }

        // Basic validation - in a real implementation, you'd parse and execute the query
        // For now, we'll do simple pattern matching
        const feedback = this.validateQuery(userQuery);
        this.showFeedback(feedback.message, feedback.type);
    }

    validateQuery(query) {
        // This is a simplified validator - in production, you'd use a proper SQL parser
        const upperQuery = query.toUpperCase();

        // Check if it's a SELECT query (for most challenges)
        if (!upperQuery.includes('SELECT')) {
            return { message: 'Query should start with SELECT', type: 'error' };
        }

        // Check for required keywords based on challenge topic
        if (this.currentChallenge.topic === 'JOIN' && !upperQuery.includes('JOIN')) {
            return { message: 'This challenge requires a JOIN. Your query should include a JOIN clause.', type: 'error' };
        }

        if (this.currentChallenge.topic === 'GROUP BY' && !upperQuery.includes('GROUP BY')) {
            return { message: 'This challenge requires GROUP BY. Your query should include a GROUP BY clause.', type: 'error' };
        }

        if (this.currentChallenge.topic === 'ORDER BY' && !upperQuery.includes('ORDER BY')) {
            return { message: 'This challenge requires ORDER BY. Your query should include an ORDER BY clause.', type: 'error' };
        }

        // Check if FROM clause exists
        if (!upperQuery.includes('FROM')) {
            return { message: 'Query is missing a FROM clause', type: 'error' };
        }

        // Basic structure looks good
        return { 
            message: 'Query structure looks correct! Note: This is a simplified check. In a real database, the query would be executed to verify results.', 
            type: 'success' 
        };
    }

    showFeedback(message, type) {
        if (!this.feedbackEl) return;

        this.feedbackEl.textContent = message;
        this.feedbackEl.className = `sql-feedback sql-feedback-${type}`;
        this.feedbackEl.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                this.feedbackEl.style.display = 'none';
            }, 5000);
        }
    }

    clearEditor() {
        if (this.sqlEditor) {
            this.sqlEditor.value = '';
        }
        this.hideAutocomplete();
        if (this.syntaxAlerts) {
            this.syntaxAlerts.innerHTML = '';
            this.syntaxAlerts.className = 'sql-syntax-alerts';
        }
        if (this.feedbackEl) {
            this.feedbackEl.style.display = 'none';
        }
    }
}

// Initialize when DOM is ready
let sqlPracticeController;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sqlPracticeController = new SQLPracticeController();
    });
} else {
    sqlPracticeController = new SQLPracticeController();
}

