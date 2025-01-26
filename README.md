# Thesis Project - AI Image Generation Interface

A web interface for generating and managing AI images using ComfyUI.

## Quick Start

ComfyUI must be installed and set up before running this project

```bash
cd <comfyui_directory>/custom_nodes
git clone https://github.com/FelixTeutsch/BachelorThesis.git
cd Thesis
pip install -r requirements.txt
```

Visit `http://localhost:8188/thesis` after starting ComfyUI.

## Prerequisites

- Python 3.8+
- ComfyUI installed
- MySQL/MariaDB

## Installation

### 1. ComfyUI Setup

1. Clone this repository into ComfyUI's `custom_nodes` directory
2. Install dependencies:
      ```bash
      pip install -r requirements.txt
      ```
3. Start ComfyUI - the application will be available at
   `http://localhost:8188/thesis`

### 2. Database Setup

#### Create Database Schema

```sql
CREATE TABLE IF NOT EXISTS images (
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
```

#### Configure Environment

Create

.env

file in project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
```

## Storage

Generated images are saved in output directory. The database maintains
references for quick lookups.

## Features

- Image generation through ComfyUI
- Database-backed image management
- Real-time generation progress
- Image metadata tracking

## Technical Details

- Frontend: JavaScript/HTML
- Backend: Python
- Database: MySQL/MariaDB
- Integration: ComfyUI custom nodes
