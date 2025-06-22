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
        this.addKeyBinding('ArrowUp', (event) => {
            if (!event.altKey) return;
            if (selected) {
                const value = selected.value;
                const currentValue = isBlankOrNull(value) ? selected.min : parseFloat(value);
                selected.value = Math.min((currentValue + weightSpeed).toFixed(2), selected.max);
                selected.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                showNotification('Nothing selected', 'No element selected! Please select an element first!', NotificationType.WARNING);
            }
        });

        // Decrease value
        this.addKeyBinding('ArrowDown', (event) => {
            if (!event.altKey) return;
            if (selected) {
                const value = selected.value;
                const currentValue = isBlankOrNull(value) ? selected.min : parseFloat(value);
                selected.value = Math.max((currentValue - weightSpeed).toFixed(2), selected.min);
                selected.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                showNotification('Nothing selected', 'No element selected! Please select an element first!', NotificationType.WARNING);
            }
        });

        // Select Prompt 1
        this.addKeyBinding('Digit1', (event) => {
            if (!event.altKey) return;
            this.updateSelectedItem('prompt-1');
        });

        // Select Prompt 2
        this.addKeyBinding('Digit2', (event) => {
            if (!event.altKey) return;
            this.updateSelectedItem('prompt-2');
        });

        // Select Prompt 3
        this.addKeyBinding('Digit3', (event) => {
            if (!event.altKey) return;
            this.updateSelectedItem('prompt-3');
        });

        // New Seed
        this.addKeyBinding('KeyR', (event) => {
            if (!event.altKey) return;
            seed.click();
        });

        // Undo - Arrow Left
        this.addKeyBinding('ArrowLeft', (event) => {
            if (!event.altKey) return;
            const undoButton = document.getElementById('undo');
            if (!undoButton.disabled) {
                undoButton.click();
            }
        });

        // Redo - Arrow Right
        this.addKeyBinding('ArrowRight', (event) => {
            if (!event.altKey) return;
            const redoButton = document.getElementById('redo');
            if (!redoButton.disabled) {
                redoButton.click();
            }
        });

        this.addKeyBinding('Escape', (event) => {
            if (!event.altKey) return;
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

    addKeyBinding(code, handler) {
        this.keyBindings.set(code, handler);
    }

    handleKeyPress(event) {
        if (this.keyBindings.has(event.code)) {
            // Only handle if Alt is pressed
            if (event.altKey) {
                event.preventDefault();
                event.stopPropagation();
                console.log('Custom Alt+Key handler triggered:', event.code);
                const handler = this.keyBindings.get(event.code);
                if (handler) {
                    handler(event);
                }
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
        document.addEventListener('keydown', (event) => {
            console.log('keydown event:', { key: event.key, code: event.code, altKey: event.altKey, target: event.target });
            this.handleKeyPress(event);
        });
    }
}

// Export the input handler
export default InputHandler;
