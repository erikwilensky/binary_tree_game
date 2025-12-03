// Number Conversion Module
// Converts between binary (string), hexadecimal (string), and denary (number)
// Only handles non-negative values

const NumberConverter = {
    // Convert denary (number) to binary (string)
    denaryToBinary(denary) {
        if (typeof denary !== 'number' || isNaN(denary)) {
            throw new Error('Denary input must be a valid number');
        }
        
        if (denary < 0) {
            throw new Error('Only non-negative numbers are supported');
        }
        
        if (denary === 0) {
            return '0';
        }
        
        let result = '';
        let num = Math.floor(denary);
        
        while (num > 0) {
            result = (num % 2) + result;
            num = Math.floor(num / 2);
        }
        
        return result;
    },

    // Convert denary (number) to hexadecimal (string)
    denaryToHexadecimal(denary) {
        if (typeof denary !== 'number' || isNaN(denary)) {
            throw new Error('Denary input must be a valid number');
        }
        
        if (denary < 0) {
            throw new Error('Only non-negative numbers are supported');
        }
        
        if (denary === 0) {
            return '0';
        }
        
        const hexDigits = '0123456789ABCDEF';
        let result = '';
        let num = Math.floor(denary);
        
        while (num > 0) {
            result = hexDigits[num % 16] + result;
            num = Math.floor(num / 16);
        }
        
        return result;
    },

    // Convert binary (string) to denary (number)
    binaryToDenary(binary) {
        if (typeof binary !== 'string') {
            throw new Error('Binary input must be a string');
        }
        
        if (binary.trim() === '') {
            throw new Error('Binary input cannot be empty');
        }
        
        // Validate binary string (only 0s and 1s)
        if (!/^[01]+$/.test(binary.trim())) {
            throw new Error('Binary input must contain only 0s and 1s');
        }
        
        const binaryStr = binary.trim();
        let result = 0;
        let power = 0;
        
        for (let i = binaryStr.length - 1; i >= 0; i--) {
            if (binaryStr[i] === '1') {
                result += Math.pow(2, power);
            }
            power++;
        }
        
        return result;
    },

    // Convert binary (string) to hexadecimal (string)
    binaryToHexadecimal(binary) {
        // First convert to denary, then to hex
        const denary = this.binaryToDenary(binary);
        return this.denaryToHexadecimal(denary);
    },

    // Convert hexadecimal (string) to denary (number)
    hexadecimalToDenary(hex) {
        if (typeof hex !== 'string') {
            throw new Error('Hexadecimal input must be a string');
        }
        
        if (hex.trim() === '') {
            throw new Error('Hexadecimal input cannot be empty');
        }
        
        // Validate hex string (only 0-9 and A-F)
        const hexStr = hex.trim().toUpperCase();
        if (!/^[0-9A-F]+$/.test(hexStr)) {
            throw new Error('Hexadecimal input must contain only 0-9 and A-F');
        }
        
        const hexDigits = '0123456789ABCDEF';
        let result = 0;
        let power = 0;
        
        for (let i = hexStr.length - 1; i >= 0; i--) {
            const digitValue = hexDigits.indexOf(hexStr[i]);
            result += digitValue * Math.pow(16, power);
            power++;
        }
        
        return result;
    },

    // Convert hexadecimal (string) to binary (string)
    hexadecimalToBinary(hex) {
        // First convert to denary, then to binary
        const denary = this.hexadecimalToDenary(hex);
        return this.denaryToBinary(denary);
    }
};

