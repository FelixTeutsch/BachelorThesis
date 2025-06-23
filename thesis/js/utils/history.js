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

    // Get the current model and prompt select values
    const model = document.getElementById('model').value;
    const promptSelect = document.getElementById('prompt-select').value;

    // Create the new entry
    let entry = {
        prompt1: prompt1,
        prompt2: prompt2,
        prompt3: prompt3,
        seed: seed,
        model: model,
        promptSelect: promptSelect
    };

    // Check if this is actually a different state
    let isDifferentState = true;

    if (currentPrompt !== null) {
        isDifferentState =
            currentPrompt.prompt1 !== prompt1 ||
            currentPrompt.prompt2 !== prompt2 ||
            currentPrompt.prompt3 !== prompt3 ||
            currentPrompt.seed !== seed ||
            currentPrompt.model !== model ||
            currentPrompt.promptSelect !== promptSelect;

        // console.log('Is different state:', isDifferentState);
        // console.log('Comparison:', {
        //     prompt1: { current: currentPrompt.prompt1, new: prompt1 },
        //     prompt2: { current: currentPrompt.prompt2, new: prompt2 },
        //     prompt3: { current: currentPrompt.prompt3, new: prompt3 },
        //     seed: { current: currentPrompt.seed, new: seed },
        //     model: { current: currentPrompt.model, new: model },
        //     promptSelect: { current: currentPrompt.promptSelect, new: promptSelect }
        // });

        // Only add to history if this is a different state
        if (isDifferentState) {
            // Add current state to undo stack
            historyArray.push(currentPrompt);

            // Clear redo stack when a new change is made
            if (clearRedo) {
                undoElementsArray = [];
            }
        }
    }

    // Update current prompt
    currentPrompt = entry;

    // Update button states
    updateButtonStates();
}

export const undo = () => {
    if (historyArray.length > 0) {

        // Get the previous state from undo stack
        const previousState = historyArray.pop();

        // Save current state to redo stack
        if (currentPrompt !== null) {
            undoElementsArray.push(currentPrompt);
        }

        // Apply the previous state
        applyElements(previousState);
        currentPrompt = previousState;

        // Update button states
        updateButtonStates();
    } else {
        showNotification('Nothing to undo', 'There are no more actions to undo!', NotificationType.WARNING);
    }
}

export const redo = () => {
    if (undoElementsArray.length > 0) {

        // Get the next state from redo stack
        const nextState = undoElementsArray.pop();

        // Save current state to undo stack
        if (currentPrompt !== null) {
            historyArray.push(currentPrompt);
        }

        // Apply the next state
        applyElements(nextState);
        currentPrompt = nextState;

        // Update button states
        updateButtonStates();
    } else {
        showNotification('Nothing to redo', 'There are no more actions to redo!', NotificationType.WARNING);
    }
}

const applyElements = (entry) => {

    // Update prompt text content
    prompt1.textContent = entry['prompt1'];
    prompt2.textContent = entry['prompt2'];
    prompt3.textContent = entry['prompt3'];

    // Update the seed input value
    seed.value = entry['seed'];

    // Update model and prompt select
    document.getElementById('model').value = entry['model'];
    document.getElementById('prompt-select').value = entry['promptSelect'];

    // Dispatch change events to trigger updates
    const changeEvent = new Event('change', { bubbles: true });
    seed.dispatchEvent(changeEvent);
    document.getElementById('model').dispatchEvent(changeEvent);
    document.getElementById('prompt-select').dispatchEvent(changeEvent);
}

const updateButtonStates = () => {
    undoButton.disabled = historyArray.length === 0;
    redoButton.disabled = undoElementsArray.length === 0;
}

export const clear = () => {
    historyArray = [];
    undoElementsArray = [];
}
