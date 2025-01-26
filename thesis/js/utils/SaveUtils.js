export const saveImageData = async ({
    model,
    prompt,
    steps,
    sampler,
    cfg_scale,
    lora,
    width,
    height,
    seed,
    imagePath
}) => {
    try {
        let imageData = await convertToBase64(imagePath);
        const body = JSON.stringify({
            imageName: `image_${Date.now()}.png`, // Generate unique filename
            imageData,
            metadata: {
                model,
                promptName: prompt,
                steps,
                sampler,
                cfgScale: cfg_scale,
                lora,
                width,
                height,
                seed,
                imageData
            }
        });

        const response = await fetch('/thesis/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to save image data:', data, response);
            throw new Error(data.message || 'Failed to save image data');
        }

        return data;
    } catch (error) {
        console.error('Error saving image data:', error);
        throw error;
    }
};

export const convertToBase64 = async (imageData) => {
    try {
        const response = await fetch(imageData);
        const blob = await response.blob();

        console.log('Blob:', blob);

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to base64:', error);
        return imageData;
    }
};

export const checkImageExists = async ({
    model,
    prompt,
    steps,
    sampler,
    cfg_scale,
    lora,
    width,
    height,
    seed
}) => {
    try {
        const queryParams = new URLSearchParams({
            model,
            prompt,
            steps,
            sampler,
            cfg_scale,
            lora,
            width,
            height,
            seed
        });

        const response = await fetch(`/thesis/api/image?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        // Check both response.ok and data.success
        if (!response.ok || !data.success) {
            return {
                exists: false,
                path: null
            };
        }

        // Verify data.data exists and has a path
        if (!data.data || !data.data.path) {
            return {
                exists: false,
                path: null
            };
        }

        return {
            exists: true,
            path: data.data.path
        };

    } catch (error) {
        console.error('Error checking image existence:', error);
        return {
            exists: false,
            path: null
        };
    }
};