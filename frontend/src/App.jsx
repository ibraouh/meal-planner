import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Auth from './components/Auth'
import RecipeForm from './components/RecipeForm'
import RecipeList from './components/RecipeList'
import Planner from './components/Planner'
import { Calendar, Utensils, LogOut, ChefHat, PlusCircle, Settings, Moon, Sun, Smartphone } from 'lucide-react'

function SettingsView() {
    const { signOut, user } = useAuth()
    const { theme, setTheme } = useTheme()

    return (
        <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Settings</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                    Appearance
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-500/30 dark:text-orange-400' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}
                    >
                        <Sun size={20} />
                        <span className="text-xs font-medium">Light</span>
                    </button>
                    <button 
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-500/30 dark:text-orange-400' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}
                    >
                        <Moon size={20} />
                        <span className="text-xs font-medium">Dark</span>
                    </button>
                    <button 
                        onClick={() => setTheme('auto')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'auto' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-500/30 dark:text-orange-400' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}
                    >
                        <Smartphone size={20} />
                        <span className="text-xs font-medium">Auto</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Account</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                    <div className="text-sm">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">Signed in as</div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">{user.email}</div>
                    </div>
                </div>

                <button 
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 font-bold transition-colors"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>
        </div>
    )
}

function AppContent() {
  const { user } = useAuth()
  const [view, setView] = useState('planner') // 'planner', 'recipes', 'new-recipe', 'settings'

  // Scroll to top when switching views
  useEffect(() => {
     window.scrollTo(0, 0)
  }, [view])

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 md:pb-8 transition-colors duration-200">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm px-4 py-3 mb-6 transition-colors duration-200">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
             <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500 flex items-center gap-2">
              <ChefHat className="text-orange-500" /> Meal Planner
            </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Desktop Nav */}
             <nav className="hidden md:flex bg-orange-50 dark:bg-gray-800 p-1 rounded-lg">
                <button 
                    onClick={() => setView('planner')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'planner' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <Calendar size={16} /> Planner
                </button>
                <button 
                    onClick={() => setView('recipes')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'recipes' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <Utensils size={16} /> Recipes
                </button>
                <button 
                    onClick={() => setView('new-recipe')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'new-recipe' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <PlusCircle size={16} /> New
                </button>
             </nav>

             <button 
                onClick={() => setView('settings')}
                className={`hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${view === 'settings' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
             >
                <Settings size={18} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 space-y-8">
        {view === 'planner' && <Planner />}
        
        {view === 'recipes' && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Utensils size={20} className="text-orange-500"/> Recipe Gallery</h2>
              <RecipeList />
            </section>
        )}

        {view === 'new-recipe' && (
            <section className="max-w-2xl mx-auto">
               <RecipeForm onRecipeCreated={() => setView('recipes')} />
            </section>
        )}

        {view === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-3 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-around items-center z-40 md:hidden transition-colors duration-200">
        <button 
          onClick={() => setView('planner')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'planner' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Calendar size={24} />
          <span className="text-[10px] font-bold">Plan</span>
        </button>
        <button 
          onClick={() => setView('new-recipe')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'new-recipe' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <PlusCircle size={24} />
          <span className="text-[10px] font-bold">New</span>
        </button>
        <button 
          onClick={() => setView('recipes')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'recipes' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Utensils size={24} />
          <span className="text-[10px] font-bold">Recipes</span>
        </button>
        
        <button 
          onClick={() => setView('settings')}
          className={`flex flex-col items-center gap-1 w-16 ${view === 'settings' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </nav>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    </AuthProvider>
  )
}

export default App
