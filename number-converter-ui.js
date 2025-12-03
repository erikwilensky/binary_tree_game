// Number Converter UI Controller
class NumberConverterUI {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.currentInputType = null; // Track which input field was last modified
    }

    initializeElements() {
        this.denaryInput = document.getElementById('denary-input');
        this.binaryInput = document.getElementById('binary-input');
        this.hexInput = document.getElementById('hex-input');
        this.denaryResult = document.getElementById('denary-result');
        this.binaryResult = document.getElementById('binary-result');
        this.hexResult = document.getElementById('hex-result');
        this.clearBtn = document.getElementById('converter-clear-btn');
        this.errorMessage = document.getElementById('converter-error');
    }

    initializeEventListeners() {
        if (this.denaryInput) {
            this.denaryInput.addEventListener('input', () => this.handleDenaryInput());
        }
        if (this.binaryInput) {
            this.binaryInput.addEventListener('input', () => this.handleBinaryInput());
        }
        if (this.hexInput) {
            this.hexInput.addEventListener('input', () => this.handleHexInput());
        }
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearAll());
        }
    }

    handleDenaryInput() {
        const value = this.denaryInput.value.trim();
        this.currentInputType = 'denary';
        
        if (value === '') {
            this.clearResults();
            return;
        }

        const denary = parseFloat(value);
        
        if (isNaN(denary) || denary < 0 || !Number.isInteger(denary)) {
            this.showError('Denary must be a non-negative integer');
            this.clearResults();
            return;
        }

        this.hideError();
        
        try {
            const binary = NumberConverter.denaryToBinary(denary);
            const hex = NumberConverter.denaryToHexadecimal(denary);
            
            this.binaryResult.textContent = binary;
            this.hexResult.textContent = hex;
        } catch (error) {
            this.showError(error.message);
            this.clearResults();
        }
    }

    handleBinaryInput() {
        const value = this.binaryInput.value.trim();
        this.currentInputType = 'binary';
        
        if (value === '') {
            this.clearResults();
            return;
        }

        this.hideError();
        
        try {
            const denary = NumberConverter.binaryToDenary(value);
            const hex = NumberConverter.binaryToHexadecimal(value);
            
            this.denaryResult.textContent = denary;
            this.hexResult.textContent = hex;
        } catch (error) {
            this.showError(error.message);
            this.clearResults();
        }
    }

    handleHexInput() {
        const value = this.hexInput.value.trim();
        this.currentInputType = 'hex';
        
        if (value === '') {
            this.clearResults();
            return;
        }

        this.hideError();
        
        try {
            const denary = NumberConverter.hexadecimalToDenary(value);
            const binary = NumberConverter.hexadecimalToBinary(value);
            
            this.denaryResult.textContent = denary;
            this.binaryResult.textContent = binary;
        } catch (error) {
            this.showError(error.message);
            this.clearResults();
        }
    }

    clearResults() {
        if (this.denaryResult) this.denaryResult.textContent = '---';
        if (this.binaryResult) this.binaryResult.textContent = '---';
        if (this.hexResult) this.hexResult.textContent = '---';
    }

    clearAll() {
        if (this.denaryInput) this.denaryInput.value = '';
        if (this.binaryInput) this.binaryInput.value = '';
        if (this.hexInput) this.hexInput.value = '';
        this.clearResults();
        this.hideError();
        this.currentInputType = null;
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.classList.remove('hidden');
        }
    }

    hideError() {
        if (this.errorMessage) {
            this.errorMessage.classList.add('hidden');
            this.errorMessage.textContent = '';
        }
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const converterUI = new NumberConverterUI();
});

