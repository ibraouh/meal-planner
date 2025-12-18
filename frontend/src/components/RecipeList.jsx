import { useState } from 'react'
import { api } from '../lib/api'
import RecipeModal from './RecipeModal'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Utensils, Clock, Flame, ChefHat, Filter } from 'lucide-react'

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
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex-1 relative">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
                placeholder="Search recipes..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
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
                        ? 'bg-teal-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    className="w-full pl-4 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer text-sm"
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
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
          >
            <div className="relative h-48 overflow-hidden bg-gray-100">
                {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ChefHat size={48} />
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                    {recipe.category}
                </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1 group-hover:text-teal-600 transition-colors">{recipe.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{recipe.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Flame size={14} className="text-orange-400" />
                        <span>{recipe.calories_per_serving} kcal</span>
                    </div>
                    {recipe.protein_g > 0 && (
                        <div className="font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                            {recipe.protein_g}g Pro
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}
        
        {filteredRecipes.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-3">
                    <Search className="text-gray-300" size={24} />
                </div>
                <h3 className="text-gray-500 font-medium">No recipes found</h3>
                <p className="text-gray-400 text-sm">Try adjusting your filters or search terms.</p>
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
    </div>
  )
}


