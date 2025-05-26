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

export const addEntry = (prompt1, prompt2, prompt3, seed, clearRedo = true) => {
    // Create the new entry
    let entry = {
        prompt1: prompt1,
        prompt2: prompt2,
        prompt3: prompt3,
        seed: seed
    };

    // Check if this is actually a different state
    let isDifferentState = true;

    if (currentPrompt !== null) {
        isDifferentState =
            currentPrompt.prompt1 !== prompt1 ||
            currentPrompt.prompt2 !== prompt2 ||
            currentPrompt.prompt3 !== prompt3 ||
            currentPrompt.seed !== seed;

        // Only add to history if this is a different state
        if (isDifferentState) {
            historyArray.push(currentPrompt);
        }
    }

    // Update current prompt
    currentPrompt = entry;

    // Only clear the redo stack if we're making a new entry with user changes
    if (clearRedo && isDifferentState) {
        undoElementsArray = [];
    }

    // Update button states based on array lengths
    undoRedo(historyArray.length <= 0, undoElementsArray.length <= 0);
}

export const undo = () => {
    if (historyArray.length > 0) {
        const entry = historyArray.pop();

        // Save current state to redo stack before applying the undo
        if (currentPrompt != null)
            undoElementsArray.push(currentPrompt);

        // Apply the previous state from history
        applyElements(entry);
        currentPrompt = entry;

        // Update button states based on array lengths
        undoRedo(historyArray.length <= 0, undoElementsArray.length <= 0);
    } else {
        showNotification('Nothing to undo', 'There are no more actions to undo!', NotificationType.WARNING);
    }
}

export const redo = () => {
    if (undoElementsArray.length > 0) {
        const entry = undoElementsArray.pop();

        // Save current state to undo stack before applying the redo
        if (currentPrompt != null)
            historyArray.push(currentPrompt);

        // Apply the state from redo stack
        applyElements(entry);
        currentPrompt = entry;

        // Update button states based on array lengths
        undoRedo(historyArray.length <= 0, undoElementsArray.length <= 0);
    } else {
        showNotification('Nothing to redo', 'There are no more actions to redo!', NotificationType.WARNING);
    }
}

const applyElements = (entry) => {
    // Directly update the value property instead of using setAttribute
    // This ensures the DOM actually updates and triggers any related events
    prompt1.value = entry['prompt1'];
    prompt2.value = entry['prompt2'];
    prompt3.value = entry['prompt3'];

    // Update the seed input value
    seed.value = entry['seed'];

    // Dispatch a change event to notify that the seed value has changed
    const changeEvent = new Event('change', { bubbles: true });
    seed.dispatchEvent(changeEvent);
}

const undoRedo = (undoEmpty, redoEmpty) => {
    // Enable the button when there are items to undo/redo
    // Disable the button when there are no items to undo/redo
    undoButton.disabled = undoEmpty;
    redoButton.disabled = redoEmpty;
}

export const clear = () => {
    historyArray = [];
    undoElementsArray = [];
}
