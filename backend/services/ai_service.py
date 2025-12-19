import os
import json
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-flash-latest')

RECIPE_SCHEMA = {
    "name": "string",
    "description": "string (brief summary)",
    "category": "string (one of: Breakfast, Lunch, Dinner, Snack, Other)",
    "calories_per_serving": "integer",
    "protein_g": "integer",
    "prep_time_minutes": "integer",
    "cook_time_minutes": "integer",
    "servings": "integer",
    "instructions": "string (markdown format supported)"
}

def parse_recipe_from_text(text: str) -> Dict[str, Any]:
    """
    Parses natural language text into a structured recipe JSON using Gemini.
    """
    prompt = f"""
    You are a culinary AI assistant. 
    Extract recipe details from the following text and return ONLY a valid JSON object matching this schema:
    {json.dumps(RECIPE_SCHEMA, indent=2)}
    
    If data is missing, make a reasonable estimate or use 0/empty string.
    
    Input Text:
    {text}
    """
    
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Parse Error: {e}")
        # fallback empty structure or re-raise
        raise e
