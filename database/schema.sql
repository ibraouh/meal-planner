-- Create recipes table
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  instructions text,
  image_url text,
  category text check (category in ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other')),
  calories_per_serving integer,
  protein_g float,
  carbs_g float,
  fat_g float,
  usage_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create meal_plans table
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  meal_type text check (meal_type in ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  recipe_id uuid references public.recipes not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.recipes enable row level security;
alter table public.meal_plans enable row level security;

-- Policies for recipes
create policy "Users can select their own recipes" on public.recipes
  for select using (auth.uid() = user_id);

create policy "Users can insert their own recipes" on public.recipes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own recipes" on public.recipes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own recipes" on public.recipes
  for delete using (auth.uid() = user_id);

-- Policies for meal_plans
create policy "Users can select their own meal plans" on public.meal_plans
  for select using (auth.uid() = user_id);

create policy "Users can insert their own meal plans" on public.meal_plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own meal plans" on public.meal_plans
  for update using (auth.uid() = user_id);

create policy "Users can delete their own meal plans" on public.meal_plans
  for delete using (auth.uid() = user_id);
