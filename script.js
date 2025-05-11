// Typing content database
const typingContent = {
    easy: [
        "The quick brown fox jumps over the lazy dog.",
        "Practice makes perfect when learning to type.",
        "Every day is a new opportunity to improve.",
        "Typing quickly and accurately is a valuable skill.",
        "Computers are incredibly fast, accurate, and stupid.",
        "The best way to predict the future is to invent it.",
        "Simple things should be simple, complex things should be possible.",
        "Any sufficiently advanced technology is indistinguishable from magic."
    ],
    medium: [
        "Programming is the art of telling another human what one wants the computer to do. - Donald Knuth",
        "The most disastrous thing that you can ever learn is your first programming language. - Alan Kay",
        "The best way to predict the future is to invent it. - Alan Kay",
        "The computer was born to solve problems that did not exist before. - Bill Gates",
        "Measuring programming progress by lines of code is like measuring aircraft building progress by weight. - Bill Gates",
        "The Internet is becoming the town square for the global village of tomorrow. - Bill Gates",
        "Software is a great combination between artistry and engineering. - Bill Gates",
        "The advance of technology is based on making it fit in so that you don't really even notice it, so it's part of everyday life. - Bill Gates"
    ],
    hard: [
        "The juxtaposition of seemingly unrelated concepts often leads to innovative solutions in computer science, where abstract mathematical theories converge with practical engineering to create systems that transform how we interact with information.",
        "Quantum computing represents a paradigm shift in our computational capabilities, harnessing the counterintuitive properties of quantum mechanics to perform calculations that would be intractable for classical computers.",
        "The evolution of programming languages from machine code to high-level abstractions mirrors humanity's ongoing quest to bridge the gap between human cognition and mechanical computation.",
        "In the realm of artificial intelligence, the tension between symbolic reasoning and statistical learning approaches continues to shape the development of systems that can exhibit behaviors we would consider intelligent in humans.",
        "The fundamental theorem of software engineering states that we can solve any problem by introducing an extra level of indirection, except for the problem of too many levels of indirection.",
        "Distributed systems are characterized by the fact that the failure of a computer you didn't even know existed can render your own computer unusable.",
        "The most damaging phrase in the language is 'We've always done it this way!' when applied to software development practices and architectural decisions.",
        "Optimism is an occupational hazard of programming; feedback is the treatment."
    ]
};

// DOM elements
const elements = {
    textDisplay: document.getElementById('textDisplay'),
    textInput: document.getElementById('textInput'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    newTestBtn: document.getElementById('newTestBtn'),
    timer: document.getElementById('timer'),
    wpm: document.getElementById('wpm'),
    accuracy: document.getElementById('accuracy'),
    progress: document.getElementById('progress'),
    resultsPanel: document.getElementById('resultsPanel'),
    finalWpm: document.getElementById('finalWpm'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalTime: document.getElementById('finalTime'),
    finalChars: document.getElementById('finalChars'),
    difficulty: document.getElementById('difficulty'),
    duration: document.getElementById('duration'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    themeBtn: document.getElementById('themeBtn')
};

// State variables
let state = {
    activeMode: 'line',
    isRunning: false,
    startTime: null,
    endTime: null,
    timerInterval: null,
    currentText: '',
    typedText: '',
    correctChars: 0,
    totalChars: 0,
    currentLine: 0,
    lines: [],
    audioContext: null
};

// Initialize the app
function init() {
    // Event listeners
    elements.textInput.addEventListener('input', handleTyping);
    elements.startBtn.addEventListener('click', startTest);
    elements.resetBtn.addEventListener('click', resetTest);
    elements.newTestBtn.addEventListener('click', newTest);
    
    // Mode selection
    elements.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeMode = btn.dataset.mode;
            resetTest();
        });
    });
    
    // Theme toggle
    elements.themeBtn.addEventListener('click', toggleTheme);
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    if (savedTheme === 'dark') {
        addHackerEffects();
    }
    
    // Initialize audio context (for hacker sounds)
    if (window.AudioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Focus the start button for accessibility
    elements.startBtn.focus();
}

// Start a new typing test
function startTest() {
    // Get settings
    const difficulty = elements.difficulty.value;
    
    // Get random text based on difficulty
    const contentArray = typingContent[difficulty];
    state.currentText = contentArray[Math.floor(Math.random() * contentArray.length)];
    
    // Prepare text based on mode
    if (state.activeMode === 'line') {
        state.lines = state.currentText.split('. ').filter(line => line.length > 0);
        state.currentLine = 0;
        renderLineMode();
    } else {
        renderParagraphMode();
    }
    
    // Reset values
    state.typedText = '';
    state.correctChars = 0;
    state.totalChars = state.currentText.length;
    state.isRunning = true;
    state.startTime = new Date();
    
    // Update UI
    elements.textInput.value = '';
    elements.textInput.disabled = false;
    elements.textInput.focus();
    elements.startBtn.disabled = true;
    elements.resetBtn.disabled = false;
    
    // Start timer
    state.timerInterval = setInterval(updateTimer, 100);
    
    // Hide results panel if shown
    elements.resultsPanel.classList.add('hidden');
}

// Handle typing input
function handleTyping() {
    state.typedText = elements.textInput.value;
    
    // Play hacker sound in dark mode
    if (document.documentElement.getAttribute('data-theme') === 'dark' && state.audioContext) {
        playHackerSound();
    }
    
    // Calculate correctness
    let correct = 0;
    const compareText = state.activeMode === 'line' ? state.lines[state.currentLine] : state.currentText;
    
    for (let i = 0; i < state.typedText.length; i++) {
        if (state.typedText[i] === compareText[i]) {
            correct++;
        }
    }
    
    state.correctChars = correct;
    
    // Update display
    if (state.activeMode === 'line') {
        renderLineMode();
    } else {
        renderParagraphMode();
    }
    
    // Calculate and update stats
    updateStats();
    
    // Check for completion
    if (state.activeMode === 'line') {
        if (state.typedText === compareText) {
            if (state.currentLine < state.lines.length - 1) {
                // Move to next line
                setTimeout(() => {
                    state.currentLine++;
                    state.typedText = '';
                    elements.textInput.value = '';
                    renderLineMode();
                }, 500);
            } else {
                // All lines completed
                endTest();
            }
        }
    } else if (state.typedText.length === state.currentText.length) {
        // Paragraph completed
        endTest();
    }
}

// Render text in line mode
function renderLineMode() {
    if (state.lines.length === 0) return;
    
    const currentLine = state.lines[state.currentLine];
    const typedText = state.typedText;
    
    let displayHTML = '';
    
    // Previous lines
    for (let i = 0; i < state.currentLine; i++) {
        displayHTML += `<div class="completed-line">${state.lines[i]}.</div>`;
    }
    
    // Current line
    displayHTML += '<div class="current-line">';
    for (let i = 0; i < currentLine.length; i++) {
        if (i < typedText.length) {
            const charClass = typedText[i] === currentLine[i] ? 'correct' : 'incorrect';
            displayHTML += `<span class="${charClass}">${currentLine[i]}</span>`;
        } else if (i === typedText.length) {
            displayHTML += `<span class="current">${currentLine[i]}</span>`;
        } else {
            displayHTML += currentLine[i];
        }
    }
    displayHTML += '.</div>';
    
    // Next lines
    for (let i = state.currentLine + 1; i < state.lines.length; i++) {
        displayHTML += `<div class="pending-line">${state.lines[i]}.</div>`;
    }
    
    elements.textDisplay.innerHTML = displayHTML;
}

// Render text in paragraph mode
function renderParagraphMode() {
    const currentText = state.currentText;
    const typedText = state.typedText;
    
    let displayHTML = '';
    for (let i = 0; i < currentText.length; i++) {
        if (i < typedText.length) {
            const charClass = typedText[i] === currentText[i] ? 'correct' : 'incorrect';
            displayHTML += `<span class="${charClass}">${currentText[i]}</span>`;
        } else if (i === typedText.length) {
            displayHTML += `<span class="current">${currentText[i]}</span>`;
        } else {
            displayHTML += currentText[i];
        }
    }
    
    elements.textDisplay.innerHTML = displayHTML;
}

// Update timer and statistics
function updateStats() {
    // Calculate WPM (5 characters = 1 word)
    const timeInMinutes = (new Date() - state.startTime) / 60000;
    const words = state.correctChars / 5;
    const wpm = Math.round(words / timeInMinutes);
    
    // Calculate accuracy
    const accuracy = state.typedText.length > 0 
        ? Math.round((state.correctChars / state.typedText.length) * 100)
        : 0;
    
    // Calculate progress
    const progress = Math.round((state.typedText.length / state.totalChars) * 100);
    
    // Update UI
    elements.wpm.textContent = wpm;
    elements.accuracy.textContent = `${accuracy}%`;
    elements.progress.textContent = `${progress}%`;
}

// Update timer display
function updateTimer() {
    const currentTime = new Date();
    const elapsed = new Date(currentTime - state.startTime);
    const minutes = elapsed.getMinutes().toString().padStart(2, '0');
    const seconds = elapsed.getSeconds().toString().padStart(2, '0');
    const milliseconds = Math.floor(elapsed.getMilliseconds() / 100).toString();
    
    elements.timer.textContent = `${minutes}:${seconds}.${milliseconds}`;
}

// End the current test
function endTest() {
    clearInterval(state.timerInterval);
    state.endTime = new Date();
    state.isRunning = false;
    elements.textInput.disabled = true;
    
    // Calculate final stats
    const timeInMinutes = (state.endTime - state.startTime) / 60000;
    const words = state.correctChars / 5;
    const wpm = Math.round(words / timeInMinutes);
    const accuracy = state.typedText.length > 0 
        ? Math.round((state.correctChars / state.typedText.length) * 100)
        : 0;
    
    // Update final results
    elements.finalWpm.textContent = wpm;
    elements.finalAccuracy.textContent = `${accuracy}%`;
    elements.finalTime.textContent = elements.timer.textContent;
    elements.finalChars.textContent = state.typedText.length;
    
    // Show results panel
    elements.resultsPanel.classList.remove('hidden');
}

// Reset the current test
function resetTest() {
    clearInterval(state.timerInterval);
    
    // Reset state
    state.isRunning = false;
    state.startTime = null;
    state.endTime = null;
    state.typedText = '';
    state.correctChars = 0;
    state.totalChars = 0;
    state.currentLine = 0;
    state.lines = [];
    
    // Reset UI
    elements.textInput.value = '';
    elements.textInput.disabled = true;
    elements.timer.textContent = '00:00';
    elements.wpm.textContent = '0';
    elements.accuracy.textContent = '0%';
    elements.progress.textContent = '0%';
    elements.startBtn.disabled = false;
    elements.resetBtn.disabled = true;
    elements.textDisplay.innerHTML = '<div class="placeholder">Select a mode and click Start to begin</div>';
    
    // Hide results panel if shown
    elements.resultsPanel.classList.add('hidden');
}

// Start a new test after completion
function newTest() {
    resetTest();
    startTest();
}

// Theme functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    if (newTheme === 'dark') {
        addHackerEffects();
    } else {
        removeHackerEffects();
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeBtn i');
    if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

function addHackerEffects() {
    // Add cursor blink animation
    const style = document.createElement('style');
    style.id = 'hacker-effects';
    style.textContent = `
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        [data-theme="dark"] .current {
            animation: blink 1s step-end infinite;
            border-right: var(--hacker-cursor);
            padding-right: 0;
        }
    `;
    document.head.appendChild(style);
}

function removeHackerEffects() {
    const effects = document.getElementById('hacker-effects');
    if (effects) {
        effects.remove();
    }
}

function playHackerSound() {
    if (!state.audioContext) return;
    
    const oscillator = state.audioContext.createOscillator();
    const gainNode = state.audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.value = 100 + Math.random() * 800;
    gainNode.gain.value = 0.1;
    
    oscillator.connect(gainNode);
    gainNode.connect(state.audioContext.destination);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + 0.1);
    oscillator.stop(state.audioContext.currentTime + 0.1);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);