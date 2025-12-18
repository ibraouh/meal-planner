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
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 p-4">
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 p-4">
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
    <div className="min-h-screen bg-orange-50 dark:bg-gray-900 pb-8 transition-colors duration-200">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-orange-50/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-orange-100 dark:border-gray-800 shadow-sm px-4 py-3 mb-6 transition-colors duration-200">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
             <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500 flex items-center gap-2">
              <ChefHat className="text-orange-500" /> Planner
            </h1>
          </div>

          <div className="flex items-center gap-1 md:gap-4">
             {/* Unified Nav */}
             <nav className="flex items-center gap-1 bg-white/50 dark:bg-gray-800 p-1 rounded-lg">
                <button 
                    onClick={() => setView('planner')}
                    className={`p-2 md:px-4 md:py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'planner' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    title="Planner"
                >
                    <Calendar size={18} /> <span className="hidden md:inline">Planner</span>
                </button>
                <button 
                    onClick={() => setView('recipes')}
                    className={`p-2 md:px-4 md:py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'recipes' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    title="Recipes"
                >
                    <Utensils size={18} /> <span className="hidden md:inline">Recipes</span>
                </button>
                <button 
                    onClick={() => setView('new-recipe')}
                    className={`p-2 md:px-4 md:py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'new-recipe' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    title="New Recipe"
                >
                    <PlusCircle size={18} /> <span className="hidden md:inline">New</span>
                </button>
                <button 
                    onClick={() => setView('settings')}
                    className={`p-2 md:px-4 md:py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${view === 'settings' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    title="Settings"
                >
                   <Settings size={18} /> <span className="hidden md:inline">Settings</span>
                </button>
             </nav>
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
