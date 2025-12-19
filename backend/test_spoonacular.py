from services.spoonacular_service import search_food
import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("SPOONACULAR_API_KEY")
BASE_URL = "https://api.spoonacular.com"

def test_single_endpoints():
    print("Testing Search...")
    search_url = f"{BASE_URL}/food/ingredients/search"
    params = {"apiKey": API_KEY, "query": "chicken", "number": 1}
    res = requests.get(search_url, params=params)
    print(f"Search Status: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        if data['results']:
            id = data['results'][0]['id']
            print(f"Found ID: {id}")
            
            # Test Single Info
            print(f"Testing Info for {id}...")
            info_url = f"{BASE_URL}/food/ingredients/{id}/information"
            info_params = {"apiKey": API_KEY, "amount": 100, "unit": "g"}
            res_info = requests.get(info_url, params=info_params)
            print(f"Info Status: {res_info.status_code}")
            if res_info.status_code == 200:
                print("Single Info Success")
                # print(res_info.json())
            else:
                 print(res_info.text)

def test_bulk_endpoint():
    print("Testing Bulk...")
    # Trying the endpoint I used
    url = f"{BASE_URL}/food/ingredients/informationBulk"
    params = {"apiKey": API_KEY, "ids": "7961,4542", "amount": 100}
    res = requests.get(url, params=params)
    print(f"Bulk Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Error: {res.text}")

if __name__ == "__main__":
    if not API_KEY:
        print("Set SPOONACULAR_API_KEY first")
    else:
        test_single_endpoints()
        test_bulk_endpoint()
