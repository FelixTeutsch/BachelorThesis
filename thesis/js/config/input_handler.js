import { hideNotification, showNotification, NotificationType } from '../utils/notification.js';

let selected = document.getElementsByClassName('selected')[0];
const seed = document.getElementById('new-seed');

const weightSpeed = 0.05;

// Helper function to check if a value is blank or null
function isBlankOrNull(value) {
    return value === null || value === undefined || value === '' || value.toString().trim() === '';
}

class InputHandler {
    constructor() {
        this.keyBindings = new Map();
        this.selectedItem = null;
        this.initializeKeyBindings();
    }

    initializeKeyBindings() {
        // Increase value
        this.addKeyBinding('ArrowUp', () => {
            if (selected) {
                const value = selected.value;
                const currentValue = isBlankOrNull(value) ? selected.min : parseFloat(value);
                selected.value = Math.min((currentValue + weightSpeed).toFixed(2), selected.max);
                // Trigger change event
                selected.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                showNotification('Nothing selected', 'No element selected! Please select an element first!', NotificationType.WARNING);
            }
        });

        // Decrease value
        this.addKeyBinding('ArrowDown', () => {
            if (selected) {
                const value = selected.value;
                const currentValue = isBlankOrNull(value) ? selected.min : parseFloat(value);
                selected.value = Math.max((currentValue - weightSpeed).toFixed(2), selected.min);
                // Trigger change event
                selected.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                showNotification('Nothing selected', 'No element selected! Please select an element first!', NotificationType.WARNING);
            }
        });

        // Select Prompt 1
        this.addKeyBinding('1', () => {
            this.updateSelectedItem('prompt-1');
        });

        // Select Prompt 2
        this.addKeyBinding('2', () => {
            this.updateSelectedItem('prompt-2');
        });

        // Select Prompt 3
        this.addKeyBinding('3', () => {
            this.updateSelectedItem('prompt-3');
        });

        // New Seed
        this.addKeyBinding('r', () => {
            seed.click();
        });

        // Undo - Arrow Left
        this.addKeyBinding('ArrowLeft', () => {
            const undoButton = document.getElementById('undo');
            if (!undoButton.disabled) {
                undoButton.click();
            }
        });

        // Redo - Arrow Right
        this.addKeyBinding('ArrowRight', () => {
            const redoButton = document.getElementById('redo');
            if (!redoButton.disabled) {
                redoButton.click();
            }
        });

        this.addKeyBinding('Escape', () => {
            if (hideNotification()) {
                // Notification closed
            } else {
                Array.from(document.getElementsByClassName('selected')).forEach(selectedElement => {
                    selectedElement.classList.remove('selected');
                });
                selected = null;
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
        }
    }

    updateSelectedItem(id) {
        const newSelected = document.getElementById(id);
        if (newSelected) {
            if (selected) {
                selected.classList.remove('selected');
            }
            newSelected.classList.add('selected');
            selected = newSelected;
        }
    }

    initialize() {
        // Add event listener to document
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }
}

// Export the input handler
export default InputHandler;
