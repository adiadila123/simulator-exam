const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(name => /^set\d+\.json$/.test(name)).sort();

if (files.length !== 10) {
  throw new Error(`Expected 10 set files, found ${files.length}: ${files.join(', ')}`);
}

const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;

files.forEach(file => {
  const fullPath = path.join(dataDir, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${file} is empty or not an array`);
  }

  data.forEach((q, index) => {
    if (typeof q !== 'object' || q === null) {
      throw new Error(`${file} question ${index} is not an object`);
    }

    if (typeof q.id !== 'number') {
      throw new Error(`${file} question ${index} has invalid id`);
    }

    if (!isNonEmptyString(q.type) || !['multiple', 'truefalse', 'calculation'].includes(q.type)) {
      throw new Error(`${file} question ${index} has invalid type`);
    }

    if (!isNonEmptyString(q.text)) {
      throw new Error(`${file} question ${index} has invalid text`);
    }

    if (!isNonEmptyString(q.explanation)) {
      throw new Error(`${file} question ${index} has invalid explanation`);
    }

    if (!isNonEmptyString(q.topic)) {
      throw new Error(`${file} question ${index} has invalid topic`);
    }

    if (!isNonEmptyString(q.difficulty)) {
      throw new Error(`${file} question ${index} has invalid difficulty`);
    }

    if (q.type === 'multiple') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`${file} question ${index} has invalid options`);
      }
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
        throw new Error(`${file} question ${index} has invalid correct index`);
      }
    }

    if (q.type === 'truefalse') {
      if (typeof q.correct !== 'boolean') {
        throw new Error(`${file} question ${index} has invalid correct boolean`);
      }
    }

    if (q.type === 'calculation') {
      if (typeof q.correct !== 'number' && typeof q.correct !== 'string') {
        throw new Error(`${file} question ${index} has invalid correct value`);
      }
      if (!Array.isArray(q.steps) || q.steps.length === 0) {
        throw new Error(`${file} question ${index} is missing steps`);
      }
      q.steps.forEach((step, stepIndex) => {
        if (!isNonEmptyString(step)) {
          throw new Error(`${file} question ${index} has invalid step at ${stepIndex}`);
        }
      });
    }
  });
});

console.log('All question set files look valid.');
