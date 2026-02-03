import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { SemesterProvider } from './context/SemesterContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import HomePage from './components/HomePage'
import LoginScreen from './components/LoginScreen'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Calendar from './pages/Calendar'
import MindSpace from './pages/MindSpace'
import Timetable from './pages/Timetable'
import GPA from './pages/GPA'
import Files from './pages/Files'

function AppRoutes() {
  const { isAuthenticated, authLoading } = useAuth()

  if (authLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return (
      <SemesterProvider>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </SemesterProvider>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<LoginScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
