from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import recipes, meal_plans

app = FastAPI(title="Meal Planner API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipes.router)
app.include_router(meal_plans.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Meal Planner API"}
