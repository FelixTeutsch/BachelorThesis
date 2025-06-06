import { beautifyFilename } from '/thesis/js/utils/TextUtils.js';

export async function loadModels() {
    try {
        const response = await fetch('/object_info/CheckpointLoaderSimple');
        const data = await response.json();
        const models = data.CheckpointLoaderSimple.input.required.ckpt_name[0];

        const modelSelect = document.getElementById('model');
        modelSelect.innerHTML = models
            .reverse()
            .map(model => `<option value="${model}">${beautifyFilename(model)}</option>`)
            .join('');

        return models;
    } catch (error) {
        console.error("Error loading models:", error);
        return null;
    }
}

export async function loadPrompts() {
    try {
        const response = await fetch('/thesis/api/prompts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const prompts = await response.json();
        const promptSelect = document.getElementById('prompt-select');
        promptSelect.innerHTML = Object.keys(prompts)
            .map(prompt => `<option value="${prompt}">${prompt}</option>`)
            .join('');

        return prompts;
    } catch (error) {
        console.error("Error loading prompts:", error);
        return null;
    }
}
