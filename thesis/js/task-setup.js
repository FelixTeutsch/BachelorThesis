// Task Setup and Tracking Logic
let taskActive = false;
let taskStartTime = null;
let taskData = [];
let lastTaskInfo = { device: 'Keyboard', name: '', imageId: '' };

// Modal and button elements
const startTaskBtn = document.getElementById('start-task-btn');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-setup-form');
const modalStartTaskBtn = document.getElementById('modal-start-task');

// Pre-populate modal if available
function populateModal() {
    taskForm.elements['input-device'].value = lastTaskInfo.device;
    taskForm.elements['user-name'].value = lastTaskInfo.name;
    taskForm.elements['image-id'].value = lastTaskInfo.imageId;
}

// Show/hide modal
function showModal() {
    populateModal();
    taskModal.classList.remove('hidden');
}
function hideModal() {
    taskModal.classList.add('hidden');
}

// Reset parameters visually and in data
function resetParameters() {
    // Prompts
    const promptElements = document.querySelectorAll('.prompt');
    const promptTexts = ['House', 'Dog', 'Cat'];
    promptElements.forEach((el, i) => {
        el.querySelector('.prompt-text').innerText = promptTexts[i];
        const input = el.querySelector('input[type="number"]');
        input.value = '1.00';
    });
    // Seed
    document.getElementById('seed').value = '961946033861284';
    // Prompt select
    const promptSelect = document.getElementById('prompt-select');
    promptSelect.selectedIndex = 0;
    // Model select
    const modelSelect = document.getElementById('model');
    modelSelect.selectedIndex = 0;
}

// Start Task
function startTask(device, name, imageId) {
    taskActive = true;
    taskStartTime = Date.now();
    taskData = [];
    lastTaskInfo = { device, name, imageId };
    resetParameters();
    startTaskBtn.textContent = 'End Task';
}

// End Task
function endTask() {
    taskActive = false;
    const csv = exportCSV();
    downloadCSV(csv);
    startTaskBtn.textContent = 'Start Task';
}

// CSV Export
function exportCSV() {
    const header = 'Prompt,Weight-1,Weight-2,Weight-3,Seed,Time Elapsed (ms)';
    const rows = taskData.map(row => row.join(','));
    return [header, ...rows].join('\n');
}
function downloadCSV(csv) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lastTaskInfo.name}_${lastTaskInfo.device}_${lastTaskInfo.imageId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Button click logic
startTaskBtn.addEventListener('click', () => {
    if (!taskActive) {
        showModal();
    } else {
        endTask();
    }
});

// Modal form submit
if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const device = taskForm.elements['input-device'].value;
        const name = taskForm.elements['user-name'].value;
        const imageId = taskForm.elements['image-id'].value;
        startTask(device, name, imageId);
        hideModal();
    });
}

// Placeholder for image generation event
export function onImageGenerated(w1, w2, w3, seed, prompt) {
    if (!taskActive) return;
    const elapsed = Date.now() - taskStartTime;
    taskData.push([prompt, w1, w2, w3, seed, elapsed]);
}

// Expose for global use if needed
window.onImageGenerated = onImageGenerated; 