import { addEntry, clear as clearHistory } from '../utils/history.js';

/**
 * Save the current prompt state to the history
 * 
 * @param {string} prompt1 First prompt component
 * @param {string} prompt2 Second prompt component
 * @param {string} prompt3 Third prompt component
 * @param {string} seed The seed value
 * @param {boolean} isUserChange Whether this is a user-initiated change (should clear redo stack)
 */
export const savePromptState = (prompt1, prompt2, prompt3, seed, isUserChange = true) => {
    addEntry(prompt1, prompt2, prompt3, seed, isUserChange);
};

/**
 * Clear the entire history (both undo and redo stacks)
 * Only use this when absolutely necessary
 */
export const clearPromptHistory = () => {
    clearHistory();
};