import { beautifyFilename, formatSamplerDescription } from '/thesis/js/utils/TextUtils.js';

export async function loadModels() {
    try {
        const response = await fetch('/object_info/CheckpointLoaderSimple');
        const data = await response.json();
        const models = data.CheckpointLoaderSimple.input.required.ckpt_name[0];

        const modelSelect = document.getElementById('model');
        modelSelect.innerHTML = models
            .reverse()
            .filter(model => !model.toLowerCase().includes('dreamshaper'))
            .map(model => `<option value="${model}">${beautifyFilename(model)}</option>`)
            .join('');

        return models;
    } catch (error) {
        console.error("Error loading models:", error);
        return null;
    }
}

export async function loadLoras() {
    try {
        const response = await fetch('/object_info/LoraLoader');
        const data = await response.json();
        const loras = data.LoraLoader.input.required.lora_name[0];

        const loraSelect = document.getElementById('lora');
        loraSelect.innerHTML = loras
            .map(lora => `<option value="${lora}">${beautifyFilename(lora)}</option>`)
            .join('');

        return loras;
    } catch (error) {
        console.error("Error loading loras:", error);
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
        const promptSelect = document.getElementById('prompt');
        promptSelect.innerHTML = Object.keys(prompts)
            .map(prompt => `<option value="${prompt}">${prompt}</option>`)
            .join('');

        return prompts;
    } catch (error) {
        console.error("Error loading prompts:", error);
        return null;
    }
}

export async function loadSamplers() {
    try {
        const response = await fetch('/object_info/KSampler');
        const data = await response.json();
        const samplers = data.KSampler.input.required.sampler_name[0];
        const samplerSelect = document.getElementById('sampler');
        samplerSelect.innerHTML = samplers
            .map(sampler => `<option value="${sampler}">${formatSamplerDescription(sampler)}</option>`)
            .join('');

        return samplers;
    } catch (error) {
        console.error("Error loading samplers:", error);
        return null;
    }
}