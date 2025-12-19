import { useState } from 'react'
import { api } from '../lib/api'
import RecipeForm from './RecipeForm'
import { X, Pencil, Trash2, Clock, Flame } from 'lucide-react'

export default function RecipeModal({ recipe, onClose, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return
    
    setLoading(true)
    try {
      await api.delete(`/recipes/${recipe.id}`)
      if (onDelete) onDelete(recipe.id)
      onClose()
    } catch (err) {
      console.error("Failed to delete recipe", err)
      alert("Failed to delete recipe")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
      // Refresh local state if needed
      setIsEditing(false)
      if (onUpdate) onUpdate()
  }

  if (isEditing) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center p-4 z-50">
           <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 md:p-6 text-gray-800 dark:text-gray-100">
                <RecipeForm 
                    initialData={recipe} 
                    onCancel={() => setIsEditing(false)}
                    onRecipeCreated={handleUpdate}
                />
           </div>
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {recipe.image_url && (
          <img src={recipe.image_url} alt={recipe.name} className="w-full h-56 object-cover" />
        )}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
             <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{recipe.name}</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-2 mb-6">
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
              {recipe.category}
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium flex items-center gap-1">
              <Flame size={14} /> {recipe.calories_per_serving} kcal
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Description</h4>
              <p className="text-gray-600 dark:text-gray-400">{recipe.description}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 text-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
              <div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{recipe.protein_g}g</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Protein</div>
              </div>
            </div>

            {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div>
                   <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Ingredients</h4>
                   <ul className="space-y-2">
                       {recipe.ingredients.map((ing, i) => (
                           <li key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                               <div className="flex items-center gap-2">
                                   {ing.image_url && <img src={ing.image_url} className="w-6 h-6 rounded-full object-cover" />}
                                   <span className="text-gray-800 dark:text-gray-200 font-medium">{ing.name}</span>
                               </div>
                               <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{ing.amount_g}g</span>
                           </li>
                       ))}
                   </ul>
                </div>
            )}


          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
          <button 
             onClick={() => setIsEditing(true)}
             className="flex-1 py-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center gap-2"
          >
             <Pencil size={18} /> Edit
          </button>
          <button 
             onClick={handleDelete}
             disabled={loading}
             className="flex-1 py-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center gap-2"
          >
             <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}
