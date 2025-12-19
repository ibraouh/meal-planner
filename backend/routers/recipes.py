from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from typing import List, Optional, Dict, Any
from uuid import UUID
from models import Recipe, RecipeCreate
from auth import get_current_user
from db import supabase
from services.cloudinary_service import upload_image
from services.ai_service import parse_recipe_from_text
from pydantic import BaseModel

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("/", response_model=List[Recipe])
def get_recipes(current_user: dict = Depends(get_current_user), category: Optional[str] = None, authorization: str = Header(None)):
    query = supabase.table("recipes")
    # Manually set auth header for this request builder instance
    # Use lowercase "authorization" to overwrite the existing key provided by supabase-py
    query.headers = {**query.headers, "authorization": authorization}
    
    query = query.select("*").eq("user_id", current_user.id)
    
    if category:
        query = query.eq("category", category)
        
    response = query.order("usage_count", desc=True).execute()
    return response.data

@router.post("/", response_model=Recipe)
def create_recipe(recipe: RecipeCreate, current_user: dict = Depends(get_current_user), authorization: str = Header(None)):
    data = recipe.dict()
    data['user_id'] = current_user.id
    
    query = supabase.table("recipes")
    query.headers = {**query.headers, "authorization": authorization}
    
    response = query.insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create recipe")
        
    return response.data[0]

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
