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
let isLoading = true;

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
const audioElements = {};
let audioUnlocked = false;

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

function _createAudioElement(note) {
    const filename = noteToFilename[note];
    const audio = new Audio(`sounds/${filename}.mp3`);
    audio.preload = 'auto';
    return audio;
}

function preloadAudioFiles() {
    notes.forEach(note => {
        audioElements[note] = _createAudioElement(note);
    });
    isLoading = false;
}

function _unlockAudioForIOS() {
    if (audioUnlocked) return;

    // Create and play a silent audio element
    const silentAudio = new Audio();
    silentAudio.play().then(() => {
        audioUnlocked = true;
    }).catch(error => {
        console.warn('Audio unlock failed:', error);
    });

    // Unlock all audio elements
    Object.values(audioElements).forEach(audio => {
        audio.load();
    });
}

function stopAllSounds() {
    Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

async function playNote(noteIndex) {
    if (isLoading) return;

    try {
        stopAllSounds();
        const note = notes[noteIndex];
        const audio = audioElements[note];

        if (!audio) {
            console.error('Audio element not found for note:', note);
            return;
        }

        // For iOS, we need to reload the audio element before playing
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
            audio.load();
        }

        audio.currentTime = 0;
        await audio.play().catch(error => {
            console.error('Error playing audio:', error);
            // If playback fails, try recreating the audio element
            audioElements[note] = _createAudioElement(note);
            return audioElements[note].play();
        });
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
        await playNote(noteIndex);
    } else {
        if (!usedHelpThisRound) {
            score -= 5;
            messageDiv.innerText = `Incorrect. -5 points. The correct note was ${notes[correctNote]}.`;
        } else {
            messageDiv.innerText = `Incorrect. The correct note was ${notes[correctNote]}.`;
        }
        document.querySelector(`.key[data-note-index='${noteIndex}']`).classList.add("incorrect");
        await playNote(noteIndex);
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

function setupKeyboard() {
    notes.forEach((note, index) => {
        const key = document.createElement("div");
        key.classList.add("key");
        if (note.includes("#")) {
            key.classList.add("black");
        }
        key.dataset.noteIndex = index;
        key.innerText = note;
        key.addEventListener("click", () => handleKeyClick(index));
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

document.addEventListener('DOMContentLoaded', () => {
    messageDiv.innerText = "Tap anywhere to start";

    // Initialize audio on first interaction
    const startAudio = () => {
        _unlockAudioForIOS();
        preloadAudioFiles();
        messageDiv.innerText = "";
        document.removeEventListener('click', startAudio);
        document.removeEventListener('touchstart', startAudio);
    };

    document.addEventListener('click', startAudio);
    document.addEventListener('touchstart', startAudio);

    setupKeyboard();
    updateTitle();

    const playButton = document.createElement("button");
    playButton.className = "text-button";
    playButton.innerText = "Play note again";
    playButton.addEventListener("click", () => playNote(baseNote));
    questionDiv.appendChild(document.createElement("br"));
    questionDiv.appendChild(playButton);

    newQuestion();
});