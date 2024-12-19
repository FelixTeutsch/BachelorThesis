// Get DOM elements once
const progressBar = document.getElementById('progress-bar');
const progressText = document.querySelector('.progress-text');

// Progress bar functionality
function updateProgress(value, max) {
    if (progressBar && progressText) {
        // Calculate relative progress between 2-98%
        const relativeProgress = 2 + ((value / max) * 96);

        // Ensure value is between 0 and 100
        const normalizedProgress = Math.min(100, Math.max(0, relativeProgress));

        // Update progress bar value
        progressBar.value = normalizedProgress;

        // Update progress text with rounded value
        progressText.textContent = `${Math.round(normalizedProgress)}%`;
    }
}

function resetProgress() {
    progressBar.value = 0;
    progressText.textContent = '0%';
}

function loadModel() {
    progressBar.value = 2;
    progressText.textContent = '2%';
}

function finishProgress() {
    progressBar.value = 100;
    progressText.textContent = '100%';
}

// Export the function for use in other modules
export { updateProgress, resetProgress, loadModel, finishProgress };
