INSERT INTO
    images (
        filename,
        size,
        width,
        height,
        path,
        model,
        promptName,
        steps,
        sampler,
        cfgScale,
        lora,
        seed
    )
VALUES
    (
        'image_1737891248669.png',
        248471,
        512,
        512,
        '/Users/felixteutsch/Stable Diffusion/ComfyUI/custom_nodes/Thesis/thesis/output/image_1737891248669.png',
        'sdxl_lightning_8step.safetensors',
        'Anime Woman',
        '20',
        'euler',
        '50',
        'lcm-lora-sdv1-5.safetensors',
        456571174638566
    );