const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const requiredIds = [
  'workingArea',
  'calculatorDisplay',
  'calculatorButtons',
  'useResultBtn',
  'copyWorkingBtn',
  'resetWorkingBtn',
  'calcHistory'
];

requiredIds.forEach(id => {
  const needle = `id="${id}"`;
  if (!html.includes(needle)) {
    throw new Error(`Missing ${needle} in index.html`);
  }
});

if (!html.includes('data-value="%"')) {
  throw new Error('Missing percent button in calculator');
}

console.log('Calculation UI elements present.');
