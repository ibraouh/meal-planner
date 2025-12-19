import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

# We need a valid user token to test this, typically. 
# Since we can't easily get a token for the actual user without their password,
# we might have to rely on 'test_edamam.py' approach or just use the local DB directly to verify the data.
# BUT the issue is the API serialization in `meal_plans.py`.

# Alternative: modify `meal_plans.py` to print data to console, then trigger a refresh.
# User is running the server.

# Or better: Use `supabase` client directly to check `ingredients` table values for a known ingredient.

from db import supabase

def check_db_ingredients():
    try:
        # Fetch a few ingredients
        res = supabase.table("ingredients").select("*").limit(5).execute()
        print("DB Ingredients Sample:")
        for ing in res.data:
            print(f"Name: {ing['name']}, Cal/g: {ing.get('calories_per_g')}, Pro/g: {ing.get('protein_per_g')}")
            
    except Exception as e:
        print(e)
        
if __name__ == "__main__":
    check_db_ingredients()
