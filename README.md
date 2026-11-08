# Meal Planner

A recipe box and weekly meal planner. Paste a recipe as plain text and Gemini turns it into a structured recipe (ingredients, steps, servings). Then plan meals for the week and see what's on today.

- **Frontend:** React (Vite), TanStack Query, Supabase auth
- **Backend:** FastAPI on Supabase (Postgres), Gemini for recipe parsing, Cloudinary for images, Spoonacular for ingredient search

## Run it locally
1. Backend: `cd backend`, `pip install -r requirements.txt`, copy `.env.example` to `.env` and fill in your keys, then `uvicorn main:app --reload`.
2. Frontend: `cd frontend`, `npm install`, copy `.env.local.example` to `.env.local`, then `npm run dev`.
3. The database schema is in `database/schema.sql`.
