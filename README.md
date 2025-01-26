# Bachelor Thesis

This project is part of my bachelor thesis

## Abstract

This project is part of my bachelor thesis. The goal is to create a UI for
CompfyUI that can be controlled using a custom controller.

## Installation

A prerequisite for running the application is to have Python installed on your
machine aswell as a functioning version of comfyUI. To install comfyUI, follow
the instructions on the
[comfyUI GitHub page](https://github.com/comfyanonymous/ComfyUI).

### 1. Installing the Application

To run the application, follow these steps:

1. Clone the repository to your local into the comfyUI custom_nodes directory
2. Install the necessary dependencies into the comfyUI environment by running
   `pip install -r requirements.txt`
3. The application starts automatically when you run comfyUI and is accessible
   at `http://localhost:8188/thesis`

### 2. Setting up the Database

The generated images are saved in the /thesis/output directory. The database
saves the reference to the generated images and is a quicker way of looking up
their existance & location. To set up the database, follow these steps:

1. Setup a SQL database and create a table with the following schema:

```sql
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
```

2. Create a .env file in the root directory of the application with the
   following content:

```env
DB_HOST=<host>
DB_USER=<root>
DB_PASSWORD=<password>
DB_NAME=<db_name>
```

Replace the placeholders with the actual values.
