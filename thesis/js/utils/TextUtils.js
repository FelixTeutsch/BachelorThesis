/**
 * Text utility functions for string manipulation
 */

/**
 * Capitalizes the first letter of a string
 * @param {string} str - The input string
 * @returns {string} The string with first letter capitalized
 */
export const capitalizeFirstLetter = (str) =>
    str && str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

/**
 * Beautifies a filename by:
 * 1. Removing file extensions
 * 2. Converting underscores and hyphens to spaces
 * 3. Capitalizing first letter of each word
 * 4. Handling SD and SDXL specially
 * 5. Removing any numbers at the start
 * @param {string} filename - The filename to beautify
 * @returns {string} The beautified filename
 */
export const beautifyFilename = (filename) => {
    if (!filename) return '';

    return filename
        // Remove file extension
        .replace(/\.[^/.]+$/, '')
        // Replace underscores and hyphens with spaces
        .replace(/[_-]/g, ' ')
        // Remove numbers and dots from the start
        .replace(/^[\d.]+/, '')
        // Trim spaces
        .trim()
        // Capitalize first letter of each word
        .replace(/\b\w/g, c => c.toUpperCase())
        // Handle SD and SDXL specially (case-insensitive)
        .replace(/\bSd\b/gi, 'SD')
        .replace(/\bSdxl\b/gi, 'SDXL')
        // Remove multiple spaces
        .replace(/\s+/g, ' ');
};

/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 * @param {string} str - The input string
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} The truncated string
 */
export const truncateString = (str, maxLength = 50) =>
    str?.length > maxLength ? `${str.slice(0, maxLength)}...` : str;

/**
 * Sanitizes a string by removing special characters and extra spaces
 * @param {string} str - The input string
 * @returns {string} The sanitized string
 */
export const sanitizeString = (str) =>
    str?.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, ' ') || '';


export const getPrompt = () => {
    const promptElements = document.getElementsByClassName('prompt');
    if (promptElements.length === 0) return { positive: '', negative: '' };

    const positivePrompts = [];
    const negativePrompts = [];

    Array.from(promptElements).forEach(promptElement => {
        const weightInput = promptElement.getElementsByClassName('weight')[0];
        const value = weightInput.value;
        const weight = isBlankOrNull(value) ? weightInput.min : value;
        const promptText = promptElement.getElementsByClassName('prompt-text')[0].innerText;

        if (parseFloat(weight) < 0) {
            // For negative weights, add to negative prompt with positive weight
            negativePrompts.push(`(${promptText}:${Math.abs(parseFloat(weight))})`);
        } else {
            // For positive weights, add to positive prompt
            positivePrompts.push(`(${promptText}:${weight})`);
        }
    });

    const positivePrompt = positivePrompts.join(', ');
    const negativePrompt = negativePrompts.join(', ');

    // Get the base negative prompt from the hidden input
    const baseNegativePrompt = document.getElementById('negative-prompt').value;

    // Combine base negative prompt with any negative prompts from weights
    const finalNegativePrompt = negativePrompts.length > 0
        ? `${baseNegativePrompt}, ${negativePrompt}`
        : baseNegativePrompt;

    console.log('Positive prompt:', positivePrompt);
    console.log('Negative prompt:', finalNegativePrompt);

    return {
        positive: positivePrompt,
        negative: finalNegativePrompt
    };
};

// Helper function to check if a value is blank or null
function isBlankOrNull(value) {
    return value === null || value === undefined || value === '' || value.toString().trim() === '';
}