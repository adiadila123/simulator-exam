const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const scriptPath = path.join(__dirname, '..', 'script.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const script = fs.readFileSync(scriptPath, 'utf8');

if (!html.includes('Review Incorrect Answers')) {
  throw new Error('Missing review button label for incorrect answers');
}

['reviewMode', 'reviewIndices', 'reviewPosition'].forEach(token => {
  if (!script.includes(token)) {
    throw new Error(`Missing ${token} in script.js`);
  }
});

console.log('Review mode wiring checks passed.');
