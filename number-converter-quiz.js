// Number Converter Quiz Module
// Generates random conversion challenges

const NumberConverterQuiz = {
    // Generate a random conversion challenge
    generateChallenge() {
        const conversionTypes = [
            'denaryToBinary',
            'denaryToHexadecimal',
            'binaryToDenary',
            'binaryToHexadecimal',
            'hexadecimalToDenary',
            'hexadecimalToBinary'
        ];

        const type = conversionTypes[Math.floor(Math.random() * conversionTypes.length)];
        let question, answer, fromFormat, toFormat;

        switch (type) {
            case 'denaryToBinary':
                question = Math.floor(Math.random() * 256); // 0-255
                answer = NumberConverter.denaryToBinary(question);
                fromFormat = 'Denary';
                toFormat = 'Binary';
                break;

            case 'denaryToHexadecimal':
                question = Math.floor(Math.random() * 256); // 0-255
                answer = NumberConverter.denaryToHexadecimal(question);
                fromFormat = 'Denary';
                toFormat = 'Hexadecimal';
                break;

            case 'binaryToDenary':
                const denaryForBinary = Math.floor(Math.random() * 256); // 0-255
                question = NumberConverter.denaryToBinary(denaryForBinary);
                answer = denaryForBinary;
                fromFormat = 'Binary';
                toFormat = 'Denary';
                break;

            case 'binaryToHexadecimal':
                const denaryForBinaryHex = Math.floor(Math.random() * 256); // 0-255
                question = NumberConverter.denaryToBinary(denaryForBinaryHex);
                answer = NumberConverter.denaryToHexadecimal(denaryForBinaryHex);
                fromFormat = 'Binary';
                toFormat = 'Hexadecimal';
                break;

            case 'hexadecimalToDenary':
                const denaryForHex = Math.floor(Math.random() * 256); // 0-255
                question = NumberConverter.denaryToHexadecimal(denaryForHex);
                answer = denaryForHex;
                fromFormat = 'Hexadecimal';
                toFormat = 'Denary';
                break;

            case 'hexadecimalToBinary':
                const denaryForHexBinary = Math.floor(Math.random() * 256); // 0-255
                question = NumberConverter.denaryToHexadecimal(denaryForHexBinary);
                answer = NumberConverter.denaryToBinary(denaryForHexBinary);
                fromFormat = 'Hexadecimal';
                toFormat = 'Binary';
                break;
        }

        return {
            question: question.toString(),
            answer: answer.toString().toUpperCase(),
            fromFormat: fromFormat,
            toFormat: toFormat,
            type: type
        };
    },

    // Generate 10 random challenges
    generateQuiz() {
        const challenges = [];
        for (let i = 0; i < 10; i++) {
            challenges.push(this.generateChallenge());
        }
        return challenges;
    },

    // Check if answer is correct (case-insensitive, whitespace-tolerant)
    checkAnswer(challenge, userAnswer) {
        const normalizedUser = userAnswer.trim().toUpperCase();
        const normalizedCorrect = challenge.answer.trim().toUpperCase();
        return normalizedUser === normalizedCorrect;
    }
};

