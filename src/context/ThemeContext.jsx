import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export const ThemeProvider = ({ children }) => {
    useEffect(() => {
        // Always set dark theme
        document.documentElement.setAttribute('data-theme', 'dark')
    }, [])

    const value = {
        theme: 'dark',
        isDark: true
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}
