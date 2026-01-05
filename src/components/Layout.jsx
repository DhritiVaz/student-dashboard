import { Link, useLocation } from 'react-router-dom'
import { 
  BookOpen, 
  Calendar, 
  Brain, 
  Clock, 
  Calculator, 
  Folder,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = [
    { path: '/courses', icon: BookOpen, label: 'Courses' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/mindspace', icon: Brain, label: 'Mind Space' },
    { path: '/timetable', icon: Clock, label: 'Timetable' },
    { path: '/gpa', icon: Calculator, label: 'GPA Calculator' },
    { path: '/files', icon: Folder, label: 'Files' }
  ]

  return (
    <div className="layout">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Student Dashboard</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path === '/courses' && location.pathname === '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}

export default Layout
