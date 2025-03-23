import { hideNotification, showNotification, NotificationType } from '../utils/notification.js';

let selected = document.getElementsByClassName('selected')[0];
const seed = document.getElementById('new-seed');
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
            console.log('Increase');
            if (selected) {
                selected.setAttribute('value', parseInt(selected.getAttribute('value')) + 1);
                console.log('Increased value to:', selected.getAttribute('value'));
            } else
                showNotification('Nothing selected', 'No element selected! Please select an element first!', NotificationType.WARNING);

        });


        // Increase
        this.addKeyBinding('ArrowDown', () => {
            console.log('Reduce');
            if (selected) {
                selected.setAttribute('value', Math.max(parseInt(selected.getAttribute('value')) - 1, 0));
                console.log('Increased value to:', selected.getAttribute('value'));
            } else
                showNotification('Nothing selected', 'No element selected! Please select an element first!', NotificationType.WARNING);


        });

        // Select Prompt 1
        this.addKeyBinding('1', () => {
            console.log('Select Prompt 1');
            this.updateSelectedItem('prompt-1');
        });

        // Select Prompt 2
        this.addKeyBinding('2', () => {
            console.log('Select Prompt 2');
            this.updateSelectedItem('prompt-2');
        });

        // Select Prompt 3
        this.addKeyBinding('3', () => {
            console.log('Select Prompt 3');
            this.updateSelectedItem('prompt-3');
        });

        // New Seed
        this.addKeyBinding('g', () => {
            console.log('Generate new seed');
            seed.click();
        });

        this.addKeyBinding('Escape', () => {
            console.log('Escape');
            if (hideNotification()) {
                console.log("Notification closed");
            } else {
                Array.from(document.getElementsByClassName('selected')).forEach(selectedElement => {
                    selectedElement.classList.remove('selected');
                });
                selected = null;
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

    updateSelectedItem(id) {
        // remove ID
        if (selected)
            selected.classList.remove('selected');
        // Get element by id id
        selected = document.getElementById(id);
        if (!selected) {
            showNotification('Invalid ID', `Element with ID ${id} not found`, NotificationType.ERROR);
            return;
        }
        selected.classList.add('selected');
    }

    initialize() {
        console.log("InputHandler initialize");
        // Add event listener to document
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }
}

// Export the input handler
export default InputHandler;
