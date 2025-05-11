import { showNotification, NotificationType } from './notification.js';

const prompt1 = document.getElementById('prompt-1');
const prompt2 = document.getElementById('prompt-2');
const prompt3 = document.getElementById('prompt-3');
const seed = document.getElementById('seed');

const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');

let historyArray = [];
let undoElementsArray = [];
let currentPrompt = null;

undoButton.addEventListener('click', () => {
    if (!undoButton.hasAttribute('disabled')) {
        undo();
    }
});

redoButton.addEventListener('click', () => {
    if (!redoButton.hasAttribute('disabled')) {
        redo();
    }
});

export const addEntry = (prompt1, prompt2, prompt3, seed) => {
    if (currentPrompt !== null) {
        historyArray.push(currentPrompt);

    }
    let entry = {
        prompt1: prompt1,
        prompt2: prompt2,
        prompt3: prompt3,
        seed: seed
    }

    currentPrompt = entry;
    undoElementsArray = [];

    undoRedo(historyArray.length > 0, true);
}

export const undo = () => {
    if (historyArray.length > 0) {
        const entry = historyArray.pop();

        applyElements(entry);

        if (currentPrompt != null)
            undoElementsArray.push(currentPrompt);
        currentPrompt = entry;
        undoRedo(historyArray.length <= 0, undoElementsArray.length <= 0);
    } else {
        showNotification('Nothing to undo', 'There are no more actions to undo!', NotificationType.WARNING);
    }
}

export const redo = () => {
    if (undoElementsArray.length > 0) {
        const entry = undoElementsArray.pop();

        applyElements(entry);
        if (currentPrompt != null)
            historyArray.push(currentPrompt);
        currentPrompt = entry;

        undoRedo(historyArray.length <= 0, undoElementsArray.length <= 0);
    } else {
        showNotification('Nothing to redo', 'There are no more actions to redo!', NotificationType.WARNING);
    }
}

const applyElements = (entry) => {
    prompt1.setAttribute('value', entry['prompt1']);
    prompt2.setAttribute('value', entry['prompt2']);
    prompt3.setAttribute('value', entry['prompt3']);
    seed.setAttribute('value', entry['seed']);
}

const undoRedo = (undo, redo) => {
    undoButton.disabled = undo;
    redoButton.disabled = redo;
}

export const clear = () => {
    historyArray = [];
    undoElementsArray = [];
}
