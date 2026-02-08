(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Calculator = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function isValidExpression(expression) {
        return /^[0-9+\-*/().%\s]+$/.test(expression);
    }

    function evaluateExpression(expression) {
        if (typeof expression !== 'string') {
            throw new Error('Expression must be a string');
        }

        const trimmed = expression.trim();
        if (!trimmed) {
            throw new Error('Expression is empty');
        }

        if (!isValidExpression(trimmed)) {
            throw new Error('Expression contains invalid characters');
        }

        if (trimmed.includes('**') || trimmed.includes('//')) {
            throw new Error('Expression contains unsupported operators');
        }

        const normalised = trimmed.replace(/%/g, '/100');
        const result = Function(`"use strict"; return (${normalised});`)();
        if (!Number.isFinite(result)) {
            throw new Error('Expression did not evaluate to a finite number');
        }

        return Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
    }

    return {
        evaluateExpression
    };
}));
