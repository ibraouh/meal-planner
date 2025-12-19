from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from typing import List, Optional, Dict, Any
from uuid import UUID
from models import Recipe, RecipeCreate
from auth import get_current_user
from db import supabase
from services.cloudinary_service import upload_image
from services.ai_service import parse_recipe_from_text
from services.spoonacular_service import search_food
from pydantic import BaseModel

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("/", response_model=List[Recipe])
def get_recipes(current_user: dict = Depends(get_current_user), category: Optional[str] = None, authorization: str = Header(None)):
    query = supabase.table("recipes")
    # Manually set auth header for this request builder instance
    # Use lowercase "authorization" to overwrite the existing key provided by supabase-py
    query.headers = {**query.headers, "authorization": authorization}
    
    query = query.select("*, recipe_ingredients(amount_g, ingredients(*))").eq("user_id", current_user.id)
    
    if category:
        query = query.eq("category", category)
        
    response = query.order("usage_count", desc=True).execute()
    
    # Transform nested structure to flat ingredients list
    recipes = []
    for r in response.data:
        ingredients_flat = []
        for ri in r.get('recipe_ingredients', []):
            if ri.get('ingredients'):
                ing = ri['ingredients']
                ingredients_flat.append({
                    "id": ing['id'],
                    "api_id": ing['api_id'],
                    "name": ing['name'],
                    "amount_g": ri['amount_g'],
                    "calories_per_g": ing['calories_per_g'],
                    "protein_per_g": ing['protein_per_g'],
                    "image_url": ing['image_url']
                })
        r['ingredients'] = ingredients_flat
        recipes.append(r)
        
    return recipes

@router.get("/ingredients/search")
def search_ingredients(q: str):
    return search_food(q)

@router.post("/", response_model=Recipe)
def create_recipe(recipe: RecipeCreate, current_user: dict = Depends(get_current_user), authorization: str = Header(None)):
    data = recipe.dict()
    ingredients_input = data.pop('ingredients', [])
    data['user_id'] = current_user.id
    
    # 1. Insert Recipe
    query = supabase.table("recipes")
    query.headers = {**query.headers, "authorization": authorization}
    
    response = query.insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create recipe")
        
    new_recipe = response.data[0]
    recipe_id = new_recipe['id']
    
    # 2. Process Ingredients
    if ingredients_input:
        ing_table = supabase.table("ingredients")
        ing_table.headers = {**ing_table.headers, "authorization": authorization} # Using same auth? Or service role? RLS might block if user doesn't have permission to write ingredients.
        # Assuming user can read/write ingredients public table or Authenticated role has access.
        
        ri_table = supabase.table("recipe_ingredients")
        ri_table.headers = {**ri_table.headers, "authorization": authorization}

        for ing in ingredients_input:
            # Check/Insert Ingredient
            ing_id = None
            if ing.get('api_id'):
                # Try to find by API ID first
                existing = ing_table.select("id").eq("api_id", ing['api_id']).execute()
                if existing.data:
                    ing_id = existing.data[0]['id']
            
            if not ing_id:
                # Create new ingredient
                ing_data = {
                    "name": ing['name'],
                    "api_id": ing.get('api_id'),
                    "calories_per_g": ing['calories_per_g'],
                    "protein_per_g": ing['protein_per_g'],
                    "image_url": ing.get('image_url')
                }
                # Check duplicates by name if api_id missing? For now just insert. 
                # If api_id is unique constraint, we handled it above.
                
                try:
                    new_ing = ing_table.insert(ing_data).execute()
                    if new_ing.data:
                        ing_id = new_ing.data[0]['id']
                except Exception as e:
                    print(f"Error inserting ingredient: {e}")
                    # Fallback: maybe it exists by name/api_id and race condition?
                    if ing.get('api_id'):
                         existing = ing_table.select("id").eq("api_id", ing['api_id']).execute()
                         if existing.data:
                            ing_id = existing.data[0]['id']

            if ing_id:
                # Link Recipe Ingredient
                ri_data = {
                    "recipe_id": recipe_id,
                    "ingredient_id": ing_id,
                    "amount_g": ing['amount_g']
                }
                ri_table.insert(ri_data).execute()

    return new_recipe

@router.put("/{recipe_id}", response_model=Recipe)
def update_recipe(recipe_id: UUID, recipe: RecipeCreate, current_user: dict = Depends(get_current_user), authorization: str = Header(None)):
    data = recipe.dict()
    # Don't update user_id, ensure it stays consistent
    # data['user_id'] = current_user.id 
    
    query = supabase.table("recipes")
    query.headers = {**query.headers, "authorization": authorization}
    
    # RLS should handle ownership check, but we can also be explicit
    response = query.update(data).eq("id", str(recipe_id)).eq("user_id", current_user.id).execute()
    
    if not response.data:
         raise HTTPException(status_code=404, detail="Recipe not found or not owned by user")
         
    return response.data[0]

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: UUID, current_user: dict = Depends(get_current_user), authorization: str = Header(None)):
    query = supabase.table("recipes")
    query.headers = {**query.headers, "authorization": authorization}
    
    # Verify ownership
    response = query.select("*").eq("id", str(recipe_id)).eq("user_id", current_user.id).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="Recipe not found")
         
    del_query = supabase.table("recipes")
    del_query.headers = {**del_query.headers, "authorization": authorization}
    del_query.delete().eq("id", str(recipe_id)).execute()
    return {"message": "Recipe deleted"}

class RecipeParseRequest(BaseModel):
    text: str

@router.post("/parse")
def parse_recipe(request: RecipeParseRequest):
    try:
        recipe_data = parse_recipe_from_text(request.text)
        return recipe_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_recipe_image(file: UploadFile = File(...)):
    try:
        content = await file.read()
        url = upload_image(content, file.filename)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
