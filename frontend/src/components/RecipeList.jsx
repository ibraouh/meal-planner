import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import RecipeModal from './RecipeModal'

export default function RecipeList({ keyRefresh }) {
  const [recipes, setRecipes] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  // Local refresh trigger for edits/deletes
  const [localRefresh, setLocalRefresh] = useState(0)

  const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const data = await api.get('/recipes/')
        setRecipes(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecipes()
  }, [keyRefresh, localRefresh])

  const filteredRecipes = filter === 'All' 
    ? recipes 
    : recipes.filter(r => r.category === filter)

  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const handleUpdate = () => {
      setLocalRefresh(prev => prev + 1)
      // We can keep the modal open or close it. 
      // If we keep it open, we might need to refetch the single recipe data or update selectedRecipe from the list.
      // For simplicity, let's just close it or let the user close it.
      // But RecipeModal closes on success from internal Edit form.
      // Ideally we should update the selectedRecipe with new data or re-fetch.
      // For MVP, closing the modal is fine to refresh list.
      setSelectedRecipe(null)
  }

  const handleDelete = (id) => {
      setRecipes(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div className="text-center p-4">Loading recipes...</div>

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === cat 
                ? 'bg-teal-500 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div 
            key={recipe.id} 
            onClick={() => setSelectedRecipe(recipe)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            {recipe.image_url ? (
               <img src={recipe.image_url} alt={recipe.name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                <span>No Image</span>
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-gray-800 line-clamp-1">{recipe.name}</h4>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                  {recipe.category}
                </span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">{recipe.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{recipe.calories_per_serving} cal</span>
                <span>{recipe.protein_g}g P</span>
                {/* <span>{recipe.carbs_g}g C</span> */}
                {/* <span>{recipe.fat_g}g F</span> */}
              </div>
            </div>
          </div>
        ))}
        
        {filteredRecipes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No recipes found in this category.
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
