const { evaluateExpression } = require('../calculator');

const cases = [
  { expr: '2+2', expected: 4 },
  { expr: '10/4', expected: 2.5 },
  { expr: '(8-3)*2', expected: 10 },
  { expr: '3 + 4 * 2', expected: 11 },
  { expr: '7*(2+3)/5', expected: 7 },
  { expr: '50%', expected: 0.5 },
  { expr: '200*10%', expected: 20 }
];

cases.forEach(({ expr, expected }) => {
  const result = evaluateExpression(expr);
  if (result !== expected) {
    throw new Error(`Expected ${expr} = ${expected}, got ${result}`);
  }
});

let errorCount = 0;
['', '2+bad', '2**3'].forEach(expr => {
  try {
    evaluateExpression(expr);
  } catch (error) {
    errorCount += 1;
  }
});

if (errorCount !== 3) {
  throw new Error('Invalid expressions should throw errors');
}

console.log('Calculator evaluation tests passed.');
