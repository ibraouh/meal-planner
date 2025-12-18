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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft /></button>
        <h2 className="text-xl font-bold text-gray-800">Week of {format(weekDates[0], 'MMM d')}</h2>
        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
            const nutrition = getDailyNutrition(dateStr)

            return (
                <div key={dateStr} className={`bg-white rounded-xl shadow-sm border ${isToday ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-100'} overflow-hidden flex flex-col`}>
                    <div className="p-3 bg-gray-50 border-b border-gray-100 text-center">
                        <div className="font-bold text-gray-700">{format(date, 'EEE')}</div>
                        <div className="text-xs text-gray-500">{format(date, 'MMM d')}</div>
                    </div>
                    
                    <div className="flex-1 p-2 space-y-2">
                        {MEAL_TYPES.map(type => {
                            const meal = getMealForSlot(dateStr, type)
                            return (
                                <div key={type} className="min-h-[60px]">
                                    <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">{type}</div>
                                    {meal ? (
                                        <div 
                                            onClick={() => setSelectedRecipeForView(meal.recipe)}
                                            className="group relative bg-teal-50 border border-teal-100 p-2 rounded-lg text-sm cursor-pointer hover:bg-teal-100 transition-colors"
                                        >
                                            <div className="font-medium text-teal-900 line-clamp-2 pr-4">
                                                {meal.recipe?.name || 'Unknown Recipe'}
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteMeal(e, meal.id)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleAddMealClick(dateStr, type)}
                                            className="w-full h-full border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-300 hover:border-teal-200 hover:text-teal-400 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="p-2 text-xs text-center text-gray-500 border-t border-gray-100">
                        <span className="font-bold">{nutrition.cal}</span> cal | <span className="font-bold">{nutrition.pro}g</span> P
                    </div>
                </div>
            )
        })}
      </div>

      {/* Add Meal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Add {selectedSlot?.mealType} for {formatShortDate(new Date(selectedSlot?.dateStr))}</h3>
                <div className="space-y-2">
                    {recipes.map(r => (
                        <button 
                            key={r.id} 
                            onClick={() => handleSelectRecipe(r.id)}
                            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex justify-between items-center group"
                        >
                            <span className="font-medium text-gray-700">{r.name}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-white">{r.calories_per_serving} cal</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="mt-4 w-full py-2 bg-gray-100 rounded-lg font-bold text-gray-600">Cancel</button>
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
