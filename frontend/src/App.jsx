import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './components/Auth'
import RecipeForm from './components/RecipeForm'
import RecipeList from './components/RecipeList'
import Planner from './components/Planner'
import { Calendar, Utensils, LogOut, ChefHat } from 'lucide-react'

function AppContent() {
  const { user, signOut } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [view, setView] = useState('planner') // 'planner' or 'recipes'

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3 mb-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
             <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-blue-500 flex items-center gap-2">
              <ChefHat className="text-teal-500" /> Meal Planner
            </h1>
            <p className="hidden md:block text-xs text-gray-500">Welcome, {user.email}</p>
          </div>

          <div className="flex items-center gap-4">
             {/* Desktop Nav */}
             <nav className="hidden md:flex bg-gray-100/50 p-1 rounded-lg">
                <button 
                    onClick={() => setView('planner')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'planner' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Calendar size={16} /> Planner
                </button>
                <button 
                    onClick={() => setView('recipes')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'recipes' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Utensils size={16} /> Recipes
                </button>
             </nav>

             <button 
                onClick={signOut}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
             >
                <LogOut size={18} /> Sign Out
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 space-y-8">
        {view === 'planner' ? (
          <Planner />
        ) : (
          <>
             <section>
              <RecipeForm onRecipeCreated={() => setRefreshKey(prev => prev + 1)} />
            </section>
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Utensils size={20} className="text-teal-500"/> Recipe Gallery</h2>
              <RecipeList keyRefresh={refreshKey} />
            </section>
          </>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-around items-center z-40 md:hidden">
        <button 
          onClick={() => setView('planner')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'planner' ? 'text-teal-600' : 'text-gray-400'}`}
        >
          <Calendar size={24} />
          <span className="text-[10px] font-bold">Plan</span>
        </button>
        <button 
          onClick={() => setView('recipes')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'recipes' ? 'text-teal-600' : 'text-gray-400'}`}
        >
          <Utensils size={24} />
          <span className="text-[10px] font-bold">Recipes</span>
        </button>
        <button 
          onClick={signOut}
          className="flex flex-col items-center gap-1 w-16 text-gray-400 hover:text-red-500"
        >
          <LogOut size={24} />
          <span className="text-[10px] font-bold">Logout</span>
        </button>
      </nav>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
