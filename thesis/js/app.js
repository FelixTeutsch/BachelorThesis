// Main Application JavaScript for Thesis UI - Controls image generation interface
import { loadModels, loadPrompts } from './config/populate_selects.js';
import InputHandler from './config/input_handler.js';
import { showNotification, NotificationType } from './utils/notification.js';
import { resetProgress, updateProgress, finishProgress } from './progress.js';
import { getPrompt } from './utils/TextUtils.js';
import { addEntry } from './utils/history.js';

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

    // Websocket connection
    const server_address = window.location.hostname + ':' + window.location.port;
    const socket = new WebSocket('ws://' + server_address + '/ws?clientId=' + client_id);
    socket.addEventListener('open', (event) => {
        // Websocket connection established
    });

    const generationOutput = document.getElementById("output-image");

    // Populate model and prompt selects
    loadModels();
    let prompts = {}; // Initialize as empty object

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

    async function queue_prompt(prompt = {}) {
        const data = { 'prompt': prompt, 'client_id': client_id };

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
        inputValues['prompt'].value = getPrompt();
        inputValues['model'].value = document.getElementById('model').value;
        return inputValues;
    };

    const inputValuesChanged = function () {


        return inputValues['seed'].value !== document.getElementById('seed').value ||
            inputValues['prompt'].value !== getPrompt() ||
            inputValues['model'].value !== document.getElementById('model').value;
    };

    const cacheInputValues = function () {
        Object.keys(inputValues).forEach(key => {
            inputValues[key].cache = inputValues[key].value;
        });
        return inputValues;
    };

    const chachedValuesExecuted = function () {
        const result = Object.keys(inputValues).some(key => inputValues[key].cache !== inputValues[key].lastExecutedInput);
        return result;
    };

    const setLastExecuted = function () {
        if (inputValues['prompt'].lastExecutedInput != null) {
            const prompt = inputValues['prompt'].lastExecutedInput.split(',').map(e => e.split(':')[1]);
            const seed = inputValues['seed'].lastExecutedInput;

            // Determine if this is a user-initiated change or just an automatic re-generation
            const isNewUserInput =
                (inputValues['seed'].cache !== inputValues['seed'].lastExecutedInput ||
                    inputValues['prompt'].cache !== inputValues['prompt'].lastExecutedInput) &&
                // Additional check: is cache different from what was already executed before?
                (inputValues['seed'].cache !== inputValues['seed'].value ||
                    inputValues['prompt'].cache !== inputValues['prompt'].value);

            // Pass the clearRedo flag to control whether to clear redo history
            // Only clear redo when there's an actual user change
            addEntry(prompt[0], prompt[1], prompt[2], seed, isNewUserInput);
        }
        // Update the last executed values
        Object.keys(inputValues).forEach(key => {
            inputValues[key].lastExecutedInput = inputValues[key].cache;
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
    };

    inputValues.seed.ref.value = workflow["3"]["inputs"]["seed"];

    async function checkPrompt() {
        clearTimeout(promptTimeout);

        // Check if the input values have changed
        if (inputValuesChanged()) {
            saveInputValues();
            cacheInputValues();
            promptTimeout = setTimeout(checkPrompt, 1000);
            return;
        }

        // Update workflow with input values
        updateWorkflow();

        if (chachedValuesExecuted()) {
            resetProgress();
            await queue_prompt(workflow);
            setLastExecuted();
        }

        // Queue next generation
        promptTimeout = setTimeout(checkPrompt, 1000);
    }

    // Initialize the input handler
    const inputHandler = new InputHandler();
    inputHandler.initialize();

    // Resolution controller
    document.querySelectorAll('.radio-card-input').forEach(input => {
        input.addEventListener('change', function () {
            if (this.checked) {
                const label = this.nextElementSibling;
                label.classList.add("selected");
                inputValues.size.ref.value = this.value;
            }
        });
    });

    let promptTimeout = setTimeout(checkPrompt, 1000);

    document.getElementById('prompt-select').addEventListener('change', async function () {
        const output = document.getElementsByClassName('prompt-text');
        const selectedPromptName = this.value;

        if (selectedPromptName && prompts[selectedPromptName]) {
            const selectedPrompt = prompts[selectedPromptName];

            const promptParts = selectedPrompt.prompt.split(',');

            for (let i = 0; i < output.length; i++) {
                output[i].innerHTML = promptParts[i];
            }

            document.getElementById('negative-prompt').value = selectedPrompt.negative_prompt;

        } else {
            console.warn('Selected prompt not found in prompts data');
        }
    });

    // Websocket message handler
    socket.addEventListener('message', async (event) => {
        var data = "";
        try {
            if (event.data instanceof Blob) {
                return;
            } else {
                data = JSON.parse(event.data);
            }
        } catch (error) {
            console.error("Error parsing websocket message:", error);
            showNotification('Error', `Failed to parse websocket message: ${error.message}`, NotificationType.ERROR);
            return;
        }
        switch (data.type) {
            case 'statusfe':
                if (data.data.status.exec_info.queue_remaining > 0) {
                    resetProgress();
                }
                break;
            case 'executing':
                // Currently executing
                break;
            case 'executed':
                finishProgress();
                if ('images' in data['data']['output']) {
                    const image = data['data']['output']['images'][0];
                    const filename = image['filename']
                    const subfolder = image['subfolder']
                    const rand = Math.random();

                    generationOutput.src = '/view?filename=' + filename + '&type=output&subfolder=' + subfolder + '&rand=' + rand;
                }

                break;
            case 'progress':
                updateProgress(data.data.value, data.data.max);
                break;
            case 'execution_start':
                // Execution started
                break;
            case 'execution_cached':
                // Execution cached
                break;
            case 'execution_error':
                const errorData = data.data;
                // Log error details to console for debugging
                console.error(`Execution error in prompt ${errorData.prompt_id}: ${errorData.exception_message}`);
                showNotification(errorData.exception_type, `An error occurred during execution: ${data.data.exception_message}`, NotificationType.ERROR);
                break;
            case 'execution_success':
                // Execution completed successfully
                break;
            default:
                // Unknown message type
                break;
        }
    });

})(window, document, undefined);