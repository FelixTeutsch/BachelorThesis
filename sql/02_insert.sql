INSERT INTO images (
    filename, size, width, height, path, model, promptName, steps, sampler, cfgScale, lora, seed
) VALUES (
    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
);