import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
# It will automatically pick up CLOUDINARY_URL or specific env vars if set, 
# but explicitness is good if we are using individual keys.
cloudinary.config( 
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'), 
  api_key = os.getenv('CLOUDINARY_API_KEY'), 
  api_secret = os.getenv('CLOUDINARY_API_SECRET') 
)

def upload_image(file_content, filename: str) -> str:
    """
    Uploads an image file to Cloudinary and returns the secure URL.
    """
    try:
        # Upload the file
        upload_result = cloudinary.uploader.upload(
            file_content, 
            public_id = filename.split('.')[0], # Optional: use filename as public_id
            folder = "meal_planner_recipes"
        )
        return upload_result["secure_url"]
    except Exception as e:
        print(f"Cloudinary Upload Error: {e}")
        raise e
