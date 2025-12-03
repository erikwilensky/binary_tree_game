// Number Converter UI Controller
class NumberConverterUI {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.denaryInput = document.getElementById('denary-input');
        this.binaryInput = document.getElementById('binary-input');
        this.hexInput = document.getElementById('hex-input');
        this.clearBtn = document.getElementById('converter-clear-btn');
        this.errorMessage = document.getElementById('converter-error');
        this.isUpdating = false; // Prevent circular updates
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
        if (this.isUpdating) return;
        
        const value = this.denaryInput.value.trim();
        
        if (value === '') {
            this.clearAllFields();
            return;
        }

        const denary = parseFloat(value);
        
        if (isNaN(denary) || denary < 0 || !Number.isInteger(denary)) {
            this.showError('Denary must be a non-negative integer');
            return;
        }

        this.hideError();
        
        try {
            this.isUpdating = true;
            const binary = NumberConverter.denaryToBinary(denary);
            const hex = NumberConverter.denaryToHexadecimal(denary);
            
            this.binaryInput.value = binary;
            this.hexInput.value = hex;
            this.isUpdating = false;
        } catch (error) {
            this.showError(error.message);
            this.isUpdating = false;
        }
    }

    handleBinaryInput() {
        if (this.isUpdating) return;
        
        const value = this.binaryInput.value.trim();
        
        if (value === '') {
            this.clearAllFields();
            return;
        }

        this.hideError();
        
        try {
            this.isUpdating = true;
            const denary = NumberConverter.binaryToDenary(value);
            const hex = NumberConverter.binaryToHexadecimal(value);
            
            this.denaryInput.value = denary;
            this.hexInput.value = hex;
            this.isUpdating = false;
        } catch (error) {
            this.showError(error.message);
            this.isUpdating = false;
        }
    }

    handleHexInput() {
        if (this.isUpdating) return;
        
        const value = this.hexInput.value.trim();
        
        if (value === '') {
            this.clearAllFields();
            return;
        }

        this.hideError();
        
        try {
            this.isUpdating = true;
            const denary = NumberConverter.hexadecimalToDenary(value);
            const binary = NumberConverter.hexadecimalToBinary(value);
            
            this.denaryInput.value = denary;
            this.binaryInput.value = binary;
            this.isUpdating = false;
        } catch (error) {
            this.showError(error.message);
            this.isUpdating = false;
        }
    }

    clearAllFields() {
        if (this.denaryInput) this.denaryInput.value = '';
        if (this.binaryInput) this.binaryInput.value = '';
        if (this.hexInput) this.hexInput.value = '';
    }

    clearAll() {
        this.clearAllFields();
        this.hideError();
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

