const notification_wrapper = document.querySelector('#notification-wrapper');
const notification = document.querySelector('#notification');
const notificationTitle = document.querySelector('#notification-title');
const notificationMessage = document.querySelector('#notification-message');
const notificationIcon = document.querySelector('#notification-icon');
const notificationClose = document.querySelector('#notification-close');

const error_symbol = "error";
const warning_symbol = "warning";
const success_symbol = "check_box";

let notificationTimeout;

export const NotificationType = {
    ERROR: {
        name: 'error',
        symbol: 'error'
    },
    WARNING: {
        name: 'warning'
        ,
        symbol: 'warning'
    },
    SUCCESS: {
        name: 'success',
        symbol: 'check_box'
    },
}

/**
 * @typedef {Object} NotificationTypeObject
 * @property {string} name
 * @property {string} symbol
 */

/**
 * @typedef {typeof NotificationType[keyof typeof NotificationType]} NotificationType
 */

/**
 * @param {string} title
 * @param {string} message
 * @param {NotificationType} [type=NotificationType.SUCCESS]
 */
export const showNotification = (title, message, type = NotificationType.SUCCESS) => {
    notification_wrapper.classList.remove('hidden');

    console.log('Notification Type:', type.name.toLowerCase());
    notification.className = ''; // clear all classes
    notification.classList.add(type.name.toLowerCase());
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationIcon.textContent = type.symbol;


    if (type === NotificationType.SUCCESS)
        notificationTimeout = setTimeout(() => {
            hideNotification();
        }, 5000);
}

export const hideNotification = () => {
    console.log('Notification Hidden:', notification_wrapper.classList.contains('hidden'));
    if (notification_wrapper.classList.contains('hidden')) return false;
    notification_wrapper.classList.add('hidden');
    clearTimeout(notificationTimeout);
    return true;
}

notificationClose.addEventListener('click', () => {
    hideNotification();
});
notification.addEventListener('click', (event) => {
    event.stopPropagation();
});

notification_wrapper.addEventListener('click', () => {
    hideNotification();
});