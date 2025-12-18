import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { format, startOfWeek, addDays, getDay } from 'date-fns'
import RecipeModal from './RecipeModal'
import { ChevronLeft, ChevronRight, X, Plus, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function Planner() {
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null) // { dateStr, mealType }
  
  // Dark mode safe nutrition calc
  const [selectedRecipeForView, setSelectedRecipeForView] = useState(null)

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i))
  const startStr = format(weekDates[0], 'yyyy-MM-dd')
  const endStr = format(weekDates[6], 'yyyy-MM-dd')

  // 1. Fetch Meals (Cached)
  const { data: weekMeals = [] } = useQuery({
      queryKey: ['mealPlans', startStr, endStr],
      queryFn: () => api.get(`/meal-plans/?start_date=${startStr}&end_date=${endStr}`),
      keepPreviousData: true,
  })

  // 2. Fetch Recipes (Shared Cache!)
  const { data: recipes = [] } = useQuery({
      queryKey: ['recipes'],
      queryFn: () => api.get('/recipes/'),
      staleTime: 1000 * 60 * 5,
  })


  const handleAddMealClick = (dateStr, mealType) => {
    setSelectedSlot({ dateStr, mealType })
    setIsAddModalOpen(true)
  }

  const handleSelectRecipe = async (recipeId) => {
    if (!selectedSlot) return
    try {
        await api.post('/meal-plans/', {
            date: selectedSlot.dateStr,
            meal_type: selectedSlot.mealType,
            recipe_id: recipeId
        })
        queryClient.invalidateQueries(['mealPlans'])
        setIsAddModalOpen(false)
        setSelectedSlot(null)
    } catch (e) {
        alert("Failed to add meal")
    }
  }

  const handleDeleteMeal = async (e, id) => {
     e.stopPropagation() // Prevent opening modal
     if(!confirm("Remove this meal?")) return
     try {
         await api.delete(`/meal-plans/${id}`)
         queryClient.invalidateQueries(['mealPlans'])
     } catch (e) { alert("Failed to delete")}
  }

  // Helper to get meal for a slot
  const getMealForSlot = (dateStr, type) => {
      return weekMeals.find(m => m.date === dateStr && m.meal_type === type)
  }

  // Calculate daily nutrition
  const getDailyNutrition = (dateStr) => {
      const dailyMeals = weekMeals.filter(m => m.date === dateStr)
      return dailyMeals.reduce((acc, m) => {
          if (m.recipe) {
              acc.cal += m.recipe.calories_per_serving || 0
              acc.pro += m.recipe.protein_g || 0
              acc.carb += m.recipe.carbs_g || 0
              acc.fat += m.recipe.fat_g || 0
          }
          return acc
      }, { cal: 0, pro: 0, carb: 0, fat: 0 })
  }

  const formatShortDate = (date) => format(date, 'EEE, MMM d')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"><ChevronLeft /></button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Week of {format(weekDates[0], 'MMM d')}</h2>
        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
            const nutrition = getDailyNutrition(dateStr)

            return (
                <div key={dateStr} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${isToday ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-100 dark:border-gray-700'} overflow-hidden flex flex-col transition-colors`}>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-center">
                        <div className="font-bold text-gray-700 dark:text-gray-200">{format(date, 'EEE')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{format(date, 'MMM d')}</div>
                    </div>
                    
                    <div className="flex-1 p-2 space-y-2">
                        {MEAL_TYPES.map(type => {
                            const meal = getMealForSlot(dateStr, type)
                            return (
                                <div key={type} className="min-h-[60px]">
                                    <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">{type}</div>
                                    {meal ? (
                                        <div 
                                            onClick={() => setSelectedRecipeForView(recipes.find(r => r.id === meal.recipe.id))}
                                            className="group relative bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-2 rounded-lg text-sm cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                        >
                                            <div className="font-medium text-orange-900 dark:text-orange-100 line-clamp-2 pr-4">
                                                {meal.recipe?.name || 'Unknown Recipe'}
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteMeal(e, meal.id)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                          onClick={() => handleAddMealClick(dateStr, type)}
                                          className="w-full h-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-400 transition-all cursor-pointer"
                                      >
                                          <Plus size={20} strokeWidth={3} />
                                      </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="p-2 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                        <span className="font-bold">{nutrition.cal}</span> cal | <span className="font-bold">{nutrition.pro}g</span> P
                    </div>
                </div>
            )
        })}
      </div>

       {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
             <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl p-6">
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Add {selectedSlot?.mealType} for {formatShortDate(new Date(selectedSlot?.dateStr))}</h3>
                <div className="space-y-2">
                    {recipes.map(r => (
                        <button 
                            key={r.id} 
                            onClick={() => handleSelectRecipe(r.id)}
                            className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex justify-between items-center group transition-colors"
                        >
                            <span className="font-medium text-gray-700 dark:text-gray-200">{r.name}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full group-hover:bg-white dark:group-hover:bg-gray-600">{r.calories_per_serving} cal</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
             </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipeForView && (
          <RecipeModal 
            recipe={selectedRecipeForView}
            onClose={() => setSelectedRecipeForView(null)}
            onUpdate={() => {
                queryClient.invalidateQueries(['recipes'])
                queryClient.invalidateQueries(['mealPlans'])
            }}
            onDelete={() => {
                queryClient.invalidateQueries(['recipes'])
                queryClient.invalidateQueries(['mealPlans'])
            }}
          />
      )}
    </div>
  )
}
