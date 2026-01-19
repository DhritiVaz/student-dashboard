import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Calendar from './pages/Calendar'
import MindSpace from './pages/MindSpace'
import Timetable from './pages/Timetable'
import GPA from './pages/GPA'
import Files from './pages/Files'

function App() {
  return (
    <DataProvider>
      <ThemeProvider>
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
              {/* Fallbacks */}
              <Route path="/tasks" element={<Dashboard />} /> {/* Placeholder */}
              <Route path="/notes" element={<MindSpace />} /> {/* Fallback to MindSpace */}
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </DataProvider>
  )
}


export default App
