import { useState } from 'react'
import { api } from '../lib/api'
import RecipeModal from './RecipeModal'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Utensils, Clock, Flame, ChefHat, Filter, CalendarPlus, X } from 'lucide-react'
import { format } from 'date-fns'

// Categories for filter
const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

// Sort options
const SORT_OPTIONS = [
    { label: 'Top Rated', value: 'usage_count' },
    { label: 'Newest', value: 'created_at' },
    { label: 'Calories (Low)', value: 'calories_asc' },
    { label: 'Calories (High)', value: 'calories_desc' },
]

export default function RecipeList() {
  const queryClient = useQueryClient()
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  
  // Filtering & Sorting State
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('usage_count')
  const [searchQuery, setSearchQuery] = useState('')

  // Add to Meal State
  const [addingRecipe, setAddingRecipe] = useState(null)
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [targetMealType, setTargetMealType] = useState('Breakfast')

  // 1. Fetch Recipes with Caching
  const { data: recipes = [], isLoading, error } = useQuery({
      queryKey: ['recipes'],
      queryFn: () => api.get('/recipes/'),
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  // 2. Filter & Sort Logic (Client-side)
  const filteredRecipes = recipes
    .filter(r => category === 'All' || r.category === category)
    .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
        if (sortBy === 'usage_count') return (b.usage_count || 0) - (a.usage_count || 0)
        if (sortBy === 'created_at') return new Date(b.created_at) - new Date(a.created_at)
        if (sortBy === 'calories_asc') return (a.calories_per_serving || 0) - (b.calories_per_serving || 0)
        if (sortBy === 'calories_desc') return (b.calories_per_serving || 0) - (a.calories_per_serving || 0)
        return 0
    })

  const handleUpdate = () => {
        queryClient.invalidateQueries(['recipes'])
        setSelectedRecipe(null) // Close modal
  }

  const handleDelete = (id) => {
        queryClient.setQueryData(['recipes'], (old) => old.filter(r => r.id !== id))
        // also invalidate to be safe
        queryClient.invalidateQueries(['recipes'])
  }

  const handleAddToPlan = async () => {
    if (!addingRecipe) return
    try {
        await api.post('/meal-plans/', {
            date: targetDate,
            meal_type: targetMealType,
            recipe_id: addingRecipe.id
        })
        queryClient.invalidateQueries(['mealPlans'])
        setAddingRecipe(null)
        // Reset defaults
        setTargetDate(format(new Date(), 'yyyy-MM-dd'))
        setTargetMealType('Breakfast')
        alert("Meal added successfully!")
    } catch (e) {
        alert("Failed to add meal plan")
    }
  }

  if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="animate-spin mb-4"><Utensils size={32}/></div>
          <p>Loading your cookbook...</p>
      </div>
  )

  if (error) return <div className="text-red-500 text-center py-10">Failed to load recipes.</div>

  return (
    <div className="space-y-6">
      {/* Controls: Search, Filter, Sort */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex-1 relative">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
                placeholder="Search recipes..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
             {CATEGORIES.map(cat => (
                 <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        category === cat 
                        ? 'bg-orange-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                 >
                    {cat}
                 </button>
             ))}
          </div>

          <div className="min-w-[140px]">
              <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-4 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer text-sm text-gray-800 dark:text-gray-100 transition-all"
                  >
                      {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <Filter className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
              </div>
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div 
            key={recipe.id} 
            onClick={() => setSelectedRecipe(recipe)}
            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
          >
            <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <ChefHat size={48} />
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm">
                    {recipe.category}
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation()
                        setAddingRecipe(recipe)
                    }}
                    className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm z-10"
                    title="Add to Meal Plan"
                >
                    <CalendarPlus size={18} />
                </button>
            </div>
            
             <div className="p-3 flex-1 flex flex-col">
                 <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">{recipe.name}</h3>
                 <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-3 flex-1">{recipe.description}</p>
                 
                 <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-1">
                        <Flame size={14} className="text-orange-400" />
                        <span>{recipe.calories_per_serving} kcal</span>
                    </div>
                    {recipe.protein_g > 0 && (
                        <div className="font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                            {recipe.protein_g}g Pro
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}
        
        {filteredRecipes.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                <div className="inline-block p-4 bg-white dark:bg-gray-700 rounded-full shadow-sm mb-3">
                    <Search className="text-gray-300 dark:text-gray-500" size={24} />
                </div>
                <h3 className="text-gray-500 dark:text-gray-400 font-medium">No recipes found</h3>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
            </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
        />
      )}

      {/* Add To Plan Modal */}
      {addingRecipe && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Add to Meal Plan</h3>
                    <button onClick={() => setAddingRecipe(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl mb-6 border border-orange-100 dark:border-orange-900/30">
                     <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {addingRecipe.image_url ? (
                             <img src={addingRecipe.image_url} className="w-full h-full object-cover"/>
                        ) : <Utensils size={18} className="text-orange-500" />}
                     </div>
                     <div>
                         <div className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1">{addingRecipe.name}</div>
                         <div className="text-xs text-orange-600 dark:text-orange-400">{addingRecipe.calories_per_serving} kcal</div>
                     </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Date</label>
                        <input 
                            type="date" 
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Meal Type</label>
                        <select 
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 appearance-none"
                            value={targetMealType}
                            onChange={(e) => setTargetMealType(e.target.value)}
                        >
                            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={() => setAddingRecipe(null)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleAddToPlan}
                        className="flex-1 py-2.5 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                    >
                        Add Meal
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}


