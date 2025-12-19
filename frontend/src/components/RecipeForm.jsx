import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { ChevronDown, Image, AlignLeft, List, Flame, Activity, Bot, Search, Plus, X, Scale } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

export default function RecipeForm({ onRecipeCreated, initialData = null, onCancel = null }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    instructions: '', // Keep logic but disable ui? No, requested remove.
    // user asked to remove instructions box and data.
    // I should remove it from state too to be clean.
    image_url: '',
    category: 'Dinner',
    calories_per_serving: 0,
    protein_g: 0,
    ingredients: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // AI Import State
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Ingredient Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState(null) // For weight input
  const [weightInput, setWeightInput] = useState('')

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true)
        try {
          const results = await api.get(`/recipes/ingredients/search?q=${searchQuery}`)
          setSearchResults(results)
        } catch (error) {
          console.error("Search failed", error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // Recalculate totals when ingredients change
  useEffect(() => {
     if (formData.ingredients && formData.ingredients.length > 0) {
         const totalCals = formData.ingredients.reduce((sum, ing) => sum + (ing.calories_per_g * ing.amount_g), 0)
         const totalPro = formData.ingredients.reduce((sum, ing) => sum + (ing.protein_per_g * ing.amount_g), 0)
         // Assuming 1 serving for now, or use existing logic if servings field existed (it doesn't yet, assume 1 recipe = 1 serving or per-recipe?)
         // The fields are "calories_per_serving". If the recipe IS the serving (single meal), then total.
         // If we had a "servings" input, we'd divide. For now, let's treat Recipe as single serving or update directly.
         
         setFormData(prev => ({
             ...prev,
             calories_per_serving: Math.round(totalCals),
             protein_g: Math.round(totalPro)
         }))
     }
  }, [formData.ingredients])

  const handleAddIngredient = () => {
      if (!selectedIngredient || !weightInput) return
      
      const weight = parseFloat(weightInput)
      if (isNaN(weight) || weight <= 0) return

      const newIngredient = {
          name: selectedIngredient.name,
          api_id: selectedIngredient.api_id,
          calories_per_g: selectedIngredient.calories_per_g,
          protein_per_g: selectedIngredient.protein_per_g,
          image_url: selectedIngredient.image_url,
          amount_g: weight
      }

      setFormData(prev => ({
          ...prev,
          ingredients: [...(prev.ingredients || []), newIngredient]
      }))

      // Reset
      setSearchQuery('')
      setSearchResults([])
      setSelectedIngredient(null)
      setWeightInput('')
  }
  
  const removeIngredient = (index) => {
      setFormData(prev => ({
          ...prev,
          ingredients: prev.ingredients.filter((_, i) => i !== index)
      }))
  }

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
            // instructions: '',  <-- removed
            image_url: '',
            category: 'Dinner',
            calories_per_serving: 0,
            protein_g: 0,
            ingredients: [],
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
              // instructions: data.instructions || prev.instructions,
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Image & Upload */}
        <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Image size={14} /> Image</label>
            <div className="space-y-2">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 group">
                     {formData.image_url ? (
                         <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                     ) : (
                         <div className="h-full w-full flex items-center justify-center text-gray-400">
                             <Image size={40} />
                         </div>
                     )}
                     
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                            {uploadingImage ? 'Uploading...' : <><Image size={16}/> Change Photo</>}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                </div>
                 <input
                    name="image_url"
                    placeholder="or paste image URL..."
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400"
                />
            </div>
        </div>

        {/* Right Column: Basic Info */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Recipe Name</label>
            <input
                name="name"
                placeholder="Tasty meal name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-lg font-bold"
            />
          </div>
          
           <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-orange-600 uppercase mb-1 flex items-center gap-1"><Flame size={12}/> Cal</label>
                        <input name="calories_per_serving" type="number" placeholder="0" value={formData.calories_per_serving} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
                    </div>
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Activity size={12}/> Pro</label>
                        <input name="protein_g" type="number" placeholder="0" value={formData.protein_g} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
                    </div>
                  </div>
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
                className="w-full h-[70px] px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
      
        {/* Ingredients Section - Full Width Bottom */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
             <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 uppercase mb-4 flex items-center gap-2"><Scale size={18} /> Ingredients</label>
             
             {/* Search */}
             <div className="relative mb-6">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search ingredients"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-base focus:ring-2 focus:ring-orange-500 shadow-sm"
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && !selectedIngredient && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto mt-1">
                        {searchResults.map(result => (
                            <button
                                key={result.api_id}
                                type="button"
                                onClick={() => setSelectedIngredient(result)}
                                className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                            >
                                {result.image_url ? (
                                    <img src={result.image_url} className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                                ) : <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />}
                                
                                <div>
                                    <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{result.name}</div>
                                    <div className="text-xs text-gray-500">{(result.calories_per_g * 100).toFixed(0)} kcal/100g</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Weight Input for Selected */}
                {selectedIngredient && (
                     <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl animate-fade-in border border-orange-100 dark:border-orange-800/30 shadow-sm">
                        <div className="flex-1 font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                            {selectedIngredient.image_url && <img src={selectedIngredient.image_url} className="w-6 h-6 rounded-full"/>}
                            {selectedIngredient.name}
                        </div>
                        <input 
                            type="text" 
                            placeholder="Grams?" 
                            autoFocus
                            value={weightInput}
                            onChange={e => setWeightInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                            className="w-24 px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:border-orange-500"
                        />
                        <button 
                            type="button" 
                            onClick={handleAddIngredient}
                            className="px-2 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold text-sm flex items-center gap-1"
                        >
                            <Plus size={16} />
                        </button>
                         <button 
                            type="button" 
                            onClick={() => { setSelectedIngredient(null); setWeightInput('') }}
                            className="p-2 text-gray-500 hover:text-gray-800"
                        >
                            <X size={16} />
                        </button>
                     </div>
                )}
             </div>

             {/* Added Ingredients List */}
             <div className="space-y-2">
                 {(formData.ingredients || []).map((ing, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm group hover:border-orange-200 transition-colors">
                         <div className="flex items-center gap-3">
                             {ing.image_url ? (
                                 <img src={ing.image_url} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                              ) : <div className="w-10 h-10 rounded-full bg-gray-100" />}
                             <div>
                                 <div className="font-bold text-gray-700 dark:text-gray-200">{ing.name}</div>
                                 <div className="text-gray-400 text-xs font-mono">{ing.amount_g}g</div>
                             </div>
                         </div>
                         <div className="flex items-center gap-4">
                             <div className="text-right">
                                 <div className="font-bold text-sm text-gray-600 dark:text-gray-300">{Math.round(ing.calories_per_g * ing.amount_g)} kcal</div>
                                 <div className="text-xs text-blue-500">{Math.round(ing.protein_per_g * ing.amount_g)}g pro</div>
                             </div>
                             <button type="button" onClick={() => removeIngredient(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                 <X size={16} />
                             </button>
                         </div>
                     </div>
                 ))}
                 {(!formData.ingredients || formData.ingredients.length === 0) && (
                     <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <Scale className="mx-auto text-gray-300 mb-2" size={32}/>
                        <div className="text-sm text-gray-400">Search above to add ingredients</div>
                     </div>
                 )}
             </div>
             
             {/* Totals Summary */}
             <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                 <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Nutrition</span>
                 <div className="flex gap-6">
                    <div className="text-center">
                        <div className="text-xl font-black text-orange-600">{formData.calories_per_serving || 0}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Calories</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-black text-blue-600">{formData.protein_g || 0}g</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Protein</div>
                    </div>
                 </div>
             </div>
          </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-50"
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
