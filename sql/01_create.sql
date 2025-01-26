CREATE DATABASE thesis;

USE thesis;

CREATE TABLE
    IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        size INTEGER,
        width INTEGER,
        height INTEGER,
        path TEXT,
        model TEXT,
        promptName TEXT,
        steps INTEGER,
        sampler TEXT,
        cfgScale REAL,
        lora TEXT,
        metadata_width INTEGER,
        metadata_height INTEGER,
        seed INTEGER
    );