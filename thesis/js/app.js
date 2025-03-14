import { loadModels, loadLoras, loadPrompts, loadSamplers } from './config/populate_selects.js';
import InputHandler from './config/input_handler.js';
import { showNotification, NotificationType } from './utils/notification.js';
import { resetProgress, updateProgress, finishProgress } from './progress.js';
import { getPrompt } from './utils/TextUtils.js';

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
    socket.addEventListener('open', (event) => { console.log("Websocket connection established"); });

    const generationOutput = document.getElementById("output-image");

    async function queue_prompt(prompt = {}) {
        const data = { 'prompt': prompt, 'client_id': client_id };

        try {
            console.log("Queuing prompt:", data);

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

            console.log("Prompt was queued:", response);
        } catch (error) {
            console.error("Error queuing prompt:", error);
            showNotification('Error', `Failed to queue prompt: ${error.message}`, NotificationType.ERROR);
        }
        // }
    }

    const inputReferences = [
        {
            workflow: [["6"], ["inputs"], ["text"]],
            reference: document.getElementById('prompt'),
        }, {
            workflow: [["3"], ["inputs"], ["seed"]],
            reference: document.getElementById('seed'),
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
        console.log("reloadInputValues - START");
        console.log("Input values:", inputValues);
        inputValues['seed'].value = document.getElementById('seed').value;
        inputValues['prompt'].value = getPrompt();
        console.log("reloadInputValues - END", inputValues);
        return inputValues;
    };

    const inputValuesChanged = function () {
        console.log("inputValuesChanged - START");


        const result = inputValues['seed'].value !== document.getElementById('seed').value || inputValues['prompt'].value !== getPrompt()
        //  result = Object.keys(inputValues).some(key => inputValues[key].value !== inputValues[key].ref.value);

        console.log("inputValuesChanged - END", result);
        return result;
    };

    const cacheInputValues = function () {
        console.log("cacheInputValues - START");
        Object.keys(inputValues).forEach(key => {
            inputValues[key].cache = inputValues[key].value;
        });
        console.log("cacheInputValues - END", inputValues);
        return inputValues;
    };

    const chachedValuesExecuted = function () {
        console.log("chachedValuesExecuted - START");
        const result = Object.keys(inputValues).some(key => inputValues[key].cache !== inputValues[key].lastExecutedInput);
        console.log("chachedValuesExecuted - END", result);
        return result;
    };

    const setLastExecuted = function () {
        console.log("setLastExecuted - START");
        Object.keys(inputValues).forEach(key => {
            inputValues[key].lastExecutedInput = inputValues[key].cache;
        });
        console.log("setLastExecuted - END", inputValues);
        return inputValues;
    };

    const updateWorkflow = function () {
        console.log("updateWorkflow - START");
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
        console.log("updateWorkflow - END", workflow);
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
        // promptTimeout = setTimeout(checkPrompt, 1000);
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
                console.log("Resolution changed to:", this.value);
            }
        });
    });

    let promptTimeout = setTimeout(checkPrompt, 1000);



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
                console.log("Current status\nQueues remaining:", data.data.status.exec_info.queue_remaining);
                if (data.data.status.exec_info.queue_remaining > 0) {
                    resetProgress();
                }
                break;
            case 'executing':
                console.log("Currently executing\nPromptID:", data.data.prompt_id, "\nCurrent node:", data.data.node);
                break;
            case 'executed':
                finishProgress();
                console.log("Completed execution\nPromptID:", data.data.prompt_id, "\nTimestamp:", new Date(data.data.timestamp).toLocaleString());
                if ('images' in data['data']['output']) {
                    const image = data['data']['output']['images'][0];
                    const filename = image['filename']
                    const subfolder = image['subfolder']
                    const rand = Math.random();

                    generationOutput.src = '/view?filename=' + filename + '&type=output&subfolder=' + subfolder + '&rand=' + rand;
                }

                break;
            case 'progress':
                console.log("Progress:", data.data.value, "of", data.data.max);
                updateProgress(data.data.value, data.data.max);
                break;
            case 'execution_start':
                console.log("Started execution\nPromptID:", data.data.prompt_id, "\nTimestamp:", new Date(data.data.timestamp).toLocaleString());
                break;
            case 'execution_cached':
                console.log("Cached execution\nPromptID:", data.data.prompt_id, "\nTimestamp:", new Date(data.data.timestamp).toLocaleString());
                break;
            case 'execution_error':
                const errorData = data.data;
                const errorMessage = 'Execution error:' +
                    '\n\nPrompt ID: ' + errorData.prompt_id +
                    '\n\nNode ID: ' + errorData.node_id +
                    '\n\nNode Type: ' + errorData.node_type +
                    '\n\nException Message: ' + errorData.exception_message +
                    '\n\nException Type: ' + errorData.exception_type +
                    '\n\nTraceback: ' + errorData.traceback.join('\n') +
                    '\n\nTimestamp: ' + new Date(errorData.timestamp).toLocaleString();
                console.error(errorMessage);
                showNotification(errorData.exception_type, `An error occurred during execution: ${data.data.exception_message}`, NotificationType.ERROR);
                break;
            case 'execution_success':
                console.log("Completed execution\nPromptID:", data.data.prompt_id, "\nTimestamp:", new Date(data.data.timestamp).toLocaleString());
                break;
            default:
                console.log("Unknown message type:", data.type);
                break;
        }
    });

})(window, document, undefined);
