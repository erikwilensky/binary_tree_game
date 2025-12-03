// Time Complexity Quiz UI Controller
class TimeComplexityController {
    constructor() {
        this.questions = [];
        this.shuffledQuestions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.answerRevealed = false;

        this.initializeElements();
        this.initializeEventListeners();
        this.loadQuestions();
    }

    initializeElements() {
        this.appSelect = document.getElementById('app-select');
        this.container = document.getElementById('time-complexity-app');

        this.questionNumberEl = document.getElementById('complexity-question-number');
        this.totalQuestionsEl = document.getElementById('complexity-total-questions');
        this.algorithmTitleEl = document.getElementById('complexity-algorithm-title');
        this.difficultyTagEl = document.getElementById('complexity-difficulty-tag');
        this.topicTagEl = document.getElementById('complexity-topic-tag');
        this.codeDisplayEl = document.getElementById('complexity-code-display');
        this.optionsContainerEl = document.getElementById('complexity-options');
        this.feedbackEl = document.getElementById('complexity-feedback');
        this.prevBtn = document.getElementById('complexity-prev-btn');
        this.nextBtn = document.getElementById('complexity-next-btn');
        this.shuffleBtn = document.getElementById('complexity-shuffle-btn');
    }

    initializeEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousQuestion());
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        if (this.shuffleBtn) {
            this.shuffleBtn.addEventListener('click', () => this.shuffleQuestions());
        }
    }

    async loadQuestions() {
        try {
            const response = await fetch('challenges/time-complexity.json', { cache: 'no-cache' });
            if (!response.ok) {
                console.warn('Could not load time complexity questions:', response.status);
                return;
            }
            this.questions = await response.json();
            this.shuffledQuestions = [...this.questions];
            this.currentQuestionIndex = 0;
            this.renderQuestion();
        } catch (error) {
            console.error('Error loading time complexity questions:', error);
        }
    }

    shuffleQuestions() {
        this.shuffledQuestions = [...this.questions].sort(() => Math.random() - 0.5);
        this.currentQuestionIndex = 0;
        this.renderQuestion();
    }

    renderQuestion() {
        if (this.shuffledQuestions.length === 0) return;

        const question = this.shuffledQuestions[this.currentQuestionIndex];
        if (!question) return;

        // Update question counter
        if (this.questionNumberEl) {
            this.questionNumberEl.textContent = this.currentQuestionIndex + 1;
        }
        if (this.totalQuestionsEl) {
            this.totalQuestionsEl.textContent = this.shuffledQuestions.length;
        }

        // Update title
        if (this.algorithmTitleEl) {
            this.algorithmTitleEl.textContent = question.title || '';
        }

        // Update tags
        if (this.difficultyTagEl) {
            this.difficultyTagEl.textContent = question.difficulty || '';
            this.difficultyTagEl.style.display = question.difficulty ? 'inline-block' : 'none';
        }

        if (this.topicTagEl) {
            this.topicTagEl.textContent = question.topic || '';
            this.topicTagEl.style.display = question.topic ? 'inline-block' : 'none';
        }

        // Update code display
        if (this.codeDisplayEl) {
            const lines = (question.code || '').split('\n');
            const numberedCode = lines.map((line, idx) => {
                const lineNum = (idx + 1).toString().padStart(3, ' ');
                return `${lineNum} | ${line}`;
            }).join('\n');
            this.codeDisplayEl.textContent = numberedCode;
        }

        // Render options
        this.renderOptions(question);

        // Reset state
        this.selectedAnswer = null;
        this.answerRevealed = false;
        this.hideFeedback();

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    renderOptions(question) {
        if (!this.optionsContainerEl || !question.options) return;

        this.optionsContainerEl.innerHTML = '';

        // Shuffle options to randomize order
        const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach((option, index) => {
            const optionButton = document.createElement('button');
            optionButton.className = 'complexity-option-btn';
            optionButton.textContent = option;
            optionButton.dataset.option = option;
            optionButton.dataset.index = index;

            optionButton.addEventListener('click', () => {
                if (!this.answerRevealed) {
                    this.selectAnswer(option, question.correct_answer);
                }
            });

            this.optionsContainerEl.appendChild(optionButton);
        });
    }

    selectAnswer(selectedOption, correctAnswer) {
        if (this.answerRevealed) return;

        this.selectedAnswer = selectedOption;
        this.answerRevealed = true;

        // Update button states
        const buttons = this.optionsContainerEl.querySelectorAll('.complexity-option-btn');
        buttons.forEach(button => {
            const option = button.dataset.option;
            button.classList.remove('selected', 'correct', 'incorrect');

            if (option === selectedOption) {
                button.classList.add('selected');
            }

            if (option === correctAnswer) {
                button.classList.add('correct');
            } else if (option === selectedOption && option !== correctAnswer) {
                button.classList.add('incorrect');
            }
        });

        // Show feedback
        if (selectedOption === correctAnswer) {
            this.showFeedback('Correct! Well done!', 'correct');
        } else {
            this.showFeedback(`Incorrect. The correct answer is ${correctAnswer}`, 'incorrect');
        }
    }

    showFeedback(message, type) {
        if (this.feedbackEl) {
            this.feedbackEl.textContent = message;
            this.feedbackEl.className = `complexity-feedback ${type}`;
            this.feedbackEl.classList.remove('hidden');
        }
    }

    hideFeedback() {
        if (this.feedbackEl) {
            this.feedbackEl.classList.add('hidden');
            this.feedbackEl.textContent = '';
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.shuffledQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        }
    }

    updateNavigationButtons() {
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentQuestionIndex === 0;
        }

        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentQuestionIndex === this.shuffledQuestions.length - 1;
        }
    }
}

// Initialize Time Complexity UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TimeComplexityController();
});

