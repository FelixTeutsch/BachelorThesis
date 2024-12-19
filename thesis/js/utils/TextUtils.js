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

/**
 * Formats sampler information into a readable tooltip description
 * @param {string} samplerId - The ID of the sampler
 * @returns {string} Formatted description
 */
export const formatSamplerDescription = (samplerId) => {
    // Special characteristics to check
    const isAncestral = samplerId.toLowerCase().includes('ancestral') || samplerId.toLowerCase().includes('_a');
    const isGPU = samplerId.toLowerCase().includes('gpu');
    const isSDE = samplerId.toLowerCase().includes('sde');
    const isDPM = samplerId.toLowerCase().includes('dpm');
    const isUniPC = samplerId.toLowerCase().includes('uni_pc');
    const isLCM = samplerId.toLowerCase().includes('lcm');

    // Base name formatting with icon
    let mainIcon = '🎨'; // Default icon
    if (isDPM) mainIcon = '🔄';
    if (isUniPC) mainIcon = '🎯';
    if (isLCM) mainIcon = '⚡';

    // Remove special keywords from the name
    let cleanName = samplerId
        .replace(/gpu/gi, '')
        .replace(/sde/gi, '')
        .replace(/ancestral/gi, '')
        .replace(/_a\b/gi, '')  // Remove _a when it's at a word boundary
        .replace(/__+/g, '_')   // Clean up multiple underscores
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    const readableName = cleanName
        .split('_')
        .map(word => {
            // Special cases that should be fully capitalized
            const upperCaseWords = ['lms', 'dpm', 'ddim', 'plms'];
            if (upperCaseWords.includes(word.toLowerCase()) ||
                word.toLowerCase().startsWith('dpm')) {
                return word.toUpperCase();
            }
            return beautifyFilename(word);
        })
        .join(' ')
        .trim();

    let description = [`${mainIcon} ${readableName}`];

    // Add special characteristics icons
    if (isAncestral) description.push(" 🎲");
    if (isGPU) description.push(" 💻");
    if (isSDE) description.push(" 📊");

    // Return formatted description
    return description.join('');  // Changed to empty string to keep all on one line
};