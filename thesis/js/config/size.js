const sizeSmall = document.getElementById('size-small');
const sizeMedium = document.getElementById('size-medium');
const sizeLarge = document.getElementById('size-large');
const size = document.getElementById('size');

let currentSize = 'size-small';

sizeSmall.addEventListener('click', () => setSize('size-small'));
sizeMedium.addEventListener('click', () => setSize('size-medium'));
sizeLarge.addEventListener('click', () => setSize('size-large'));

function setSize(newSize) {
    sizeSmall.classList.remove('selected');
    sizeMedium.classList.remove('selected');
    sizeLarge.classList.remove('selected');
    document.getElementById(newSize).classList.add('selected');
    currentSize = newSize;
    size.value = newSize === 'size-small' ? 512 : newSize === 'size-medium' ? 1024 : 2048;
}

function getCurrentSize() {
    return currentSize;
}

setSize('size-small');