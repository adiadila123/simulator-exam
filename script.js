// Application State
let currentSet = 'random';
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let score = 0;
let startTime = null;
let timerInterval = null;
let timeRemaining = 50 * 60;
let isTimedMode = true;
let instantFeedback = true;
let allSetsLoaded = false;
let examSets = {};
const questionSetCount = 10;
let workingNotes = {};
let calculatorHistory = {};
let reviewMode = false;
let reviewIndices = [];
let reviewPosition = 0;

// DOM Elements
let selectionScreen, quizScreen, resultsScreen;
let startBtn, exitBtn, prevBtn, nextBtn, finishBtn;
let reviewBtn, retryBtn, newExamBtn;
let calculationInput, submitCalcBtn, setSelect;
let workingArea, calculatorDisplay, calculatorButtons, useResultBtn;
let copyWorkingBtn, resetWorkingBtn, calcHistoryList;

// Încarcă toate seturile de întrebări
async function loadAllQuestionSets() {
    try {
        console.log('Loading question sets...');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Questions...';
        }

        examSets = {};
        const setRequests = [];
        for (let setNum = 1; setNum <= questionSetCount; setNum++) {
            const path = `data/set${setNum}.json`;
            setRequests.push(
                fetch(path)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load ${path} (status ${response.status})`);
                        }
                        return response.json();
                    })
                    .then(data => ({ setNum, data, path }))
            );
        }

        const results = await Promise.all(setRequests);
        results.forEach(({ setNum, data, path }) => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`Invalid or empty data in ${path}`);
            }
            examSets[`set${setNum}`] = data;
        });

        allSetsLoaded = true;

        // Activează butonul de start
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Mock Exam';
        }

        console.log(`Loaded ${Object.keys(examSets).length} sets from JSON files`);

    } catch (error) {
        console.error('Error loading question sets:', error);
        allSetsLoaded = false;
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to load questions';
        }
        alert('Question files failed to load. Please refresh the page or check the data files.');
    }
}

// Generator de întrebări pentru toate seturile
function generateAllQuestionSets() {
    examSets = {};

    for (let setNum = 1; setNum <= 10; setNum++) {
        const questions = [];
        const topics = [
            "Introduction", "Demand", "Supply", "Elasticity", "Market Equilibrium",
            "Costs", "Perfect Competition", "Monopoly", "Oligopoly", "Externalities",
            "Public Goods", "Trade", "Game Theory", "Consumer Theory", "Producer Theory"
        ];

        for (let qNum = 1; qNum <= 20; qNum++) {
            const id = (setNum * 100) + qNum;
            const topic = topics[Math.floor(Math.random() * topics.length)];
            const difficulty = Math.random() < 0.4 ? "easy" : Math.random() < 0.7 ? "medium" : "hard";
            const type = Math.random() < 0.6 ? "multiple" : Math.random() < 0.8 ? "truefalse" : "calculation";

            let question = {
                id: id,
                type: type,
                text: `Question ${qNum} for Set ${setNum}: This question covers ${topic}. Difficulty: ${difficulty}.`,
                topic: topic,
                difficulty: difficulty,
                explanation: `This is the explanation for question ${qNum} in Set ${setNum}. The correct answer is based on ${topic} principles.`
            };

            if (type === "multiple") {
                question.options = [
                    "Option A: Incorrect answer",
                    "Option B: Correct answer",
                    "Option C: Incorrect answer",
                    "Option D: Incorrect answer"
                ];
                question.correct = 1;
            } else if (type === "truefalse") {
                question.correct = Math.random() < 0.5;
            } else {
                // calculation question
                question.correct = Math.floor(Math.random() * 100) + 1;
                question.tolerance = 0.1;
            }

            questions.push(question);
        }

        examSets[`set${setNum}`] = questions;
    }

    allSetsLoaded = true;
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Mock Exam';
    }
}

// Initializează toate elementele și event listeners
function initializeApp() {
    console.log('Initializing application...');

    // Initializează toate variabilele DOM
    selectionScreen = document.getElementById('selectionScreen');
    quizScreen = document.getElementById('quizScreen');
    resultsScreen = document.getElementById('resultsScreen');
    startBtn = document.getElementById('startBtn');
    exitBtn = document.getElementById('exitBtn');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    finishBtn = document.getElementById('finishBtn');
    reviewBtn = document.getElementById('reviewBtn');
    retryBtn = document.getElementById('retryBtn');
    newExamBtn = document.getElementById('newExamBtn');
    calculationInput = document.getElementById('calculationInput');
    submitCalcBtn = document.getElementById('submitCalcBtn');
    setSelect = document.getElementById('setSelect');
    workingArea = document.getElementById('workingArea');
    calculatorDisplay = document.getElementById('calculatorDisplay');
    calculatorButtons = document.getElementById('calculatorButtons');
    useResultBtn = document.getElementById('useResultBtn');
    copyWorkingBtn = document.getElementById('copyWorkingBtn');
    resetWorkingBtn = document.getElementById('resetWorkingBtn');
    calcHistoryList = document.getElementById('calcHistory');

    console.log('DOM elements initialized:', {
        selectionScreen: !!selectionScreen,
        quizScreen: !!quizScreen,
        resultsScreen: !!resultsScreen,
        startBtn: !!startBtn,
        exitBtn: !!exitBtn,
        finishBtn: !!finishBtn
    });

    // Verifică dacă toate elementele necesare există
    if (!startBtn || !exitBtn || !finishBtn) {
        console.error('Critical DOM elements missing!');
        alert('Error: Application could not initialize properly. Please refresh the page.');
        return;
    }

    // Module Selection
    document.querySelectorAll('.module-card').forEach(card => {
        card.addEventListener('click', function () {
            document.querySelectorAll('.module-card').forEach(c => {
                c.style.borderColor = '#e0e0e0';
                c.style.backgroundColor = 'white';
            });

            this.style.borderColor = '#4CAF50';
            this.style.backgroundColor = '#f0f9f0';

            const moduleName = this.dataset.module === 'micro1' ? 'Microeconomics I' :
                this.dataset.module === 'micro2' ? 'Microeconomics II' : 'Mixed Exam';
            document.getElementById('currentModule').textContent = moduleName;
        });
    });

    // Select mixed questions by default
    const mixedCard = document.querySelector('.module-card[data-module="mixed"]');
    if (mixedCard) {
        mixedCard.style.borderColor = '#4CAF50';
        mixedCard.style.backgroundColor = '#f0f9f0';
        document.getElementById('currentModule').textContent = 'Mixed Exam';
    }

    // Start Exam Button
    startBtn.addEventListener('click', startExam);

    // Exit Exam Button
    exitBtn.addEventListener('click', function () {
        if (reviewMode) {
            quizScreen.style.display = 'none';
            resultsScreen.style.display = 'block';
            return;
        }
        if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
            clearInterval(timerInterval);
            quizScreen.style.display = 'none';
            selectionScreen.style.display = 'block';
        }
    });

    // Navigation Buttons
    prevBtn.addEventListener('click', prevQuestion);
    nextBtn.addEventListener('click', nextQuestion);

    // Finish Exam Button
    finishBtn.addEventListener('click', function () {
        if (reviewMode) {
            quizScreen.style.display = 'none';
            resultsScreen.style.display = 'block';
            return;
        }
        if (confirm('Finish exam and see results?')) {
            finishExam();
        }
    });

    // Results Screen Buttons
    reviewBtn.addEventListener('click', function () {
        reviewIndices = currentQuestions
            .map((question, index) => ({ question, index }))
            .filter(({ index }) => userAnswers[index] && !userAnswers[index].isCorrect)
            .map(({ index }) => index);

        if (reviewIndices.length === 0) {
            alert('No incorrect answers to review.');
            return;
        }

        reviewMode = true;
        reviewPosition = 0;
        currentQuestionIndex = reviewIndices[reviewPosition];
        quizScreen.style.display = 'block';
        resultsScreen.style.display = 'none';
        loadQuestion();
    });

    retryBtn.addEventListener('click', function () {
        startExam();
    });

    newExamBtn.addEventListener('click', function () {
        reviewMode = false;
        resultsScreen.style.display = 'none';
        selectionScreen.style.display = 'block';
    });

    // Calculation Submit Button
    submitCalcBtn.addEventListener('click', submitCalculationAnswer);

    // Enter key for calculation input
    calculationInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            submitCalculationAnswer();
        }
    });

    // Working area notes
    if (workingArea) {
        workingArea.addEventListener('input', function () {
            workingNotes[currentQuestionIndex] = workingArea.value;
        });
    }

    if (copyWorkingBtn) {
        copyWorkingBtn.addEventListener('click', function () {
            if (!workingArea) return;
            const candidate = extractAnswerFromWorkingArea(workingArea.value);
            if (!candidate) return;
            calculationInput.value = candidate;
            calculationInput.focus();
        });
    }

    if (resetWorkingBtn) {
        resetWorkingBtn.addEventListener('click', function () {
            if (!workingArea) return;
            workingArea.value = '';
            workingNotes[currentQuestionIndex] = '';
        });
    }

    // Calculator buttons
    if (calculatorButtons) {
        calculatorButtons.addEventListener('click', function (e) {
            const button = e.target.closest('button');
            if (!button || button.disabled) return;

            const action = button.getAttribute('data-action');
            const value = button.getAttribute('data-value');

            if (action === 'clear') {
                calculatorDisplay.value = '';
                return;
            }

            if (action === 'backspace') {
                calculatorDisplay.value = calculatorDisplay.value.slice(0, -1);
                return;
            }

            if (action === 'equals') {
                evaluateCalculator();
                return;
            }

            if (value) {
                calculatorDisplay.value += value;
            }
        });
    }

    if (calcHistoryList) {
        calcHistoryList.addEventListener('click', function (e) {
            const button = e.target.closest('button');
            if (!button || button.disabled) return;
            if (userAnswers[currentQuestionIndex]) return;
            const result = button.getAttribute('data-result');
            if (!result) return;
            calculatorDisplay.value = result;
            calculatorDisplay.focus();
        });
    }

    if (calculatorDisplay) {
        calculatorDisplay.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                evaluateCalculator();
            }
        });
    }

    if (useResultBtn) {
        useResultBtn.addEventListener('click', function () {
            const result = calculatorDisplay.value.trim();
            if (!result) return;
            calculationInput.value = result;
            calculationInput.focus();
        });
    }

    // True/False Buttons
    document.querySelectorAll('.btn-tf').forEach(btn => {
        btn.addEventListener('click', function () {
            const isTrue = this.dataset.answer === 'true';
            selectTrueFalse(isTrue);
        });
    });

    console.log('All event listeners initialized successfully!');
}

// Start Exam Function
async function startExam() {
    if (!allSetsLoaded) {
        alert('Questions are still loading. Please wait...');
        return;
    }

    // Get settings
    isTimedMode = document.getElementById('timedMode').checked;
    instantFeedback = document.getElementById('instantFeedback').checked;
    currentSet = setSelect.value;

    // Select questions based on settings
    let selectedSetName;
    if (currentSet === 'random') {
        const setKeys = Object.keys(examSets);
        selectedSetName = setKeys[Math.floor(Math.random() * setKeys.length)];
        currentQuestions = [...examSets[selectedSetName]];
        document.getElementById('resultsSubtitle').textContent = `Set ${selectedSetName.replace('set', '')} - Random Exam`;
    } else {
        selectedSetName = `set${currentSet}`;
        if (examSets[selectedSetName] && examSets[selectedSetName].length > 0) {
            currentQuestions = [...examSets[selectedSetName]];
            document.getElementById('resultsSubtitle').textContent = `Set ${currentSet} - Mock Exam`;
        } else {
            alert(`Set ${currentSet} is not available. Please select another set.`);
            return;
        }
    }

    // Verify we have enough questions
    if (currentQuestions.length < 10) {
        alert(`Only ${currentQuestions.length} questions available. Need at least 10.`);
        return;
    }

    // Take only 20 questions if more available
    if (currentQuestions.length > 20) {
        currentQuestions = getRandomQuestions(currentQuestions, 20);
    }

    // Reset state
    currentQuestionIndex = 0;
    userAnswers = {};
    score = 0;
    workingNotes = {};
    calculatorHistory = {};
    reviewMode = false;
    reviewIndices = [];
    reviewPosition = 0;
    timeRemaining = isTimedMode ? 50 * 60 : 99999;

    // Mark all questions as not answered
    currentQuestions.forEach(q => q.answered = false);

    // Update UI
    const setInfo = currentSet === 'random' ? 'Random Set' : `Set ${currentSet}`;
    document.getElementById('currentModule').textContent =
        document.getElementById('currentModule').textContent.split(' - ')[0] + ` - ${setInfo}`;

    // Switch screens
    selectionScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    resultsScreen.style.display = 'none';

    // Start timer if timed mode
    if (isTimedMode) {
        startTimer();
    }

    // Load first question
    loadQuestion();
}

// Get random questions
function getRandomQuestions(questions, count) {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Load question
function loadQuestion() {
    if (!currentQuestions[currentQuestionIndex]) {
        console.error('No question at index:', currentQuestionIndex);
        return;
    }

    const question = currentQuestions[currentQuestionIndex];
    const questionNumber = reviewMode ? reviewPosition + 1 : currentQuestionIndex + 1;
    const totalQuestions = reviewMode ? reviewIndices.length : currentQuestions.length;

    // Update progress
    const progress = (questionNumber / totalQuestions) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;

    // Update question number
    document.getElementById('questionNumber').textContent = reviewMode
        ? `Review ${questionNumber} of ${totalQuestions} (Question ${currentQuestionIndex + 1})`
        : `Question ${questionNumber} of ${currentQuestions.length}`;

    // Update question type
    let typeText = '';
    switch (question.type) {
        case 'multiple': typeText = 'Multiple Choice'; break;
        case 'truefalse': typeText = 'True/False'; break;
        case 'calculation': typeText = 'Calculation'; break;
    }
    document.getElementById('questionType').textContent = typeText;

    // Update question text
    document.getElementById('questionText').textContent = question.text;

    // Show topic and difficulty
    const topicInfo = `${question.topic} | Difficulty: ${question.difficulty}`;
    document.getElementById('topicInfo').textContent = topicInfo;

    // Hide all containers
    document.getElementById('optionsContainer').style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
    document.getElementById('calculationContainer').style.display = 'none';
    document.getElementById('feedbackContainer').style.display = 'none';

    // Show appropriate container and load content
    if (question.type === 'multiple') {
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.style.display = 'grid';
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';

            // Check if answered and if correct/incorrect
            if (userAnswers[currentQuestionIndex]) {
                if (index === question.correct) {
                    optionDiv.classList.add('correct');
                } else if (index === userAnswers[currentQuestionIndex].answer) {
                    optionDiv.classList.add('incorrect');
                }
            } else if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].answer === index) {
                optionDiv.classList.add('selected');
            }

            optionDiv.innerHTML = `
                <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option}</div>
            `;

            // Only allow clicking if not already answered
            if (!userAnswers[currentQuestionIndex]) {
                optionDiv.addEventListener('click', () => selectOption(index));
                optionDiv.style.cursor = 'pointer';
            } else {
                optionDiv.style.cursor = 'default';
            }

            optionsContainer.appendChild(optionDiv);
        });
    }
    else if (question.type === 'truefalse') {
        const tfContainer = document.getElementById('trueFalseContainer');
        tfContainer.style.display = 'flex';

        // Reset buttons
        document.querySelectorAll('.btn-tf').forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
        });

        // Set correct/incorrect if answered
        if (userAnswers[currentQuestionIndex]) {
            const isCorrect = userAnswers[currentQuestionIndex].isCorrect;
            const userAnswer = userAnswers[currentQuestionIndex].answer;

            // Highlight correct answer
            if (question.correct === true) {
                document.querySelector('.btn-tf[data-answer="true"]').classList.add('correct');
            } else {
                document.querySelector('.btn-tf[data-answer="false"]').classList.add('correct');
            }

            // Highlight user's answer
            if (userAnswer === true) {
                document.querySelector('.btn-tf[data-answer="true"]').classList.add('selected');
                if (!isCorrect) {
                    document.querySelector('.btn-tf[data-answer="true"]').classList.add('incorrect');
                }
            } else {
                document.querySelector('.btn-tf[data-answer="false"]').classList.add('selected');
                if (!isCorrect) {
                    document.querySelector('.btn-tf[data-answer="false"]').classList.add('incorrect');
                }
            }
        }
    }
    else if (question.type === 'calculation') {
        const calcContainer = document.getElementById('calculationContainer');
        calcContainer.style.display = 'flex';
        calculationInput.value = userAnswers[currentQuestionIndex]?.answer || '';
        const isAnswered = !!userAnswers[currentQuestionIndex];
        calculationInput.disabled = isAnswered;
        submitCalcBtn.disabled = isAnswered;
        if (workingArea) {
            workingArea.value = workingNotes[currentQuestionIndex] || '';
            workingArea.disabled = isAnswered;
        }
        if (copyWorkingBtn) copyWorkingBtn.disabled = isAnswered;
        if (resetWorkingBtn) resetWorkingBtn.disabled = isAnswered;
        if (calculatorDisplay) {
            calculatorDisplay.value = '';
            calculatorDisplay.disabled = isAnswered;
        }
        if (calculatorButtons) {
            calculatorButtons.querySelectorAll('button').forEach(button => {
                button.disabled = isAnswered;
            });
        }
        if (useResultBtn) {
            useResultBtn.disabled = isAnswered;
        }
        renderCalculatorHistory(isAnswered);
    }

    // Update navigation buttons
    prevBtn.disabled = reviewMode ? reviewPosition === 0 : currentQuestionIndex === 0;
    nextBtn.disabled = reviewMode ? reviewPosition === totalQuestions - 1 : currentQuestionIndex === currentQuestions.length - 1;
    finishBtn.style.display = reviewMode ? 'none' : 'inline-flex';

    // Update current score
    const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
    document.getElementById('currentScore').textContent = `Score: ${correctCount}/${currentQuestions.length}`;

    // Show feedback if instant feedback is enabled and answer exists
    if (instantFeedback && userAnswers[currentQuestionIndex]) {
        showFeedback(
            userAnswers[currentQuestionIndex].isCorrect,
            question.explanation,
            question.correct,
            question.options,
            question.steps
        );
    }
}

// Select option for multiple choice
function selectOption(optionIndex) {
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = optionIndex === question.correct;

    // Store answer
    userAnswers[currentQuestionIndex] = {
        answer: optionIndex,
        isCorrect: isCorrect,
        questionId: question.id
    };

    // Update score if this is first time answering
    if (isCorrect && !question.answered) {
        score++;
        question.answered = true;
    }

    // Update UI
    document.querySelectorAll('.option').forEach((opt, idx) => {
        opt.classList.remove('selected');
        if (idx === optionIndex) {
            opt.classList.add('selected');
        }
        if (idx === question.correct) {
            opt.classList.add('correct');
        } else if (idx === optionIndex && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    // Show feedback if instant feedback is enabled
    if (instantFeedback) {
        showFeedback(isCorrect, question.explanation, question.correct, question.options, question.steps);
    }

    // No auto-advance; user navigates manually
}

// Select true/false
function selectTrueFalse(isTrue) {
    if (reviewMode) return;
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = isTrue === question.correct;

    // Store answer
    userAnswers[currentQuestionIndex] = {
        answer: isTrue,
        isCorrect: isCorrect,
        questionId: question.id
    };

    // Update score if this is first time answering
    if (isCorrect && !question.answered) {
        score++;
        question.answered = true;
    }

    // Update UI
    document.querySelectorAll('.btn-tf').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.answer === 'true' && question.correct === true) {
            btn.classList.add('correct');
        } else if (btn.dataset.answer === 'false' && question.correct === false) {
            btn.classList.add('correct');
        }
    });

    const selectedBtn = document.querySelector(`.btn-tf[data-answer="${isTrue}"]`);
    selectedBtn.classList.add('selected');
    if (!isCorrect) {
        selectedBtn.classList.add('incorrect');
    }

    // Show feedback if instant feedback is enabled
    if (instantFeedback) {
        showFeedback(isCorrect, question.explanation, question.correct, null, question.steps);
    }

    // No auto-advance; user navigates manually
}

function addCalculatorHistory(expression, result) {
    if (!expression) return;
    const key = currentQuestionIndex;
    if (!calculatorHistory[key]) {
        calculatorHistory[key] = [];
    }
    calculatorHistory[key].push({
        expression,
        result
    });
    if (calculatorHistory[key].length > 20) {
        calculatorHistory[key].shift();
    }
    renderCalculatorHistory(false);
}

function renderCalculatorHistory(isAnswered) {
    if (!calcHistoryList) return;
    const entries = calculatorHistory[currentQuestionIndex] || [];
    calcHistoryList.innerHTML = '';

    if (!entries.length) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No calculations yet';
        emptyItem.className = 'calc-history-empty';
        calcHistoryList.appendChild(emptyItem);
        return;
    }

    entries.slice().reverse().forEach(entry => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'calc-history-item';
        button.textContent = `${entry.expression} = ${entry.result}`;
        button.setAttribute('data-result', entry.result);
        button.disabled = !!isAnswered;
        item.appendChild(button);
        calcHistoryList.appendChild(item);
    });
}

function extractAnswerFromWorkingArea(text) {
    if (!text) return '';
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.split('=');
    const candidate = parts[parts.length - 1].trim();
    return candidate || lastLine;
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderCalculationSteps(steps) {
    if (!Array.isArray(steps) || steps.length === 0) return '';
    const items = steps.map(step => `<li>${escapeHtml(step)}</li>`).join('');
    return `
        <div class="calc-steps">
            <div class="calc-steps-title">Worked calculation:</div>
            <ol>${items}</ol>
        </div>
    `;
}

// Calculator evaluation
function evaluateCalculator() {
    if (!calculatorDisplay) return;
    const expression = calculatorDisplay.value.trim();
    if (!expression) return;

    if (!window.Calculator || typeof window.Calculator.evaluateExpression !== 'function') {
        alert('Calculator is unavailable.');
        return;
    }

    try {
        const result = window.Calculator.evaluateExpression(expression);
        calculatorDisplay.value = result.toString();
        addCalculatorHistory(expression, result);
    } catch (error) {
        alert('Invalid calculation. Please check the expression.');
    }
}

// Submit calculation answer
function submitCalculationAnswer() {
    const userAnswer = calculationInput.value.trim();
    if (!userAnswer) {
        alert('Please enter an answer');
        return;
    }

    const question = currentQuestions[currentQuestionIndex];
    let isCorrect = false;

    // Handle different answer types
    if (typeof question.correct === 'number') {
        const userNum = parseFloat(userAnswer);
        if (!isNaN(userNum)) {
            const tolerance = question.tolerance || 0.1;
            isCorrect = Math.abs(userNum - question.correct) <= tolerance;
        }
    }
    else if (typeof question.correct === 'string') {
        const cleanUserAnswer = userAnswer.toLowerCase().trim();
        const cleanCorrectAnswer = question.correct.toLowerCase().trim();
        isCorrect = cleanUserAnswer === cleanCorrectAnswer;
    }
    else if (typeof question.correct === 'boolean') {
        const userBool = userAnswer.toLowerCase();
        isCorrect = (userBool === 'true' && question.correct === true) ||
            (userBool === 'false' && question.correct === false);
    }

    // Store answer
    userAnswers[currentQuestionIndex] = {
        answer: userAnswer,
        isCorrect: isCorrect,
        questionId: question.id,
        working: workingNotes[currentQuestionIndex] || ''
    };

    // Update score if this is first time answering
    if (isCorrect && !question.answered) {
        score++;
        question.answered = true;
    }

    // Disable input after submission
    calculationInput.disabled = true;
    submitCalcBtn.disabled = true;
    if (workingArea) workingArea.disabled = true;
    if (copyWorkingBtn) copyWorkingBtn.disabled = true;
    if (resetWorkingBtn) resetWorkingBtn.disabled = true;
    if (calculatorDisplay) calculatorDisplay.disabled = true;
    if (calculatorButtons) {
        calculatorButtons.querySelectorAll('button').forEach(button => {
            button.disabled = true;
        });
    }
    if (useResultBtn) useResultBtn.disabled = true;
    renderCalculatorHistory(true);

    // Show feedback if instant feedback is enabled
    if (instantFeedback) {
        showFeedback(isCorrect, question.explanation, question.correct, null, question.steps);
    }

    // No auto-advance; user navigates manually
}

// Show feedback
function showFeedback(isCorrect, explanation, correctAnswer, options, steps) {
    const feedbackContainer = document.getElementById('feedbackContainer');
    feedbackContainer.style.display = 'block';

    const stepsHtml = renderCalculationSteps(steps);

    if (isCorrect) {
        document.getElementById('correctFeedback').style.display = 'flex';
        document.getElementById('incorrectFeedback').style.display = 'none';
        document.getElementById('correctExplanation').innerHTML = `
            <strong>Correct!</strong><br><br>
            <strong>Why it is correct:</strong> ${explanation}
            ${stepsHtml}
        `;
    } else {
        document.getElementById('correctFeedback').style.display = 'none';
        document.getElementById('incorrectFeedback').style.display = 'flex';

        let correctAnswerText = '';
        if (typeof correctAnswer === 'number') {
            if (options && options[correctAnswer]) {
                correctAnswerText = `${String.fromCharCode(65 + correctAnswer)}. ${options[correctAnswer]}`;
            } else {
                correctAnswerText = correctAnswer.toString();
            }
        } else if (typeof correctAnswer === 'boolean') {
            correctAnswerText = correctAnswer ? 'True' : 'False';
        } else if (typeof correctAnswer === 'string') {
            correctAnswerText = correctAnswer;
        } else {
            correctAnswerText = `Option ${String.fromCharCode(65 + correctAnswer)}`;
        }

        document.getElementById('incorrectExplanation').innerHTML = `
            <strong>Correct answer:</strong> ${correctAnswerText}<br><br>
            <span class="correct-explanation"><strong>How it should have been answered:</strong> ${explanation}</span>
            ${stepsHtml}
        `;
    }
}

// Navigation functions
function nextQuestion() {
    if (reviewMode) {
        if (reviewPosition < reviewIndices.length - 1) {
            reviewPosition++;
            currentQuestionIndex = reviewIndices[reviewPosition];
            loadQuestion();
        }
        return;
    }
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function prevQuestion() {
    if (reviewMode) {
        if (reviewPosition > 0) {
            reviewPosition--;
            currentQuestionIndex = reviewIndices[reviewPosition];
            loadQuestion();
        }
        return;
    }
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

// Timer functions
function startTimer() {
    startTime = new Date();
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            finishExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timerElement = document.getElementById('quizTimer');
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update timer color based on remaining time
    const timeBox = document.querySelector('.time-box');
    if (timeBox) {
        timeBox.classList.remove('warning', 'critical');

        if (timeRemaining < 300) {
            timeBox.classList.add('critical');
        } else if (timeRemaining < 600) {
            timeBox.classList.add('warning');
        }
    }
}

// Finish exam
function finishExam() {
    clearInterval(timerInterval);
    reviewMode = false;

    // Calculate final score
    const totalQuestions = currentQuestions.length;
    const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Calculate time taken
    const timeTaken = isTimedMode ? (50 * 60 - timeRemaining) : 0;
    const minutesTaken = Math.floor(timeTaken / 60);
    const secondsTaken = timeTaken % 60;

    // Update results screen
    document.getElementById('finalScore').textContent = percentage;
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('totalCount').textContent = totalQuestions;
    document.getElementById('timeTaken').textContent =
        isTimedMode ? `${minutesTaken}:${secondsTaken.toString().padStart(2, '0')}` : 'Not timed';
    document.getElementById('examDate').textContent = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Animate score circle
    const circle = document.querySelector('.score-arc');
    if (circle) {
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.setProperty('--dash-offset', offset);

        // Set circle color based on score
        if (percentage >= 70) {
            circle.style.stroke = '#4CAF50';
        } else if (percentage >= 50) {
            circle.style.stroke = '#f39c12';
        } else {
            circle.style.stroke = '#e74c3c';
        }
    }

    // Generate study tips
    generateStudyTips(percentage, currentQuestions, userAnswers);

    // Update localStorage with results
    updateStats(percentage, currentSet);

    // Switch to results screen
    quizScreen.style.display = 'none';
    resultsScreen.style.display = 'block';
}

// Generate personalized study tips
function generateStudyTips(score, questions, answers) {
    const tipsElement = document.getElementById('performanceTips');
    if (!tipsElement) return;

    tipsElement.innerHTML = '';

    // Analyze weak areas
    const topicPerformance = {};
    questions.forEach((q, index) => {
        const topic = q.topic;
        if (!topicPerformance[topic]) {
            topicPerformance[topic] = { correct: 0, total: 0 };
        }
        topicPerformance[topic].total++;
        if (answers[index] && answers[index].isCorrect) {
            topicPerformance[topic].correct++;
        }
    });

    // General tips
    const tips = [];

    // Score-based tips
    if (score < 50) {
        tips.push("<strong>Priority:</strong> Focus on fundamental concepts");
        tips.push("Review basic definitions and principles thoroughly");
        tips.push("Start with easier questions before tackling advanced topics");
    } else if (score < 70) {
        tips.push("<strong>Focus:</strong> Work on application problems");
        tips.push("Practise calculations and graph interpretations");
        tips.push("Time yourself during practice sessions");
    } else {
        tips.push("<strong>Excellent!</strong> Maintain your strong foundation");
        tips.push("Challenge yourself with complex scenarios");
        tips.push("Review any minor mistakes for perfection");
    }

    // Exam strategy tips
    tips.push("<strong>Exam Strategy:</strong> Read questions carefully");
    tips.push("Manage your time effectively during the exam");
    tips.push("Review answers if time permits");

    // Add all tips
    tips.forEach(tip => {
        const li = document.createElement('li');
        li.innerHTML = tip;
        tipsElement.appendChild(li);
    });
}

// Statistics management
function updateStats(newScore, setUsed) {
    let stats = JSON.parse(localStorage.getItem('economicsExamStats')) || {
        lastScore: 0,
        bestScore: 0,
        totalExams: 0,
        totalScore: 0
    };

    stats.lastScore = newScore;
    if (newScore > stats.bestScore) {
        stats.bestScore = newScore;
    }
    stats.totalExams++;
    stats.totalScore += newScore;

    localStorage.setItem('economicsExamStats', JSON.stringify(stats));

    updateStatsDisplay(stats);
}

function updateStatsDisplay(stats) {
    const lastScoreElem = document.getElementById('lastScore');
    const bestScoreElem = document.getElementById('bestScore');
    const averageScoreElem = document.getElementById('averageScore');

    if (lastScoreElem) lastScoreElem.textContent = `${stats.lastScore}%`;
    if (bestScoreElem) bestScoreElem.textContent = `${stats.bestScore}%`;

    const average = stats.totalExams > 0 ?
        Math.round(stats.totalScore / stats.totalExams) : 0;
    if (averageScoreElem) averageScoreElem.textContent = `${average}%`;
}

// Run when page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing application...');

    // Initialize the app
    initializeApp();

    // Load stats
    const stats = JSON.parse(localStorage.getItem('economicsExamStats')) || {
        lastScore: 0,
        bestScore: 0,
        totalExams: 0,
        totalScore: 0
    };
    updateStatsDisplay(stats);

    // Load questions from JSON files
    loadAllQuestionSets();

    console.log('Application fully initialized and ready!');
});
