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
    response = query\
        .select("*, recipe:recipes(*)")\
        .eq("user_id", current_user.id)\
        .gte("date", start_date)\
        .lte("date", end_date)\
        .order("date")\
        .execute()
    
    return response.data

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
    fetch_query = supabase.table("meal_plans")
    fetch_query.headers = {**fetch_query.headers, "authorization": authorization}
    final_response = fetch_query.select("*, recipe:recipes(*)").eq("id", new_meal_plan_id).single().execute()

    return final_response.data

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
