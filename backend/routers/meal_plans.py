from fastapi import APIRouter, Depends, HTTPException, Query, Header
from typing import List, Optional
from datetime import date
from uuid import UUID
from models import MealPlan, MealPlanCreate
from auth import get_current_user
from db import supabase

router = APIRouter(prefix="/meal-plans", tags=["meal-plans"])

@router.get("/", response_model=List[MealPlan])
def get_meal_plans(
    start_date: date, 
    end_date: date,
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(None)
):
    query = supabase.table("meal_plans")
    query.headers = {**query.headers, "authorization": authorization}

    # Fetch meal plans for the user within the date range
    # Need to fetch deeply nested ingredients for the recipe
    response = query\
        .select("*, recipe:recipes(*, recipe_ingredients(amount_g, ingredients(*)))")\
        .eq("user_id", current_user.id)\
        .gte("date", start_date)\
        .lte("date", end_date)\
        .order("date")\
        .execute()
    
    data = response.data
    
    # Post-process to flatten ingredients structure for Pydantic model
    for plan in data:
        if plan.get('recipe'):
            r = plan['recipe']
            flattened_ingredients = []
            if r.get('recipe_ingredients'):
                for ri in r['recipe_ingredients']:
                    i = ri.get('ingredients')
                    if i:
                        flattened_ingredients.append({
                            "id": i['id'],
                            "api_id": i.get('api_id'),
                            "name": i['name'],
                            "amount_g": ri['amount_g'],
                            "calories_per_g": i['calories_per_g'],
                            "protein_per_g": i['protein_per_g'],
                            "image_url": i.get('image_url')
                        })
            r['ingredients'] = flattened_ingredients

    return data

@router.post("/", response_model=MealPlan)
def create_meal_plan(meal_plan: MealPlanCreate, current_user: dict = Depends(get_current_user), authorization: str = Header(None)):
    data = meal_plan.dict()
    data['date'] = data['date'].isoformat()
    data['user_id'] = current_user.id
    data['recipe_id'] = str(data['recipe_id']) # Ensure string for UUID
    
    query = supabase.table("meal_plans")
    query.headers = {**query.headers, "authorization": authorization}
    
    # Insert meal plan (without select chaining, as it is not supported)
    response = query.insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create meal plan")

    new_meal_plan_id = response.data[0]['id']

    # Increment usage count for the recipe
    try:
        rpc_query = supabase.rpc("increment_recipe_usage", {"row_id": str(data['recipe_id'])})
        rpc_query.headers = {**rpc_query.headers, "authorization": authorization}
        rpc_query.execute()
    except:
        pass

    # Fetch the full meal plan with recipe relation
    # Fetch the full meal plan with recipe relation
    fetch_query = supabase.table("meal_plans")
    fetch_query.headers = {**fetch_query.headers, "authorization": authorization}
    final_response = fetch_query.select("*, recipe:recipes(*, recipe_ingredients(amount_g, ingredients(*)))").eq("id", new_meal_plan_id).single().execute()

    plan = final_response.data
    # Post-process single item
    if plan and plan.get('recipe'):
        r = plan['recipe']
        flattened_ingredients = []
        if r.get('recipe_ingredients'):
             for ri in r['recipe_ingredients']:
                i = ri.get('ingredients')
                if i:
                    flattened_ingredients.append({
                        "id": i['id'],
                        "api_id": i.get('api_id'),
                        "name": i['name'],
                        "amount_g": ri['amount_g'],
                        "calories_per_g": i['calories_per_g'],
                        "protein_per_g": i['protein_per_g'],
                        "image_url": i.get('image_url')
                    })
        r['ingredients'] = flattened_ingredients

    return plan

@router.delete("/{meal_plan_id}")
def delete_meal_plan(meal_plan_id: UUID, current_user: dict = Depends(get_current_user), authorization: str = Header(None)):
    query = supabase.table("meal_plans")
    query.headers = {**query.headers, "authorization": authorization}
    
    response = query.select("*").eq("id", str(meal_plan_id)).eq("user_id", current_user.id).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="Meal plan not found")
         
    del_query = supabase.table("meal_plans")
    del_query.headers = {**del_query.headers, "authorization": authorization}
    del_query.delete().eq("id", str(meal_plan_id)).execute()
    return {"message": "Meal plan deleted"}
