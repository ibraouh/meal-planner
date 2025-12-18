import { useState } from 'react'
import { api } from '../lib/api'
import { ChevronDown, Image, AlignLeft, List, Flame, Activity } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

export default function RecipeForm({ onRecipeCreated, initialData = null, onCancel = null }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(initialData || {
    name: '',
// ... (keep state)
    fat_g: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    // ... (keep logic)
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (initialData) {
        await api.put(`/recipes/${initialData.id}`, formData)
      } else {
        await api.post('/recipes/', formData)
        // Only reset form if creating new
        setFormData({
            name: '',
            description: '',
            instructions: '',
            image_url: '',
            category: 'Dinner',
            calories_per_serving: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
          })
      }
      
      queryClient.invalidateQueries(['recipes'])
      if (onRecipeCreated) onRecipeCreated() // Call if passed, but query invalidation handles the data
    } catch (err) {
      console.error(err)
      setError("Failed to save recipe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{initialData ? 'Edit Recipe' : 'New Recipe'}</h3>
          {onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
              >
                  Cancel
              </button>
          )}
      </div>
      
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Recipe Name</label>
            <input
                name="name"
                placeholder="Tasty meal name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Category</label>
            <div className="relative">
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer text-gray-800 dark:text-gray-100"
                >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Image size={14} /> Image URL</label>
            <input
                name="image_url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><AlignLeft size={14} /> Description</label>
            <textarea
                name="description"
                placeholder="Short, tasty description..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-orange-600 uppercase mb-1 flex items-center gap-1"><Flame size={12}/> Calories</label>
                <input name="calories_per_serving" type="number" placeholder="0" value={formData.calories_per_serving} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
             </div>
             <div>
                <label className="block text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Activity size={12}/> Protein (g)</label>
                <input name="protein_g" type="number" placeholder="0" value={formData.protein_g} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
             </div>
             <div>
                <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Carbs (g)</label>
                <input name="carbs_g" type="number" placeholder="0" value={formData.carbs_g} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
             </div>
             <div>
                <label className="block text-xs font-bold text-yellow-600 uppercase mb-1">Fat (g)</label>
                <input name="fat_g" type="number" placeholder="0" value={formData.fat_g} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><List size={14} /> Instructions</label>
             <textarea
                name="instructions"
                placeholder="Step 1..."
                value={formData.instructions}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
             />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-md disabled:opacity-50"
      >
        {loading ? 'Saving...' : (initialData ? 'Update Recipe' : 'Save Recipe')}
      </button>
    </form>
  )
}
