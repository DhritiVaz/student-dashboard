import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Brain,
  Calculator,
  Folder,
  PanelLeft,
  Calendar,
  Layers,
  CalendarRange
} from 'lucide-react'
import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useSemester } from '../context/SemesterContext'
import './Layout.css'
import TopBar from './TopBar'
import PageTransition from './PageTransition'

const Layout = ({ children }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { semesters } = useData()
  const { selectedSemesterId, setSelectedSemesterId, isViewingAll } = useSemester()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'blue' },
    { path: '/courses', icon: BookOpen, label: 'Courses', color: 'purple' },
    { path: '/calendar', icon: Calendar, label: 'Calendar', color: 'orange' },
    { path: '/timetable', icon: Clock, label: 'Timetable', color: 'cyan' },
    { path: '/mindspace', icon: Brain, label: 'Notes', color: 'pink' },
    { path: '/gpa', icon: Calculator, label: 'CGPA', color: 'green' },
    { path: '/files', icon: Folder, label: 'Files', color: 'orange' },
  ]

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo-container">
            <span className="logo-text">Student Dashboard</span>
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-label">Viewing</span>
            <button
              type="button"
              className={`nav-item semester-nav-item ${isViewingAll ? 'active' : ''}`}
              data-color="blue"
              onClick={() => setSelectedSemesterId(null)}
              style={{ animationDelay: '0ms' }}
            >
              <div className="nav-icon-wrapper">
                <Layers size={20} />
              </div>
              <span className="nav-label">All</span>
              {isViewingAll && <div className="nav-indicator" />}
            </button>
            {semesters.map((sem, idx) => {
              const isActive = selectedSemesterId === sem.id
              return (
                <button
                  key={sem.id}
                  type="button"
                  className={`nav-item semester-nav-item ${isActive ? 'active' : ''}`}
                  data-color="purple"
                  onClick={() => setSelectedSemesterId(sem.id)}
                  style={{ animationDelay: `${(idx + 1) * 50}ms` }}
                >
                  <div className="nav-icon-wrapper">
                    <CalendarRange size={20} />
                  </div>
                  <span className="nav-label">{sem.name}</span>
                  {isActive && <div className="nav-indicator" />}
                </button>
              )
            })}
          </div>
          <div className="nav-section">
            <span className="nav-section-label">Menu</span>
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  data-color={item.color}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="nav-icon-wrapper">
                    <Icon size={20} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                  {isActive && <div className="nav-indicator" />}
                </Link>
              )
            })}
          </div>
        </nav>

      </aside>

      <main className="main">
        <TopBar />
        <div className="main-content">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}

export default Layout
