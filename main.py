import os
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import replicate
from PIL import Image
import io

load_dotenv()

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Create downloads directory if it doesn't exist
os.makedirs("downloads", exist_ok=True)

app.mount("/downloads", StaticFiles(directory="downloads"), name="downloads")

@app.get("/", response_class=HTMLResponse)
async def upload_form(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload/", response_class=HTMLResponse)
async def upload_image(request: Request, file: UploadFile = File(...)):
    # Debug: Check if API token is loaded
    api_token = os.getenv("REPLICATE_API_TOKEN")
    if not api_token:
        return templates.TemplateResponse("index.html", {
            "request": request,
            "error": "Replicate API token not found. Please check environment variables."
        })
    
    # Set the token explicitly
    replicate.api_token = api_token
    
    image_bytes = await file.read()

    # Convert to base64 for Replicate API
    import base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    data_uri = f"data:image/{file.content_type.split('/')[-1]};base64,{image_b64}"

    try:
        # Send to Replicate for background removal + resize
        output_url = replicate.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            input={"image": data_uri}
        )
    except Exception as e:
        return templates.TemplateResponse("index.html", {
            "request": request,
            "error": f"Replicate API error: {str(e)}"
        })

    # Download processed image
    import requests
    r = requests.get(output_url)
    img = Image.open(io.BytesIO(r.content)).convert("RGBA")

    # Center on square white background 2000x2000
    side = max(img.width, img.height)
    canvas = Image.new("RGBA", (side, side), (255, 255, 255, 255))
    canvas.paste(img, ((side - img.width)//2, (side - img.height)//2), img)
    canvas = canvas.resize((2000, 2000), Image.LANCZOS)

    # Save
    os.makedirs("downloads", exist_ok=True)
    out_path = f"downloads/{file.filename}_enhanced.png"
    canvas.save(out_path)

    return templates.TemplateResponse("index.html", {
        "request": request,
        "download_links": [f"/downloads/{file.filename}_enhanced.png"]
    })
