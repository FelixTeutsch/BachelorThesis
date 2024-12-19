import { hideNotification, showNotification } from '../utils/notification.js';

class InputHandler {

    constructor() {
        console.log("InputHandler constructor");
        this.keyBindings = new Map();
        this.selectedItem = null;
        this.initializeKeyBindings();
    }

    initializeKeyBindings() {
        // Reduce
        this.addKeyBinding('ArrowUp', () => {
            console.log(`Increase`);
        });


        // Increase
        this.addKeyBinding('ArrowDown', () => {
            console.log(`Reduce`);
        });

        // Select Model
        this.addKeyBinding('m', () => {
            console.log(`Select Model`);
            this.updateSelectedItem(document.getElementById('model-module'));
        });

        // Select Prompt
        this.addKeyBinding('p', () => {
            console.log(`Select Prompt`);
            this.updateSelectedItem(document.getElementById('prompt-module'));
        });

        // Select Steps
        this.addKeyBinding('s', () => {
            console.log(`Select Steps`);
            this.updateSelectedItem(document.getElementById('steps-module'));
        });

        // Select Sampler
        this.addKeyBinding('x', () => {
            console.log(`Select Sampler`);
            this.updateSelectedItem(document.getElementById('sampler-module'));
        });

        // Select CFG Scale
        this.addKeyBinding('c', () => {
            console.log(`Select CFG Scale`);
            this.updateSelectedItem(document.getElementById('gfc-scale-module'));
        });

        // Select Lora
        this.addKeyBinding('l', () => {
            console.log(`Select Lora`);
            this.updateSelectedItem(document.getElementById('lora-module'));
        });

        // Select Size
        this.addKeyBinding('z', () => {
            console.log(`Select Size`);
            this.updateSelectedItem(document.getElementById('size-module'));
        });

        // Select Seed
        this.addKeyBinding('y', () => {
            console.log(`Select Seed`);
            this.updateSelectedItem(document.getElementById('seed-module'));
        });

        // Generate
        this.addKeyBinding('g', () => {
            console.log(`Generate`);
        });

        this.addKeyBinding('Escape', () => {
            console.log(`Escape`);
            if (hideNotification()) {
                console.log("Notification closed");
            } else {
                Array.from(document.getElementsByClassName('selected')).forEach(selectedElement => {
                    selectedElement.classList.remove('selected');
                });
                console.log("Selected elements cleared");
            }
        });
    }

    addKeyBinding(key, handler) {
        this.keyBindings.set(key, handler);
    }

    handleKeyPress(event) {
        // Check if Alt key is pressed and it's a number between 1-8
        if (this.keyBindings.has(event.key)) {
            event.preventDefault(); // Prevent default browser behavior
            const handler = this.keyBindings.get(event.key);

            if (handler) {
                handler();
            }
        } else {
            console.log("Invalid key pressed:", event.key);
        }
    }

    updateSelectedItem(item) {
        if (this.selectedItem) {
            this.selectedItem.classList.remove('selected');
        }
        this.selectedItem = item;
        item.classList.add('selected');
    }

    initialize() {
        console.log("InputHandler initialize");
        // Add event listener to document
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }
}

// Export the input handler
export default InputHandler;
