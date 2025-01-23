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

// Audio handling
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffers = {};
let isLoading = true;

// Map notes to filenames
const noteToFilename = {
    "C": "C4",
    "C#": "Db4",
    "D": "D4",
    "D#": "Eb4",
    "E": "E4",
    "F": "F4",
    "F#": "Gb4",
    "G": "G4",
    "G#": "Ab4",
    "A": "A4",
    "A#": "Bb4",
    "B": "B4"
};

const errorSound = new Audio('sounds/error.mp3');

// Function to resume audio context
async function resumeAudioContext() {
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
            console.log('AudioContext resumed successfully');
        } catch (error) {
            console.error('Failed to resume AudioContext:', error);
        }
    }
}

// Load audio files
async function loadAudioFiles() {
    try {
        const loadPromises = notes.map(async (note) => {
            try {
                const filename = noteToFilename[note];
                const response = await fetch(`sounds/${filename}.mp3`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioBuffers[note] = audioBuffer;
            } catch (error) {
                console.error(`Error loading sound for note ${note}:`, error);
            }
        });

        await Promise.all(loadPromises);
        isLoading = false;
        console.log('All audio files loaded successfully');
    } catch (error) {
        console.error('Error in loadAudioFiles:', error);
        messageDiv.innerText = "Error loading sounds. Please refresh the page.";
    }
}

function playSound(buffer) {
    if (!buffer) {
        console.error('No buffer provided to playSound');
        return;
    }

    try {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    } catch (error) {
        console.error('Error playing sound:', error);
    }
}

async function playNote(noteIndex) {
    if (isLoading) {
        console.log('Still loading sounds...');
        return;
    }

    try {
        await resumeAudioContext();
        const note = notes[noteIndex];
        const buffer = audioBuffers[note];
        if (!buffer) {
            console.error(`No buffer found for note ${note}`);
            return;
        }
        playSound(buffer);
    } catch (error) {
        console.error('Error in playNote:', error);
    }
}

function updateTitle() {
    document.title = `Interval Trainer Game - Score: ${score}`;
    document.getElementById("score").textContent = score;
}

function resetKeyStyles() {
    const keys = document.querySelectorAll(".key");
    keys.forEach(key => key.classList.remove("correct", "incorrect", "highlight"));
}

function highlightBaseNote() {
    document.querySelector(`.key[data-note-index='${baseNote}']`).classList.add("highlight");
}

async function handleKeyClick(noteIndex) {
    resetKeyStyles();

    if (noteIndex === correctNote) {
        if (!usedHelpThisRound) {
            score += 10;
            messageDiv.innerText = "Correct! +10 points";
        } else {
            messageDiv.innerText = "Correct! (no points for using help)";
        }
        document.querySelector(`.key[data-note-index='${noteIndex}']`).classList.add("correct");
        playNote(noteIndex);
    } else {
        if (!usedHelpThisRound) {
            score -= 5;
            messageDiv.innerText = `Incorrect. -5 points. The correct note was ${notes[correctNote]}.`;
        } else {
            messageDiv.innerText = `Incorrect. The correct note was ${notes[correctNote]}.`;
        }
        document.querySelector(`.key[data-note-index='${noteIndex}']`).classList.add("incorrect");
        playNote(noteIndex);
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

    questionDiv.innerText = `From ${notes[baseNote]}, find the ${intervalName}.`;
    messageDiv.innerText = "";
    referenceTable.style.display = "none";

    playNote(baseNote);
    highlightBaseNote();
}

// Initialize audio on first user interaction
function initAudioOnInteraction() {
    const initAudio = async () => {
        await resumeAudioContext();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
}

// Update keyboard setup to handle audio context
function setupKeyboard() {
    notes.forEach((note, index) => {
        const key = document.createElement("div");
        key.classList.add("key");
        if (note.includes("#")) {
            key.classList.add("black");
        }
        key.dataset.noteIndex = index;
        key.innerText = note;
        key.addEventListener("click", async () => {
            await resumeAudioContext();
            handleKeyClick(index);
        });
        keyboardDiv.appendChild(key);
    });
}

// Event Listeners
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
    referenceTable.style.display = "none";
});

// Update DOMContentLoaded event handler
document.addEventListener("DOMContentLoaded", async () => {
    messageDiv.innerText = "Loading sounds...";
    initAudioOnInteraction();

    try {
        await loadAudioFiles();
        messageDiv.innerText = "";

        setupKeyboard();
        updateTitle();

        const playButton = document.createElement("button");
        playButton.className = "text-button";
        playButton.innerText = "Play note again";
        playButton.addEventListener("click", async () => {
            await resumeAudioContext();
            playNote(baseNote);
        });
        questionDiv.appendChild(document.createElement("br"));
        questionDiv.appendChild(playButton);

        newQuestion();
    } catch (error) {
        console.error('Error during initialization:', error);
        messageDiv.innerText = "Error initializing the app. Please refresh the page.";
    }
});