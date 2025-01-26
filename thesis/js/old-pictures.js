// Function to load and display old pictures
async function loadOldPictures() {
    try {
        const outputHistory = document.getElementById('output-history-mask');
        outputHistory.innerHTML = '';

        // Fetch image list from our new Python endpoint
        const response = await fetch('/thesis/api/images');
        const images = await response.json();

        // Sort images by creation date (newest first)
        images.sort((a, b) => b.createdAt - a.createdAt);

        // Display each image
        images.forEach(image => {
            const imgElement = document.createElement('img');
            imgElement.src = `/thesis/output/${image.filename}`;
            imgElement.alt = image.filename;
            imgElement.className = 'output-history-image';
            outputHistory.appendChild(imgElement);
        });

    } catch (error) {
        console.error('Error loading old pictures:', error);
    }
}

export const refreshImages = async () => {
    console.log('Refreshing images...');
    try {
        const outputHistory = document.getElementById('output-history-mask');
        const existingImages = new Set(
            Array.from(outputHistory.getElementsByTagName('img'))
                .map(img => img.alt)
        );

        // Fetch updated image list
        const response = await fetch('/thesis/api/images');
        const images = await response.json();

        // Sort images by creation date (newest first)
        images.sort((a, b) => b.createdAt - a.createdAt);

        // Add only new images
        images.forEach(image => {
            if (!existingImages.has(image.filename)) {
                const imgElement = document.createElement('img');
                imgElement.src = `/thesis/output/${image.filename}`;
                imgElement.alt = image.filename;
                imgElement.className = 'output-history-image';
                // Add new images at the beginning
                outputHistory.insertBefore(imgElement, outputHistory.firstChild);
            }
        });

    } catch (error) {
        console.error('Error refreshing images:', error);
    }
};

// Load pictures when the page loads
document.addEventListener('DOMContentLoaded', loadOldPictures);

// Refresh images periodically (every 30 seconds)
// setInterval(refreshImages, 30000);
