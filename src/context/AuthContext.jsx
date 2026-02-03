import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const getApiUrl = () => import.meta.env.VITE_API_URL || ''

/** When on Vite dev server (port 5173), use relative URL so proxy is used and auth cookie works. */
function getEffectiveApiBase() {
  if (typeof window === 'undefined') return getApiUrl()
  if (window.location.port === '5173') return ''
  return getApiUrl()
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  const fetchWithAuth = useCallback((url, options = {}) => {
    return fetch(`${getEffectiveApiBase()}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }, [])

  // On mount: verify session via JWT cookie (GET /api/auth/me)
  // Loading screen is shown for at least LOADING_MIN_MS so the splash is visible
  const LOADING_MIN_MS = 2500
  useEffect(() => {
    let cancelled = false
    const start = Date.now()
    fetchWithAuth('/api/auth/me')
      .then((res) => {
        if (cancelled) return
        if (res.ok) {
          return res.json().then((data) => {
            setUser(data.user)
            setIsAuthenticated(true)
          })
        }
        setUser(null)
        setIsAuthenticated(false)
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setIsAuthenticated(false)
        }
      })
      .finally(() => {
        if (cancelled) return
        const elapsed = Date.now() - start
        const remaining = Math.max(0, LOADING_MIN_MS - elapsed)
        setTimeout(() => {
          if (!cancelled) setAuthLoading(false)
        }, remaining)
      })
    return () => { cancelled = true }
  }, [fetchWithAuth])

  const login = useCallback(async (email, password) => {
    const res = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Login failed' }
    }
    setUser(data.user)
    setIsAuthenticated(true)
    return { success: true }
  }, [fetchWithAuth])

  const register = useCallback(async (userData) => {
    const res = await fetchWithAuth('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Registration failed' }
    }
    return { success: true, message: data.message || 'Account created successfully! Please sign in.' }
  }, [fetchWithAuth])

  const logout = useCallback(async () => {
    await fetchWithAuth('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setIsAuthenticated(false)
  }, [fetchWithAuth])

  const updateProfile = useCallback(async (updates) => {
    const res = await fetchWithAuth('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Update failed' }
    }
    setUser(data.user)
    return { success: true }
  }, [fetchWithAuth])

  const value = {
    user,
    isAuthenticated,
    authLoading,
    login,
    logout,
    register,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
