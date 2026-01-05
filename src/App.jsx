import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import Courses from './pages/Courses'
import Calendar from './pages/Calendar'
import MindSpace from './pages/MindSpace'
import Timetable from './pages/Timetable'
import GPA from './pages/GPA'
import Files from './pages/Files'

function App() {
  return (
    <DataProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Courses />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/mindspace" element={<MindSpace />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/gpa" element={<GPA />} />
            <Route path="/files" element={<Files />} />
          </Routes>
        </Layout>
      </Router>
    </DataProvider>
  )
}

export default App
