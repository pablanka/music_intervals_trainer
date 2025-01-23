const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const intervals = {
    "Unison": 0,
    "Minor Second": 1,
    "Major Second": 2,
    "Minor Third": 3,
    "Major Third": 4,
    "Perfect Fourth": 5,
    "Augmented Fourth": 6,
    "Diminished Fifth": 6,
    "Perfect Fifth": 7,
    "Augmented Fifth": 8,
    "Minor Sixth": 8,
    "Major Sixth": 9,
    "Minor Seventh": 10,
    "Major Seventh": 11,
    "Octave": 12
};

let score = 0;
let usedHelpThisRound = false;

let baseNote = Math.floor(Math.random() * notes.length);
let intervalName = Object.keys(intervals)[Math.floor(Math.random() * Object.keys(intervals).length)];
let correctNote = (baseNote + intervals[intervalName]) % notes.length;

const questionDiv = document.getElementById("question");
const keyboardDiv = document.getElementById("keyboard");
const messageDiv = document.getElementById("message");
const hintButton = document.getElementById("hint-button");
const referenceButton = document.getElementById("reference-button");
const referenceTable = document.getElementById("reference-table");
const theoryButton = document.getElementById("theory-button");
const theorySection = document.getElementById("theory-section");

let audioContext = null;

function initAudioContext() {
    if (audioContext === null) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function updateTitle() {
    document.title = `Interval Trainer Game - Score: ${score}`;
    document.getElementById("score").textContent = score;
}

function playTone(frequency, duration = 1, type = "sine") {
    if (!audioContext) {
        initAudioContext();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
}

function playOscillator(noteIndex) {
    const frequencies = [
        261.63, // C
        277.18, // C#
        293.66, // D
        311.13, // D#
        329.63, // E
        349.23, // F
        369.99, // F#
        392.00, // G
        415.30, // G#
        440.00, // A
        466.16, // A#
        493.88  // B
    ];

    const frequency = frequencies[noteIndex];
    playTone(frequency, 1);
}

function setupKeyboard() {
    notes.forEach((note, index) => {
        const key = document.createElement("div");
        key.classList.add("key");
        if (note.includes("#")) {
            key.classList.add("black");
        }
        key.dataset.noteIndex = index;
        key.innerText = note;
        key.addEventListener("click", () => {
            initAudioContext();
            handleKeyClick(index);
        });
        keyboardDiv.appendChild(key);
    });
}

function resetKeyStyles() {
    const keys = document.querySelectorAll(".key");
    keys.forEach(key => key.classList.remove("correct", "incorrect", "highlight"));
}

function highlightBaseNote() {
    document.querySelector(`.key[data-note-index='${baseNote}']`).classList.add("highlight");
}

function handleKeyClick(noteIndex) {
    resetKeyStyles();

    if (noteIndex === correctNote) {
        playOscillator(noteIndex);
        if (!usedHelpThisRound) {
            score += 10;
            messageDiv.innerText = "Correct! +10 points";
        } else {
            messageDiv.innerText = "Correct! (no points for using help)";
        }
        document.querySelector(`.key[data-note-index='${noteIndex}']`).classList.add("correct");
    } else {
        playTone(220, 0.5, "sawtooth");
        if (!usedHelpThisRound) {
            score -= 5;
            messageDiv.innerText = `Incorrect. -5 points. The correct note was ${notes[correctNote]}.`;
        } else {
            messageDiv.innerText = `Incorrect. The correct note was ${notes[correctNote]}.`;
        }
        document.querySelector(`.key[data-note-index='${noteIndex}']`).classList.add("incorrect");
    }

    updateTitle();
    setTimeout(newQuestion, 2000);
}

function newQuestion() {
    resetKeyStyles();
    usedHelpThisRound = false;
    baseNote = Math.floor(Math.random() * notes.length);
    intervalName = Object.keys(intervals)[Math.floor(Math.random() * Object.keys(intervals).length)];
    correctNote = (baseNote + intervals[intervalName]) % notes.length;

    if (audioContext) {
        playOscillator(baseNote);
    }
    highlightBaseNote();

    questionDiv.innerText = `From ${notes[baseNote]}, find the ${intervalName}.`;
    messageDiv.innerText = "";
    referenceTable.style.display = "none";
}

hintButton.addEventListener("click", () => {
    if (!usedHelpThisRound) {
        usedHelpThisRound = true;
        messageDiv.innerText = "Help activated - No points this round";
    }
    const semitones = intervals[intervalName];
    const tones = semitones / 2;
    const tonesText = Number.isInteger(tones) ?
        `${tones} tones` :
        `${Math.floor(tones)}½ tones`;
    messageDiv.innerText = `Hint: The interval is ${tonesText} (${semitones} semitones).`;
});

referenceButton.addEventListener("click", () => {
    if (!usedHelpThisRound) {
        usedHelpThisRound = true;
        messageDiv.innerText = "Help activated - No points this round";
    }
    const isVisible = referenceTable.style.display === "table";
    referenceTable.style.display = isVisible ? "none" : "table";
});

theoryButton.addEventListener("click", () => {
    const isVisible = theorySection.style.display === "block";
    theorySection.style.display = isVisible ? "none" : "block";
    referenceTable.style.display = "none"; // Close reference table if open
});

document.addEventListener("DOMContentLoaded", () => {
    setupKeyboard();
    updateTitle();

    const playButton = document.createElement("button");
    playButton.className = "text-button";
    playButton.innerText = "Play note again";
    playButton.addEventListener("click", () => {
        initAudioContext();
        playOscillator(baseNote);
    });
    questionDiv.appendChild(document.createElement("br"));
    questionDiv.appendChild(playButton);

    newQuestion();
});