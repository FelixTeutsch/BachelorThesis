import os
import server
from aiohttp import web
import json
from pathlib import Path
from PIL import Image
import base64
from datetime import datetime
import logging
import sys
import subprocess
import asyncio
from PIL.PngImagePlugin import PngInfo
import io
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "thesis")

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

server.PromptServer.instance.routes.static(
    "/thesis/css/", path=os.path.join(WEBROOT, "css")
)
server.PromptServer.instance.routes.static(
    "/thesis/js/", path=os.path.join(WEBROOT, "js")
)
server.PromptServer.instance.routes.static(
    "/thesis/workflow/", path=os.path.join(WEBROOT, "workflow")
)
server.PromptServer.instance.routes.static(
    "/thesis/img/", path=os.path.join(WEBROOT, "img")
)
server.PromptServer.instance.routes.static(
    "/thesis/output/", path=os.path.join(WEBROOT, "output")
)

# Database Connection
image_db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
)
image_cursor = image_db.cursor()

sqlSelect = "SELECT * FROM images"
sqlInsert = "INSERT INTO images (filename, width, height, path, model, promptName, steps, sampler, cfgScale, lora, seed) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"
sqlSelect = "SELECT * FROM images WHERE width = %s AND height = %s AND model = %s AND promptName = %s AND steps = %s AND sampler = %s AND cfgScale = %s AND lora = %s AND seed = %s"


@server.PromptServer.instance.routes.get("/thesis")
def get_ui(request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html"))


# Add new endpoint to get images
@server.PromptServer.instance.routes.get("/thesis/api/images")
async def get_images(request):
    logger.info("Fetching images from output directory")
    output_dir = os.path.join(WEBROOT, "output")
    images = []

    for file in Path(output_dir).glob("*"):
        if file.suffix.lower() in [".png", ".jpg", ".jpeg", ".gif"]:
            try:
                logger.debug(f"Processing image: {file.name}")
                # Open image to get dimensions and metadata
                with Image.open(file) as img:
                    width, height = img.size
                    metadata = img.text or {}  # Get metadata from image

                # Get file stats
                stats = file.stat()

                # Convert timestamp to ISO format string if it's from file system
                created_at = metadata.get("createdAt")
                if not created_at:
                    created_at = datetime.fromtimestamp(
                        os.path.getctime(file)
                    ).isoformat()

                images.append(
                    {
                        "filename": file.name,
                        "createdAt": created_at,
                        "size": stats.st_size,
                        "width": width,
                        "height": height,
                        "path": f"/thesis/output/{file.name}",
                        "metadata": {
                            "model": metadata.get("model"),
                            "promptName": metadata.get("promptName"),
                            "positivePrompt": metadata.get("positivePrompt"),
                            "negativePrompt": metadata.get("negativePrompt"),
                            "steps": metadata.get("steps"),
                            "sampler": metadata.get("sampler"),
                            "cfgScale": metadata.get("cfgScale"),
                            "lora": metadata.get("lora"),
                            "width": metadata.get("width"),
                            "height": metadata.get("height"),
                            "seed": metadata.get("seed"),
                            "createdAt": created_at,
                        },
                    }
                )
            except Exception as e:
                logger.error(f"Error processing {file.name}: {str(e)}")
                continue

    # Sort by creation time, newest first
    # Convert ISO strings to datetime objects for comparison
    images.sort(key=lambda x: datetime.fromisoformat(x["createdAt"]), reverse=True)

    logger.info(f"Successfully retrieved {len(images)} images")
    return web.json_response(images)


@server.PromptServer.instance.routes.post("/thesis/api/images")
async def save_image(request):
    try:
        logger.info("Received request to save new image")
        data = await request.json()

        image_name = data.get("imageName")
        logger.info(f"Processing image: {image_name}")

        # Ensure output directory exists
        output_dir = os.path.join(WEBROOT, "output")
        os.makedirs(output_dir, exist_ok=True)

        # Decode base64 image
        logger.debug("Decoding image data")
        image_data = data.get("imageData")
        image_binary = base64.b64decode(
            image_data.split(",")[1] if "," in image_data else image_data
        )

        # Create image and add metadata
        image = Image.open(io.BytesIO(image_binary))
        metadata = PngInfo()

        # Add all metadata fields
        metadata_dict = data.get("metadata", {})
        metadata_dict["createdAt"] = datetime.now().isoformat()

        logger.debug("Adding metadata to image")
        for key, value in metadata_dict.items():
            if value is not None:  # Only add non-null values
                metadata.add_text(key, str(value))

        # Save image with metadata
        image_path = os.path.join(output_dir, image_name)
        logger.info(f"Saving image with metadata to: {image_path}")
        image.save(image_path, pnginfo=metadata)

        # Save image to database
        image_cursor.execute(
            sqlInsert,
            (
                image_name,
                len(image_binary),
                image.width,
                image.height,
                image_path,
                metadata_dict.get("model"),
                metadata_dict.get("promptName"),
                metadata_dict.get("steps"),
                metadata_dict.get("sampler"),
                metadata_dict.get("cfgScale"),
                metadata_dict.get("lora"),
                metadata_dict.get("seed"),
            ),
        )
        image_db.commit()

        return web.json_response(
            {
                "success": True,
                "message": "Image saved successfully with metadata",
                "path": f"/thesis/output/{image_name}",
            }
        )

    except Exception as e:
        logger.error(f"Error saving image: {str(e)}", exc_info=True)
        return web.json_response({"success": False, "message": str(e)}, status=400)


@server.PromptServer.instance.routes.get("/thesis/api/prompts")
async def get_prompts(request):
    logger.info("Fetching prompts from workflow file")
    try:
        # Get the workflow file path
        workflow_path = os.path.join(WEBROOT, "prompts", "prompt.json")

        # Check if file exists
        if not os.path.exists(workflow_path):
            logger.warning(f"Prompt file not found at: {workflow_path}")
            return web.json_response(
                {"success": False, "message": "Prompt file not found"}, status=404
            )

        # Read and parse the JSON file
        with open(workflow_path, "r", encoding="utf-8") as file:
            prompts = json.load(file)

        logger.info(f"Successfully loaded prompts")
        return web.json_response(prompts)

    except json.JSONDecodeError as e:
        logger.error(f"Error parsing prompts JSON: {str(e)}")
        return web.json_response(
            {"success": False, "message": "Invalid JSON format in prompts file"},
            status=400,
        )
    except Exception as e:
        logger.error(f"Error fetching prompts: {str(e)}")
        return web.json_response({"success": False, "message": str(e)}, status=500)


@server.PromptServer.instance.routes.get("/thesis/api/image")
async def get_image(request):
    try:
        logger.info("Received request to get image")

        # Get query parameters
        search_params = {
            "model": request.query.get("model"),
            "promptName": request.query.get("prompt"),
            "steps": request.query.get("steps"),
            "sampler": request.query.get("sampler"),
            "cfgScale": request.query.get("cfg_scale"),
            "lora": request.query.get("lora"),
            "width": request.query.get("width"),
            "height": request.query.get("height"),
            "seed": request.query.get("seed"),
        }

        # Remove None values
        search_params = {k: v for k, v in search_params.items() if v is not None}

        if not search_params:
            return web.json_response(
                {"success": False, "message": "No search parameters provided"},
                status=400,
            )

        # Build dynamic query
        conditions = " AND ".join([f"{k} = ?" for k in search_params.keys()])
        values = tuple(search_params.values())

        sql_query = f"SELECT * FROM images WHERE {conditions}"

        # Execute query
        image_cursor.execute(sql_query, values)
        image = image_cursor.fetchone()

        if not image:
            logger.warning(f"No image found matching parameters: {search_params}")
            return web.json_response(
                {"success": False, "message": "No matching image found"}, status=404
            )

        logger.info(f"Successfully found matching image")
        return web.json_response(
            {
                "success": True,
                "message": "Image found successfully",
                "data": {
                    "id": image[0],
                    "filename": image[1],
                    "width": image[2],
                    "height": image[3],
                    "path": image[4],
                    "model": image[5],
                    "promptName": image[6],
                    "steps": image[7],
                    "sampler": image[8],
                    "cfgScale": image[9],
                    "lora": image[10],
                    "seed": image[11],
                },
            }
        )

    except Exception as e:
        logger.error(f"Error searching for image: {str(e)}", exc_info=True)
        return web.json_response({"success": False, "message": str(e)}, status=400)


logger.info("Thesis Plugin Loaded Successfully")
