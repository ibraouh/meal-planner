import sys
import os

# Add the current directory to sys.path to ensure modules are found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import recipes, meal_plans

app = FastAPI(title="Meal Planner API")

import os

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipes.router, prefix="/api")
app.include_router(meal_plans.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Meal Planner API"}

@app.get("/api")
def read_api_root():
    return {"message": "Welcome to Meal Planner API"}
