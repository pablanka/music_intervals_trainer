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

const intervalSongReferences = {
    "Unison": "Same note repeated (like a piano key pressed twice)",
    "Minor Second": "Jaws Theme (first two notes)",
    "Major Second": "Happy Birthday (first two notes)",
    "Minor Third": "Greensleeves (first two notes)",
    "Major Third": "Oh When The Saints (first two notes)",
    "Perfect Fourth": "Here Comes the Bride (first two notes)",
    "Augmented Fourth": "The Simpsons Theme (first two notes)",
    "Diminished Fifth": "Black Sabbath (first two notes)",
    "Perfect Fifth": "Star Wars Theme (first two notes)",
    "Augmented Fifth": "The Jetsons Theme (first two notes)",
    "Minor Sixth": "Love Story Theme (first two notes)",
    "Major Sixth": "NBC Chimes (first two notes)",
    "Minor Seventh": "Star Trek Theme (first two notes)",
    "Major Seventh": "Take On Me (first two notes)",
    "Octave": "Somewhere Over the Rainbow (first two notes)"
};

let score = 0;
let usedHelpThisRound = false;
let isLoading = true;
let currentMode = 'note'; // 'note' or 'interval'

let baseNote = Math.floor(Math.random() * notes.length);
let intervalName = Object.keys(intervals)[Math.floor(Math.random() * Object.keys(intervals).length)];
let correctNote = (baseNote + intervals[intervalName]) % notes.length;
let correctInterval = intervalName;

const questionDiv = document.getElementById("question");
const keyboardDiv = document.getElementById("keyboard");
const intervalGridDiv = document.getElementById("interval-grid");
const messageDiv = document.getElementById("message");
const hintButton = document.getElementById("hint-button");
const referenceButton = document.getElementById("reference-button");
const referenceTable = document.getElementById("reference-table");
const theoryButton = document.getElementById("theory-button");
const theorySection = document.getElementById("theory-section");
const noteModeButton = document.getElementById("note-mode");
const intervalModeButton = document.getElementById("interval-mode");

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

async function playInterval(baseNoteIndex, intervalSemitones) {
    if (isLoading) return;

    try {
        stopAllSounds();
        await playNote(baseNoteIndex);
        setTimeout(async () => {
            const targetNoteIndex = (baseNoteIndex + intervalSemitones) % notes.length;
            await playNote(targetNoteIndex);
        }, 1000);
    } catch (error) {
        console.error('Error playing interval:', error);
    }
}

function updateTitle() {
    document.title = `Interval Trainer Game - Score: ${score}`;
    document.getElementById("score").textContent = score;
}

function resetKeyStyles() {
    const keys = document.querySelectorAll(".key");
    keys.forEach(key => key.classList.remove("correct", "incorrect", "highlight"));
    const intervalButtons = document.querySelectorAll(".interval-button");
    intervalButtons.forEach(button => button.classList.remove("correct", "incorrect"));
}

function highlightBaseNote() {
    if (currentMode === 'note') {
        document.querySelector(`.key[data-note-index='${baseNote}']`).classList.add("highlight");
    }
}

async function handleKeyClick(noteIndex) {
    if (currentMode !== 'note') return;
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

async function handleIntervalClick(interval) {
    if (currentMode !== 'interval') return;
    resetKeyStyles();

    const button = document.querySelector(`.interval-button[data-interval="${interval}"]`);
    if (interval === correctInterval) {
        if (!usedHelpThisRound) {
            score += 10;
            messageDiv.innerText = "Correct! +10 points";
        } else {
            messageDiv.innerText = "Correct! (no points for using help)";
        }
        button.classList.add("correct");
    } else {
        if (!usedHelpThisRound) {
            score -= 5;
            messageDiv.innerText = `Incorrect. -5 points. The correct interval was ${correctInterval}.`;
        } else {
            messageDiv.innerText = `Incorrect. The correct interval was ${correctInterval}.`;
        }
        button.classList.add("incorrect");
    }

    updateTitle();
    setTimeout(newQuestion, 2000);
}

function newQuestion() {
    resetKeyStyles();
    usedHelpThisRound = false;
    baseNote = Math.floor(Math.random() * notes.length);

    if (currentMode === 'note') {
        intervalName = Object.keys(intervals)[Math.floor(Math.random() * Object.keys(intervals).length)];
        correctNote = (baseNote + intervals[intervalName]) % notes.length;
        questionDiv.innerText = `From ${notes[baseNote]}, find the ${intervalName}.`;
        playNote(baseNote);
    } else {
        correctInterval = Object.keys(intervals)[Math.floor(Math.random() * Object.keys(intervals).length)];
        questionDiv.innerText = "Listen to the interval and guess what it is!";
        playInterval(baseNote, intervals[correctInterval]);
    }

    messageDiv.innerText = "";
    referenceTable.style.display = "none";
    highlightBaseNote();
}

function setupKeyboard() {
    keyboardDiv.innerHTML = '';
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

function setupIntervalGrid() {
    intervalGridDiv.innerHTML = '';
    Object.keys(intervals).forEach(interval => {
        const button = document.createElement("button");
        button.classList.add("interval-button");
        button.dataset.interval = interval;
        button.innerText = interval;
        button.addEventListener("click", () => handleIntervalClick(interval));
        intervalGridDiv.appendChild(button);
    });
}

function switchMode(mode) {
    currentMode = mode;
    noteModeButton.classList.toggle('active', mode === 'note');
    intervalModeButton.classList.toggle('active', mode === 'interval');
    keyboardDiv.style.display = mode === 'note' ? 'flex' : 'none';
    intervalGridDiv.style.display = mode === 'interval' ? 'grid' : 'none';
    newQuestion();
}

// Event Listeners
hintButton.addEventListener("click", () => {
    if (!usedHelpThisRound) {
        usedHelpThisRound = true;
        messageDiv.innerText = "Help activated - No points this round";
    }
    if (currentMode === 'note') {
        const semitones = intervals[intervalName];
        const tones = semitones / 2;
        const tonesText = Number.isInteger(tones) ?
            `${tones} tones` :
            `${Math.floor(tones)}½ tones`;
        messageDiv.innerText = `Hint: The interval is ${tonesText} (${semitones} semitones).`;
    } else {
        const songReference = intervalSongReferences[correctInterval];
        messageDiv.innerText = `Hint: This interval sounds like "${songReference}". Listen again:`;
        playInterval(baseNote, intervals[correctInterval]);
    }
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

noteModeButton.addEventListener("click", () => switchMode('note'));
intervalModeButton.addEventListener("click", () => switchMode('interval'));

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
    setupIntervalGrid();
    switchMode('note');

    const playButton = document.createElement("button");
    playButton.className = "secondary-button play-button";
    playButton.id = "play-button";
    playButton.innerText = "Listen again";
    playButton.addEventListener("click", () => {
        if (currentMode === 'note') {
            playNote(baseNote);
        } else {
            playInterval(baseNote, intervals[correctInterval]);
        }
    });

    const listenContainer = document.getElementById("listen-container");
    listenContainer.appendChild(playButton);
});