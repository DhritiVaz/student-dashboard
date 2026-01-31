import { createContext, useContext, useState, useEffect } from 'react'

const SemesterContext = createContext()
const STORAGE_KEY = 'student-dashboard-selected-semester'

export const useSemester = () => {
  const context = useContext(SemesterContext)
  if (!context) {
    throw new Error('useSemester must be used within SemesterProvider')
  }
  return context
}

export const SemesterProvider = ({ children }) => {
  const [selectedSemesterId, setSelectedSemesterIdState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === '' ? null : stored
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (selectedSemesterId == null) {
        localStorage.setItem(STORAGE_KEY, '')
      } else {
        localStorage.setItem(STORAGE_KEY, selectedSemesterId)
      }
    } catch (_) {}
  }, [selectedSemesterId])

  const setSelectedSemesterId = (id) => {
    setSelectedSemesterIdState(id === 'all' || id === '' ? null : id)
  }

  const value = {
    selectedSemesterId,
    setSelectedSemesterId,
    isViewingAll: selectedSemesterId == null
  }

  return (
    <SemesterContext.Provider value={value}>
      {children}
    </SemesterContext.Provider>
  )
}
