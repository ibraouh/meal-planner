import { useState } from 'react'
import { api } from '../lib/api'
import { ChevronDown, Image, AlignLeft, List, Flame, Activity, Bot } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

export default function RecipeForm({ onRecipeCreated, initialData = null, onCancel = null }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    instructions: '',
    image_url: '',
    category: 'Dinner',
    calories_per_serving: 0,
    protein_g: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // AI Import State
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false)

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    const uploadData = new FormData()
    uploadData.append('file', file)

    try {
        const res = await api.post('/recipes/upload', uploadData)
        setFormData(prev => ({ ...prev, image_url: res.url || '' }))
    } catch (err) {
        console.error("Upload failed", err)
        setError("Image upload failed")
    } finally {
        setUploadingImage(false)
    }
  }

  const handleAiImport = async () => {
      if (!aiText.trim()) return
      setAiLoading(true)
      try {
          const res = await api.post('/recipes/parse', { text: aiText })
          const data = res
          
          if (!data) throw new Error("No data returned from AI")

          // Merge parsed data into form
          setFormData(prev => ({
              ...prev,
              name: data.name || prev.name,
              description: data.description || prev.description,
              category: data.category || prev.category,
              calories_per_serving: data.calories_per_serving || 0,
              protein_g: data.protein_g || 0,
              instructions: data.instructions || prev.instructions,
              // Keep existing image if not provided (AI usually doesn't give image URL)
          }))
          setShowAiModal(false)
          setAiText('')
      } catch (err) {
          console.error("AI Parse failed", err)
          setError("Failed to import recipe from AI")
      } finally {
          setAiLoading(false)
      }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{initialData ? 'Edit Recipe' : 'New Recipe'}</h3>
          <div className="flex items-center gap-2">
            {!initialData && (
                <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                >
                    <Bot size={20} />
                </button>
            )}
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
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Image size={14} /> Image</label>
            <div className="space-y-2">
                <input
                    name="image_url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
                />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">OR</span>
                    <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1">
                        {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                </div>
                {formData.image_url && (
                    <div className="mt-2 h-20 w-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                        <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                )}
            </div>
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
    
    {/* AI Import Modal */}
    {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-orange-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    ✨ Import Recipe with AI
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Paste a recipe URL, ingredients list, or simple description below. Our AI will format it for you.
                </p>
                
                <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="e.g. delicious pancakes with 2 eggs, 1 cup flour, milk..."
                    className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 text-sm"
                />
                
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setShowAiModal(false)}
                        className="px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAiImport}
                        disabled={aiLoading || !aiText.trim()}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:shadow-lg disabled:opacity-50"
                    >
                        {aiLoading ? 'Magic happening...' : 'Generate Recipe'}
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  )
}
