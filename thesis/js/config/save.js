async function saveImage(imageName, imageData, metadata) {
    console.log('Saving image...', { imageName, metadata });

    try {
        const response = await fetch('/thesis/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageName: imageName,  // Use the actual image name
                imageData: imageData,  // Use the actual base64 image data
                metadata: {
                    model: metadata.model || '',
                    promptName: metadata.promptName || '',
                    positivePrompt: metadata.positivePrompt || '',
                    negativePrompt: metadata.negativePrompt || '',
                    steps: metadata.steps || 0,
                    sampler: metadata.sampler || '',
                    cfgScale: metadata.cfgScale || 0,
                    lora: metadata.lora || '',
                    width: metadata.width || 0,
                    height: metadata.height || 0,
                    seed: metadata.seed || 0
                }
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Image saved successfully:', result);
            return result;
        } else {
            throw new Error(`Failed to save image: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error saving image:', error);
        throw error;
    }
}