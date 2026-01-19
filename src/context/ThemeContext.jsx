import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first, default to 'light'
        return localStorage.getItem('theme') || 'light'
    })

    useEffect(() => {
        // Update data-theme attribute on mount and change
        document.documentElement.setAttribute('data-theme', theme)
        // Persist to localStorage
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark'
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}
