// Main Application JavaScript for Thesis UI - Controls image generation interface
import { loadModels, loadPrompts } from './config/populate_selects.js';
import InputHandler from './config/input_handler.js';
import { showNotification, NotificationType } from './utils/notification.js';
import { resetProgress, updateProgress, finishProgress } from './progress.js';
import { getPrompt } from './utils/TextUtils.js';
import { addEntry } from './utils/history.js';
import { onImageGenerated } from './task-setup.js'

(async (window, document, undefined) => {
    // UUID generator
    function uuidv4() { return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1),)[0] & (15 >> (c / 4)))).toString(16)); }
    const client_id = uuidv4(); // Custom UUID for client

    // Load workflow
    async function loadWorkflow() {
        try {
            const response = await fetch('/thesis/workflow/workflow_api.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error loading workflow:", error);
            showNotification('Error', `Failed to load workflow: ${error.message}`, NotificationType.ERROR);
        }
    }
    const workflow = await loadWorkflow();

    // Queue and cache state
    let isQueueBusy = false;
    let cachedWorkflow = null;
    let promptValues = {
        cache: {
            prompt: '',
            weight_1: 1,
            weight_2: 1,
            weight_3: 1,
            seed: '961946033861284'
        },
        queue: {
            prompt: '',
            weight_1: 1,
            weight_2: 1,
            weight_3: 1,
            seed: '961946033861284'
        }
    }

    // Status update function
    function updateStatus(isGenerating, isCached) {
        const statusElement = document.getElementById('generation-status');
        const iconElement = statusElement.querySelector('.status-icon');
        const textElement = statusElement.querySelector('.status-text');

        if (isGenerating) {
            iconElement.textContent = 'hourglass_top';
            textElement.textContent = 'Generating...';
        } else if (isCached) {
            iconElement.textContent = 'schedule';
            textElement.textContent = 'Queued';
        } else {
            iconElement.textContent = 'hourglass_empty';
            textElement.textContent = 'Waiting for input';
        }
    }

    // Websocket connection
    const server_address = window.location.hostname + ':' + window.location.port;
    const socket = new WebSocket('ws://' + server_address + '/ws?clientId=' + client_id);

    // Handle WebSocket connection
    socket.addEventListener('open', (event) => {
        console.log('WebSocket connection established');
        updateStatus(false, false);
    });

    socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed');
        updateStatus(false, false);
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        updateStatus(false, false);
    });

    const generationOutput = document.getElementById("output-image");

    // Populate model and prompt selects
    loadModels();
    let prompts = {};

    // Load prompts asynchronously
    async function initializePrompts() {
        try {
            prompts = await loadPrompts();
        } catch (error) {
            console.error("Error loading prompts:", error);
            showNotification('Error', `Failed to load prompts: ${error.message}`, NotificationType.ERROR);
        }
    }

    // Initialize prompts
    await initializePrompts();

    // Set initial pre-prompt if a prompt is selected
    const promptSelect = document.getElementById('prompt-select');
    if (promptSelect.value && prompts[promptSelect.value]) {
        const prePromptDisplay = document.getElementById('pre-prompt-display');
        const prePrompt = prompts[promptSelect.value].pre_prompt;
        if (prePrompt && prePrompt.trim()) {
            prePromptDisplay.style.display = 'flex';
            prePromptDisplay.querySelector('.pre-prompt-text').textContent = prePrompt;
        } else {
            prePromptDisplay.style.display = 'none';
        }
    }

    async function queue_prompt(prompt = {}) {
        const data = { 'prompt': prompt, 'client_id': client_id };

        onImageGenerated(promptValues.queue.weight_1, promptValues.queue.weight_2, promptValues.queue.weight_3, promptValues.queue.seed, promptValues.queue.prompt);

        try {
            const response = await fetch('/prompt', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const bodyText = await response.text();
                var errorMessage = "";
                try {
                    const bodyJson = JSON.parse(bodyText);
                    errorMessage = bodyJson.error.message;
                } catch (e) {
                    console.error("Failed to parse response body as JSON:", e);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${response.statusText}`);
                }
                throw new Error(`${errorMessage}`);
            }
        } catch (error) {
            console.error("Error queuing prompt:", error);
            showNotification('Error', `Failed to queue prompt: ${error.message}`, NotificationType.ERROR);
        }
    }

    const inputReferences = [
        {
            workflow: [["6"], ["inputs"], ["text"]],
            reference: document.getElementById('prompt'),
        }, {
            workflow: [["6"], ["inputs"], ["negative_prompt"]],
            reference: document.getElementById('negative-prompt'),
        }, {
            workflow: [["3"], ["inputs"], ["seed"]],
            reference: document.getElementById('seed'),
        }, {
            workflow: [["4"], ["inputs"], ["ckpt_name"]],
            reference: document.getElementById('model'),
        },
    ];

    const inputValues = inputReferences.reduce((acc, input) => {
        acc[input.reference.id] = {
            ref: input.reference,
            workflow: input.workflow,
            value: input.reference.value,
            cache: null,
            lastExecutedInput: null,
        };
        return acc;
    }, {});

    const saveInputValues = function () {
        inputValues['seed'].value = document.getElementById('seed').value;
        const prompts = getPrompt();
        inputValues['prompt'].value = prompts.positive;
        inputValues['negative-prompt'].value = prompts.negative;
        inputValues['model'].value = document.getElementById('model').value;
        return inputValues;
    };

    const cacheInputValues = function () {
        Object.keys(inputValues).forEach(key => {
            inputValues[key].cache = inputValues[key].value;
        });
        return inputValues;
    };

    const updateWorkflow = function () {
        Object.keys(inputValues).forEach(key => {
            const workflowPath = inputValues[key].workflow;
            let value = inputValues[key].cache;
            if (key === 'gfc-scale')
                value /= 100;

            if (workflowPath.length === 3) {
                workflow[workflowPath[0]][workflowPath[1]][workflowPath[2]] = value;
            } else if (workflowPath.length === 4) {
                workflow[workflowPath[0]][workflowPath[1]][workflowPath[2]] = value;
                workflow[workflowPath[0]][workflowPath[1]][workflowPath[3]] = value;
            } else if (workflowPath.length === 2) {
                workflow[workflowPath[0]][workflowPath[1]] = value;
            }
        });

        // Update negative prompt in the workflow
        if (workflow["6"]["inputs"]["negative_prompt"]) {
            workflow["6"]["inputs"]["negative_prompt"] = inputValues['negative-prompt'].cache;
        }
    };

    // Function to handle workflow generation
    async function handleWorkflowGeneration() {

        // First save and cache the current values
        saveInputValues();
        cacheInputValues();

        // Get the actual prompt values from the elements
        const prompt1 = fixWeights(document.getElementById('prompt-1'));
        const prompt2 = fixWeights(document.getElementById('prompt-2'));
        const prompt3 = fixWeights(document.getElementById('prompt-3'));
        const seed = inputValues['seed'].cache;

        console.log('Getting prompt values:', { prompt1, prompt2, prompt3, seed });

        // Add the actual values to history
        addEntry(prompt1, prompt2, prompt3, seed, true);

        // Update the workflow with the cached values
        updateWorkflow();

        if (isQueueBusy) {
            // If queue is busy, cache the workflow
            cachedWorkflow = JSON.parse(JSON.stringify(workflow));
            setPromptValues(false, prompt1, prompt2, prompt3, seed, document.getElementById('prompt-select').value);
            updateStatus(true, true);
        } else {
            setPromptValues(true, prompt1, prompt2, prompt3, seed, document.getElementById('prompt-select').value);
            isQueueBusy = true;
            updateStatus(true, false);
            await queue_prompt(workflow);
        }
    }

    function setPromptValuesToQueued() {
        const tempValues = promptValues.cache;
        promptValues.queue = tempValues;
    }

    function setPromptValues(isQueue, weight1, weight2, weight3, seed, prompt) {
        const tempValues = {
            prompt: prompt,
            weight_1: weight1,
            weight_2: weight2,
            weight_3: weight3,
            seed: seed
        }
        if (isQueue)
            promptValues.queue = tempValues;
        else
            promptValues.cache = tempValues;
    }

    // Add event listeners for all inputs
    function addInputListeners() {
        // Listen for weight changes
        document.querySelectorAll('.weight').forEach(weightInput => {
            weightInput.addEventListener('input', handleWorkflowGeneration);
            weightInput.addEventListener('change', handleWorkflowGeneration);
        });

        // Listen for seed changes
        document.getElementById('seed').addEventListener('input', handleWorkflowGeneration);
        document.getElementById('seed').addEventListener('change', handleWorkflowGeneration);

        // Listen for model changes
        document.getElementById('model').addEventListener('input', handleWorkflowGeneration);
        document.getElementById('model').addEventListener('change', handleWorkflowGeneration);

        // Listen for prompt set changes
        document.getElementById('prompt-select').addEventListener('change', async function () {
            const output = document.getElementsByClassName('prompt-text');
            const selectedPromptName = this.value;

            if (selectedPromptName && prompts[selectedPromptName]) {
                const selectedPrompt = prompts[selectedPromptName];

                const promptParts = selectedPrompt.prompt.split(',');

                // Update pre-prompt display
                const prePromptDisplay = document.getElementById('pre-prompt-display');
                const prePrompt = selectedPrompt.pre_prompt;
                if (prePrompt && prePrompt.trim()) {
                    prePromptDisplay.style.display = 'flex';
                    prePromptDisplay.querySelector('.pre-prompt-text').textContent = prePrompt;
                } else {
                    prePromptDisplay.style.display = 'none';
                }

                for (let i = 0; i < output.length; i++) {
                    output[i].innerHTML = promptParts[i];
                }

                document.getElementById('negative-prompt').value = selectedPrompt.negative_prompt;

                // Trigger generation after prompt set change
                handleWorkflowGeneration();
            } else {
                console.warn('Selected prompt not found in prompts data');
            }
        });
    }

    function fixWeights(ref) {
        console.log("Fixing field:", ref);
        console.log("Input: ", ref);
        let result = ref.value.trim();
        if (!result || result === null)
            return 0;
        result = Math.max(result, ref.min);
        result = Math.min(result, ref.max);
        ref.value = result;
        return result;
    }

    // Initialize the input handler
    const inputHandler = new InputHandler();
    inputHandler.initialize();

    // Add input listeners
    addInputListeners();

    // Queue initial prompt after initialization
    handleWorkflowGeneration();

    // Resolution controller
    document.querySelectorAll('.radio-card-input').forEach(input => {
        input.addEventListener('change', function () {
            if (this.checked) {
                const label = this.nextElementSibling;
                label.classList.add("selected");
                inputValues.size.ref.value = this.value;
                handleWorkflowGeneration();
            }
        });
    });

    // Add event listener to detect changes to the seed input directly
    document.getElementById('seed').addEventListener('change', () => {
        handleWorkflowGeneration();
    });

    // Add event listener for the new seed button
    document.getElementById('new-seed').addEventListener('click', () => {
        handleWorkflowGeneration();
    });

    // Websocket message handler
    socket.addEventListener('message', async (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message.type === 'executing') {
                if (message.data.node === null && message.data.prompt_id === client_id) {
                    // Generation started
                    resetProgress();
                } else {
                    // Update progress
                    const value = Number(message.data.value);
                    const max = Number(message.data.max);
                    if (isFinite(value) && isFinite(max) && max > 0) {
                        updateProgress(value, max);
                    }
                }
            } else if (message.type === 'progress') {
                // Update progress
                const value = Number(message.data.value);
                const max = Number(message.data.max);
                if (isFinite(value) && isFinite(max) && max > 0) {
                    updateProgress(value, max);
                }
            } else if (message.type === 'executed' || message.type === 'execution_success') {
                if (message.data.node === "9") {
                    // Generation completed
                    finishProgress();
                    isQueueBusy = false;

                    // Display the generated image
                    if ('images' in message.data.output) {
                        const image = message.data.output.images[0];
                        const filename = image.filename;
                        const subfolder = image.subfolder;
                        const rand = Math.random();
                        generationOutput.src = `/view?filename=${filename}&type=output&subfolder=${subfolder}&rand=${rand}`;
                    }

                    // Check if there's a cached workflow
                    if (cachedWorkflow) {
                        // Queue the cached workflow
                        isQueueBusy = true;
                        updateStatus(true, false);
                        setPromptValuesToQueued();
                        await queue_prompt(cachedWorkflow);
                        cachedWorkflow = null;
                    } else {
                        updateStatus(false, false);
                    }
                }
            } else if (message.type === 'execution_error') {
                // Handle execution errors
                console.error(`Execution error: ${message.data.exception_message}`);
                showNotification('Error', `An error occurred during execution: ${message.data.exception_message}`, NotificationType.ERROR);

                // Reset queue state and continue with cached workflow if exists
                isQueueBusy = false;
                finishProgress(); // Ensure progress is finished on error
                if (cachedWorkflow) {
                    isQueueBusy = true;
                    updateStatus(true, false);
                    setPromptValuesToQueued();
                    await queue_prompt(cachedWorkflow);
                    cachedWorkflow = null;
                } else {
                    updateStatus(false, false);
                }
            } else if (message.type === 'execution_start') {
                // Reset progress when execution starts
                resetProgress();
            } else if (message.type === 'execution_cached') {
                // Handle cached execution
                finishProgress(); // Ensure progress is finished for cached executions
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            updateStatus(false, false);
        }
    });

})(window, document);