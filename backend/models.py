from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from enum import Enum
from datetime import date

class Category(str, Enum):
    Breakfast = "Breakfast"
    Lunch = "Lunch"
    Dinner = "Dinner"
    Snack = "Snack"
    Other = "Other"

class RecipeBase(BaseModel):
    name: str
    description: Optional[str] = None
    instructions: str
    image_url: Optional[str] = None
    category: Category
    calories_per_serving: Optional[int] = 0
    protein_g: Optional[float] = 0.0
    carbs_g: Optional[float] = 0.0
    fat_g: Optional[float] = 0.0

class RecipeCreate(RecipeBase):
    pass

class Recipe(RecipeBase):
    id: UUID
    user_id: UUID
    usage_count: int

    class Config:
        from_attributes = True

class MealType(str, Enum):
    Breakfast = "Breakfast"
    Lunch = "Lunch"
    Dinner = "Dinner"
    Snack = "Snack"

class MealPlanBase(BaseModel):
    date: date
    meal_type: MealType
    recipe_id: UUID

class MealPlanCreate(MealPlanBase):
    pass

class MealPlan(MealPlanBase):
    id: UUID
    user_id: UUID
    recipe: Optional[Recipe] = None

    class Config:
        from_attributes = True

