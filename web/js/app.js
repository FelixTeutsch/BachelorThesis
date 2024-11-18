(async (window, document, undefined) => {
    // UUID generator
    function uuidv4() { return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1),)[0] & (15 >> (c / 4)))).toString(16)); }
    const client_id = uuidv4(); // Custom UUID for client

    // Load workflow
    async function loadWorkflow() {
        // TODO: configure different workflows here
        const response = await fetch('/thesis/workflow/workflow_api.json');
        return response.json();
    }
    const workflow = await loadWorkflow();
    console.log("Workflow loaded:", workflow);

    // Websocket connection
    const server_address = window.location.hostname + ':' + window.location.port;
    const socket = new WebSocket('ws://' + server_address + '/ws?clientId=' + client_id);
    socket.addEventListener('open', (event) => { console.log("Websocket connection established"); });

    // Websocket message handler
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.type === 'executed') {
            console.log(data)
            if ('images' in data['data']['output']) {
                const image = data['data']['output']['images'][0];
                const filename = image['filename']
                const subfolder = image['subfolder']
                const rand = Math.random();

                generationOutput.src = '/view?filename=' + filename + '&type=output&subfolder=' + subfolder + '&rand=' + rand;
            }
        } else if (data.type === 'executing') {
            const steps = {
                '3': {
                    step: 'KSampler',
                    progress: 33,
                },
                '8': {
                    step: 'VAE Decode',
                    progress: 66,
                },
                '9': {
                    step: 'Save Image',
                    progress: 100,
                }
            }
            const progress = data['data']['node'];
            if (!progress) {
                generationProgressBar.innerHTML = `100%`;
                generationProgressBar.value = 100;
                return;
            }
            const stepInfo = steps[progress]
            generationProgressBar.value = stepInfo.progress;
            generationProgressBar.innerHTML = `${stepInfo.progress}%`;
            generaitonProgressValue.innerHTML = ` ${stepInfo.step} (${stepInfo.progress}%)`;
        } else if (data.type === 'progress') {
            generationProgressBar.value += data.data.value;
            generationProgressBar.innerHTML = `${generaitonProgressValue.value}%`;
            generaitonProgressValue.innerHTML = `(${data.data.value * 100 / data.data.max}%)`;
        }
    });

    const generationOutput = document.getElementById("generationOutput");
    const generationProgressBar = document.getElementById("progressBar");
    const generaitonProgressValue = document.getElementById("progressValue");


    async function queue_prompt(prompt = {}) {
        const data = { 'prompt': prompt, 'client_id': client_id };

        const response = await fetch('/prompt', {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    }


    const _prompt = document.getElementById("promptInput");
    const _checkpoint = document.getElementById("checkpointSelect");
    const _steps = document.getElementById("stepsInput");
    const _seedOutput = document.getElementById("seed-output");
    let _resoluitonValue = 512;

    _seedOutput.innerHTML = workflow["3"]["inputs"]["seed"];

    let cachedPrompt = _prompt.value;
    let cachedCheckpoint = _checkpoint.value;
    let cachedSteps = _steps.value;
    let cachedResolution = _resoluitonValue
    let lastExecutedPrompt = null;
    let lastExecutedCheckpoint = null;
    let lastExecutedSteps = null;
    let lastExecutedResolution = null;

    async function checkPrompt() {
        const currentPrompt = _prompt.value;
        const currentCheckpoint = _checkpoint.value;
        const currentSteps = _steps.value;
        const currentResolution = _resoluitonValue;
        clearTimeout(promptTimeout);

        if (currentPrompt.length < 4 || currentPrompt != cachedPrompt || currentCheckpoint != cachedCheckpoint || currentSteps != cachedSteps || currentResolution != cachedResolution) {
            if (currentPrompt != cachedPrompt) {
                console.log("Prompt changed to:", currentPrompt);
            }

            if (currentCheckpoint != cachedCheckpoint) {
                console.log("Checkpoint changed to:", currentCheckpoint);
            }

            if (currentSteps != cachedSteps) {
                console.log("Steps changed to:", currentSteps);
            }

            if (currentResolution != cachedResolution) {
                console.log("Resolution chagned to:", currentResolution);
            }

            cachedPrompt = currentPrompt;
            cachedCheckpoint = currentCheckpoint;
            cachedSteps = currentSteps;
            cachedResolution = currentResolution;
            promptTimeout = setTimeout(checkPrompt, 1000);
            return;
        }

        // Set prompt
        workflow["6"]["inputs"]["text"] = cachedPrompt.replace(/(\r\n|\n|\r)/gm, " ");
        // Set checkpoint
        workflow["4"]["inputs"]["ckpt_name"] = cachedCheckpoint;
        // Set steps
        workflow["3"]["inputs"]["steps"] = cachedSteps;
        // Set resolution
        workflow["5"]["inputs"]["width"] = cachedResolution;
        workflow["5"]["inputs"]["height"] = cachedResolution;

        // Batch size
        // TODO: think about implementing a batch size input
        workflow["5"]["inputs"]["batch_size"] = 1;



        // workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 9999999999);

        if (lastExecutedPrompt !== currentPrompt || lastExecutedCheckpoint !== currentCheckpoint || lastExecutedSteps !== currentSteps || lastExecutedResolution !== currentResolution) {
            console.log("Workflow queued:", workflow);
            await queue_prompt(workflow);
            lastExecutedPrompt = currentPrompt;
            lastExecutedCheckpoint = currentCheckpoint;
            lastExecutedSteps = currentSteps;
            lastExecutedResolution = currentResolution
        }

        promptTimeout = setTimeout(checkPrompt, 1000);
    }

    // Resolution controller
    document.querySelectorAll('.radio-card-input').forEach(input => {
        input.addEventListener('change', function () {
            if (this.checked) {
                const label = this.nextElementSibling;
                label.classList.add("selected");
                _resoluitonValue = this.value;
            }
        });
    });


    let promptTimeout = setTimeout(checkPrompt, 1000);

})(window, document, undefined);

