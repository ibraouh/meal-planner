import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // 'light', 'dark', or 'auto'
  const [theme, setTheme] = useState(() => {
     return localStorage.getItem('theme') || 'auto'
  })

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove previous classes
    root.classList.remove('light', 'dark')

    if (theme === 'system' || theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      updateThemeColor(systemTheme)
    } else {
      root.classList.add(theme)
      updateThemeColor(theme)
    }
    
    // Save to local storage
    localStorage.setItem('theme', theme)
  }, [theme])

  const updateThemeColor = (mode) => {
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')
      if (themeColorMeta) {
          themeColorMeta.setAttribute('content', mode === 'dark' ? '#111827' : '#fff7ed')
      }
  }

  // Listen for system changes if in auto mode
  useEffect(() => {
    if (theme !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        const newTheme = mediaQuery.matches ? 'dark' : 'light'
        root.classList.add(newTheme)
        
        const themeColorMeta = document.querySelector('meta[name="theme-color"]')
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', newTheme === 'dark' ? '#111827' : '#fff7ed')
        }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
