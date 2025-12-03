// Number Converter Quiz UI Controller
class NumberConverterQuizUI {
    constructor() {
        this.challenges = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answeredQuestions = 0;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.currentQuestionSpan = document.getElementById('current-question');
        this.scoreSpan = document.getElementById('quiz-score');
        this.totalSpan = document.getElementById('quiz-total');
        this.questionValue = document.getElementById('question-value');
        this.questionFormat = document.getElementById('question-format');
        this.answerFormat = document.getElementById('answer-format');
        this.answerInput = document.getElementById('quiz-answer-input');
        this.submitBtn = document.getElementById('quiz-submit-btn');
        this.nextBtn = document.getElementById('quiz-next-btn');
        this.newQuizBtn = document.getElementById('quiz-new-btn');
        this.restartBtn = document.getElementById('quiz-restart-btn');
        this.feedback = document.getElementById('quiz-feedback');
        this.results = document.getElementById('quiz-results');
        this.finalScoreSpan = document.getElementById('final-score');
    }

    initializeEventListeners() {
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => this.submitAnswer());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextQuestion());
        }
        if (this.newQuizBtn) {
            this.newQuizBtn.addEventListener('click', () => this.startNewQuiz());
        }
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.startNewQuiz());
        }
        if (this.answerInput) {
            this.answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitAnswer();
                }
            });
        }
    }

    startNewQuiz() {
        this.challenges = NumberConverterQuiz.generateQuiz();
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answeredQuestions = 0;
        this.results.classList.add('hidden');
        this.nextBtn.classList.add('hidden');
        this.displayQuestion();
        this.updateScore();
        if (this.answerInput) {
            this.answerInput.focus();
        }
    }

    displayQuestion() {
        if (this.currentQuestionIndex >= this.challenges.length) {
            this.showResults();
            return;
        }

        const challenge = this.challenges[this.currentQuestionIndex];
        
        if (this.currentQuestionSpan) {
            this.currentQuestionSpan.textContent = this.currentQuestionIndex + 1;
        }
        
        if (this.questionValue) {
            this.questionValue.textContent = challenge.question;
        }
        
        if (this.questionFormat) {
            this.questionFormat.textContent = challenge.fromFormat;
        }
        
        if (this.answerFormat) {
            this.answerFormat.textContent = challenge.toFormat;
        }
        
        if (this.answerInput) {
            this.answerInput.value = '';
            this.answerInput.disabled = false;
        }
        
        if (this.submitBtn) {
            this.submitBtn.disabled = false;
        }
        
        this.hideFeedback();
    }

    submitAnswer() {
        if (!this.answerInput || this.answerInput.disabled) return;

        const userAnswer = this.answerInput.value.trim();
        if (userAnswer === '') {
            this.showFeedback('Please enter an answer', 'error');
            return;
        }

        const challenge = this.challenges[this.currentQuestionIndex];
        const isCorrect = NumberConverterQuiz.checkAnswer(challenge, userAnswer);
        
        this.answeredQuestions++;
        
        if (isCorrect) {
            this.score++;
            this.showFeedback(`Correct! The answer is ${challenge.answer}`, 'correct');
        } else {
            this.showFeedback(`Incorrect. The correct answer is ${challenge.answer}`, 'incorrect');
        }
        
        this.updateScore();
        
        if (this.answerInput) {
            this.answerInput.disabled = true;
        }
        
        if (this.submitBtn) {
            this.submitBtn.disabled = true;
        }
        
        if (this.currentQuestionIndex < this.challenges.length - 1) {
            this.nextBtn.classList.remove('hidden');
        } else {
            setTimeout(() => this.showResults(), 1500);
        }
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.nextBtn.classList.add('hidden');
        this.displayQuestion();
    }

    showResults() {
        if (this.finalScoreSpan) {
            this.finalScoreSpan.textContent = this.score;
        }
        this.results.classList.remove('hidden');
    }

    updateScore() {
        if (this.scoreSpan) {
            this.scoreSpan.textContent = this.score;
        }
        if (this.totalSpan) {
            this.totalSpan.textContent = this.answeredQuestions;
        }
    }

    showFeedback(message, type) {
        if (this.feedback) {
            this.feedback.textContent = message;
            this.feedback.className = `quiz-feedback ${type}`;
            this.feedback.classList.remove('hidden');
        }
    }

    hideFeedback() {
        if (this.feedback) {
            this.feedback.classList.add('hidden');
        }
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quizUI = new NumberConverterQuizUI();
    quizUI.startNewQuiz();
});

