import os 
import server
from aiohttp import web

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

WEBROOT = os.path.join(os.path.dirname(os.path.realpath(__file__)), "web")

@server.PromptServer.instance.routes.get("/thesis")
def deungeon_entrance (request):
    return web.FileResponse(os.path.join(WEBROOT, "index.html" ))

server.PromptServer.instance.routes.static("/thesis/css/", path=os.path.join(WEBROOT, "css"))
server.PromptServer.instance.routes.static("/thesis/js/", path=os.path.join(WEBROOT, "js"))
server.PromptServer.instance.routes.static("/thesis/workflow/", path=os.path.join(WEBROOT, "workflow"))

print("Thesis Test Plugin Loaded")