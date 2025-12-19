from services.edamam_service import search_food
import sys

if __name__ == "__main__":
    query = "chicken"
    if len(sys.argv) > 1:
        query = sys.argv[1]
    
    print(f"Searching for: {query}")
    results = search_food(query)
    print(f"Found {len(results)} results:")
    for r in results:
        print(r)
