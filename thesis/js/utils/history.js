import { showNotification, NotificationType } from './notification.js';

const prompt1 = document.getElementById('prompt-1');
const prompt2 = document.getElementById('prompt-2');
const prompt3 = document.getElementById('prompt-3');
const seed = document.getElementById('seed');

const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');

let historyArray = [];
let undoElementsArray = [];

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
    let entry = {
        prompt1: prompt1,
        prompt2: prompt2,
        prompt3: prompt3,
        seed: seed
    }
    historyArray.push(entry);
    undoElementsArray = [];

    undoRedo(false, true);
}

export const undo = () => {
    if (historyArray.length > 0) {
        const entry = historyArray.pop();

        applyElements(entry);

        undoElementsArray.push(entry);
        undoRedo(historyArray.length <= 0, false);
    } else {
        console.log('Nothing to undo');
        showNotification('Nothing to undo', 'There are no more actions to undo!', NotificationType.WARNING);
    }
}

export const redo = () => {
    if (undoElementsArray.length > 0) {
        const entry = undoElementsArray.pop();

        applyElements(entry);

        historyArray.push(entry);

        undoRedo(false, undoElementsArray.length <= 0);
    } else {
        console.log('Nothing to redo');
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
