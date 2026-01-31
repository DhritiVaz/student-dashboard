import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import LandingPage from './components/LandingPage'
import LoginScreen from './components/LoginScreen'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Calendar from './pages/Calendar'
import MindSpace from './pages/MindSpace'
import Timetable from './pages/Timetable'
import GPA from './pages/GPA'
import Files from './pages/Files'

function AppContent() {
  const { isAuthenticated, authLoading } = useAuth()
  const [appState, setAppState] = useState('loading') // loading, landing, login, app

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppState((prev) => (prev === 'loading' ? 'landing' : prev))
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && appState === 'login') {
      setAppState('app')
    }
  }, [isAuthenticated, appState, authLoading])

  if (appState === 'loading' || authLoading) {
    return <LoadingScreen />
  }

  if (appState === 'landing') {
    return <LandingPage onGetStarted={() => setAppState('login')} />
  }

  if (appState === 'login' || !isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/mindspace" element={<MindSpace />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/gpa" element={<GPA />} />
          <Route path="/files" element={<Files />} />
          <Route path="/tasks" element={<Dashboard />} />
          <Route path="/notes" element={<MindSpace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
