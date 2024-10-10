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
    const address = window.location.hostname + ":" + window.location.port;
    const ws = new WebSocket(`ws://${address}/ws?client_id=${client_id}`);
    ws.addEventListener('open', (event) => { console.log("Websocket connection established"); });

    // Websocket message handler
    ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        console.log("Websocket message received:", message);

        if (message.type === "executed") {
            if ('images' in data['data']['output']) {
                const images = data['data']['output']['images'][0];
                const filename = images['filename'];
                const subfolder = images['subfolder'];
                const rand = Math.random();

                generationOutput.src = '/view?filename=' + filename + '&type=output&subfolder=' + subfolder + '&rand=' + rand
            }
        }
    });

    const generationOutput = document.getElementById("generationOutput");

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
    let cachedPrompt = _prompt.value;
    let lastExecutedPrompt = null;

    async function checkPrompt() {
        console.log("Checking prompt...");
        const currentPrompt = _prompt.value;
        clearTimeout(promptTimeout);

        if (currentPrompt.length < 2 || currentPrompt != cachedPrompt) {
            cachedPrompt = currentPrompt;
            promptTimeout = setTimeout(checkPrompt, 500);
            return;
        }

        workflow["6"]["inputs"]["text"] = currentPrompt.replace(/(\r\n|\n|\r)/gm, " ");
        // workflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 9999999999);

        if (lastExecutedPrompt !== currentPrompt) {
            await queue_prompt(workflow);
            lastExecutedPrompt = currentPrompt;
        }

        promptTimeout = setTimeout(checkPrompt, 500);
    }

    let promptTimeout = setTimeout(checkPrompt, 500);

})(window, document, undefined);


