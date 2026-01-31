import { useLocation } from 'react-router-dom'
import { Search, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './TopBar.css'

const pageTitles = {
  '/': 'Dashboard',
  '/courses': 'Courses',
  '/calendar': 'Calendar',
  '/mindspace': 'Notes',
  '/timetable': 'Timetable',
  '/gpa': 'CGPA Calculator',
  '/files': 'Files',
  '/tasks': 'Tasks'
}

const pageSubtitles = {
  '/': 'Welcome back! Here\'s your academic overview',
  '/courses': 'Manage your enrolled courses',
  '/calendar': 'View and organize your schedule',
  '/mindspace': 'Your personal notes and tasks',
  '/timetable': 'Your weekly class schedule',
  '/gpa': 'Track your academic performance',
  '/files': 'All your documents in one place',
  '/tasks': 'Stay on top of your tasks'
}

const TopBar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const title = pageTitles[location.pathname] || 'Dashboard'
  const subtitle = pageSubtitles[location.pathname] || ''

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-section">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={18} />
          <input type="text" placeholder="Search anything..." />
          <kbd className="search-shortcut">⌘K</kbd>
        </div>

        <div className="topbar-actions">
          <button className="topbar-icon-btn notification-btn">
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>
          
          <div className="user-menu">
            <div className="user-avatar">
              {user?.avatar || 'U'}
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>

          <button className="topbar-icon-btn logout-btn" onClick={logout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
