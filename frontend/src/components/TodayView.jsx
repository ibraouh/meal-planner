import { useState } from 'react'
import { api } from '../lib/api'
import { format, addDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Flame, Database, ChevronRight, Utensils } from 'lucide-react'
import RecipeModal from './RecipeModal'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function TodayView() {
    const today = new Date()
    const dateStr = format(today, 'yyyy-MM-dd')
    const [selectedRecipe, setSelectedRecipe] = useState(null)

    // Fetch *only* today's meals? Or reusing the week query is better for cache?
    // Let's reuse the week query pattern for consistency, but maybe narrow range if needed?
    // Actually, asking for start_date=today&end_date=today is cleanest for "Today View" 
    // but might miss cache hits from Planner. 
    // Let's stick to a specific query for "today" to keep it fast and dedicated.
    
    const { data: meals = [] } = useQuery({
        queryKey: ['mealPlans', dateStr, dateStr],
        queryFn: () => api.get(`/meal-plans/?start_date=${dateStr}&end_date=${dateStr}`),
    })

    // Upcoming: tomorrow and day after
    const tomorrow = addDays(today, 1)
    const dayAfter = addDays(today, 2)
    const upcomingStart = format(tomorrow, 'yyyy-MM-dd')
    const upcomingEnd = format(dayAfter, 'yyyy-MM-dd')

    const { data: upcomingMeals = [] } = useQuery({
        queryKey: ['mealPlans', upcomingStart, upcomingEnd],
        queryFn: () => api.get(`/meal-plans/?start_date=${upcomingStart}&end_date=${upcomingEnd}`),
    })

    // Calculate Totals
    const dailyStats = meals.reduce((acc, m) => {
        if(m.recipe) {
            acc.calories += m.recipe.calories_per_serving || 0
            acc.protein += m.recipe.protein_g || 0
        }
        return acc
    }, { calories: 0, protein: 0 })

    // Group by Meal Type
    const mealsByType = meals.reduce((acc, m) => {
        if (!acc[m.meal_type]) acc[m.meal_type] = []
        acc[m.meal_type].push(m)
        return acc
    }, {})

    // Group Upcoming by Date
    const upcomingByDate = upcomingMeals.reduce((acc, m) => {
        if (!acc[m.date]) acc[m.date] = []
        acc[m.date].push(m)
        return acc
    }, {})


    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Header / Date */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">Today's Plan</h2>
                <div className="text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide text-sm">
                    {format(today, 'EEEE, MMMM do')}
                </div>
            </div>

            {/* Nutrition Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2">
                        <Flame size={48} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-orange-100 text-sm font-medium mb-1">Calories</div>
                        <div className="text-4xl font-black tracking-tight">{dailyStats.calories}</div>
                        <div className="text-orange-100 text-xs mt-2 font-medium bg-white/20 inline-block px-2 py-0.5 rounded-md">
                            kcal
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 text-blue-500 opacity-10 transform translate-x-2 -translate-y-2">
                        <Database size={48} />
                    </div>
                     <div className="relative z-10">
                        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Protein</div>
                        <div className="text-4xl font-black text-gray-800 dark:text-white">{dailyStats.protein}<span className="text-lg font-bold text-gray-400 ml-1">g</span></div>
                    </div>
                </div>
            </div>

            {/* Today's Meals List */}
            <div className="space-y-6">
                {MEAL_ORDER.map(type => {
                    const slotMeals = mealsByType[type] || []
                    if (slotMeals.length === 0) return null

                    return (
                        <div key={type} className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1">{type}</h3>
                            <div className="space-y-3">
                                {slotMeals.map(meal => (
                                    <div 
                                        key={meal.id}
                                        onClick={() => setSelectedRecipe(meal.recipe)}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all cursor-pointer group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                {meal.recipe?.image_url ? (
                                                     <img src={meal.recipe.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                                ) : <Utensils size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                    {meal.recipe?.name}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <span>{meal.recipe?.calories_per_serving} kcal</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span>{meal.recipe?.protein_g}g pro</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
                
                {meals.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-black-200 dark:border-black-700">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">No meals planned for today.</p>
                        <p className="text-sm text-gray-400">Go to Planner to add some!</p>
                    </div>
                )}
            </div>

            {/* Upcoming Section */}
            <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Coming Up</h3>
                <div className="grid grid-cols-2 gap-4">
                    {[upcomingStart, upcomingEnd].map(dStr => {
                        const dayMeals = upcomingByDate[dStr] || []
                        const dateObj = new Date(dStr + 'T00:00:00') // simple parse to avoid timezone shifts if possible, or use date-fns parse
                        // Better to use the dates we formulated earlier: tomorrow, dayAfter
                        const displayDate = dStr === upcomingStart ? tomorrow : dayAfter
                        
                        return (
                            <div key={dStr} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-black-100 dark:border-black-700">
                                <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">
                                    {format(displayDate, 'EEE, MMM d')}
                                </div>
                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {dayMeals.length} Meals Planned
                                </div>
                                <div className="mt-2 text-xs text-gray-500 space-y-1">
                                    {dayMeals.slice(0, 3).map(m => (
                                        <div key={m.id} className="truncate">• {m.recipe?.name}</div>
                                    ))}
                                    {dayMeals.length === 0 && <span className="text-gray-400 italic">Nothing planned</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {selectedRecipe && (
                <RecipeModal 
                    recipe={selectedRecipe} 
                    onClose={() => setSelectedRecipe(null)}
                    // View-only mode effectively, or basic updates? 
                    // Let's pass empty handlers for now or proper ones if we want them editable here.
                    // The prompt "no option to add something" implies mainly view, but making meal itself clickable usually implies detailed view.
                    onUpdate={() => {}} 
                    onDelete={() => {}}
                />
            )}
        </div>
    )
}
