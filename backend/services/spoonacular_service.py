import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SPOONACULAR_API_KEY")
BASE_URL = "https://api.spoonacular.com"

def search_food(query: str) -> List[Dict[str, Any]]:
    if not API_KEY:
        print("Spoonacular API key missing")
        return []

    try:
        # 1. Search for ingredients (get simple list with IDs)
        search_url = f"{BASE_URL}/food/ingredients/search"
        params = {
            "apiKey": API_KEY,
            "query": query,
            "number": 5
        }
        res = requests.get(search_url, params=params)
        res.raise_for_status()
        search_data = res.json()
        results = search_data.get('results', [])
        
        if not results:
            return []
            
        # 2. Get detailed info (macros) sequentially
        # Note: Spoonacular doesn't have a free bulk ingredient info endpoint.
        # We must limit calls to avoid rate limits or huge latency. 
        # For a "Search" result, we might only need basic info or do lazy loading.
        # BUT our UI expects calories immediately.
        # Limit to top 3 to be safe on latency/quota.
        
        final_results = []
        for item in results[:3]: # Limit to top 3
            try:
                info_url = f"{BASE_URL}/food/ingredients/{item['id']}/information"
                info_params = {
                    "apiKey": API_KEY,
                    "amount": 100, 
                    "unit": "grams"
                }
                info_res = requests.get(info_url, params=info_params)
                if info_res.status_code != 200:
                    continue
                    
                details = info_res.json()
                
                # Extract macro nutrients
                nutrients = details.get('nutrition', {}).get('nutrients', [])
                def get_amount(name):
                    for n in nutrients:
                        if n['name'] == name:
                            return n['amount']
                    return 0
                
                # Data is for 100g as requested
                kcal_100g = get_amount("Calories")
                pro_100g = get_amount("Protein")
                
                final_results.append({
                    "api_id": str(details['id']),
                    "name": details['name'],
                    "calories_per_g": round(kcal_100g / 100.0, 4),
                    "protein_per_g": round(pro_100g / 100.0, 4),
                    "image_url": f"https://spoonacular.com/cdn/ingredients_100x100/{details['image']}" if details.get('image') else None
                })
            except Exception as e:
                print(f"Error fetching details for {item['name']}: {e}")
                continue
            
        return final_results

    except Exception as e:
        print(f"Spoonacular Error: {e}")
        return []
