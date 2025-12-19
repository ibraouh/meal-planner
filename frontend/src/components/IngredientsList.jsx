import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Search, Beef, AlertCircle } from 'lucide-react'

export default function IngredientsList() {
    const [searchQuery, setSearchQuery] = useState('')

    const { data: ingredients = [], isLoading, error } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => api.get('/recipes/ingredients'),
    })

    const filteredIngredients = ingredients.filter(ing => 
        ing.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl my-4">
                <AlertCircle className="mx-auto mb-2" />
                Failed to load ingredients.
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">Ingredients</h2>
                <div className="text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide text-sm">
                    Pantry & Database
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter ingredients..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIngredients.map(ing => (
                    <div key={ing.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:border-orange-200 dark:hover:border-orange-900 transition-colors">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {ing.image_url ? (
                                <img src={ing.image_url} alt={ing.name} className="w-full h-full object-cover" />
                            ) : (
                                <Beef className="text-gray-400" size={24} />
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800 dark:text-gray-100 capitalize">{ing.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-16">Calories:</span>
                                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{ing.calories_per_g} kcal/g</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-16">Protein:</span>
                                    <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{ing.protein_per_g} g/g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredIngredients.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        No ingredients found matching "{searchQuery}"
                    </div>
                )}
            </div>
        </div>
    )
}
