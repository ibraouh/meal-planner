from pydantic import BaseModel
from typing import Optional, List
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
    image_url: Optional[str] = None
    category: Category
    protein_g: Optional[float] = 0.0
    
class IngredientBase(BaseModel):
    name: str
    api_id: Optional[str] = None
    calories_per_g: Optional[float] = 0.0
    protein_per_g: Optional[float] = 0.0
    image_url: Optional[str] = None

class Ingredient(IngredientBase):
    id: UUID
    class Config:
        from_attributes = True

class RecipeIngredientInput(BaseModel):
    name: str
    api_id: Optional[str] = None
    calories_per_g: float
    protein_per_g: float
    image_url: Optional[str] = None
    amount_g: float

class RecipeCreate(RecipeBase):
    ingredients: Optional[List[RecipeIngredientInput]] = []

class IngredientDisplay(BaseModel):
    id: UUID
    api_id: Optional[str] = None
    name: str
    amount_g: float
    calories_per_g: float
    protein_per_g: float
    image_url: Optional[str] = None

class Recipe(RecipeBase):
    id: UUID
    user_id: UUID
    usage_count: int
    ingredients: Optional[List[IngredientDisplay]] = []

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

