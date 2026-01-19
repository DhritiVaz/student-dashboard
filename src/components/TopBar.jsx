
import { useLocation } from 'react-router-dom'
import { Search, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import './TopBar.css'

const pageTitles = {
  '/': 'Dashboard',
  '/courses': 'Courses',
  '/calendar': 'Calendar',
  '/mindspace': 'Notes',
  '/timetable': 'Timetable',
  '/gpa': 'Analytics',
  '/files': 'Files',
  '/tasks': 'Tasks'
}

const TopBar = () => {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const title = pageTitles[location.pathname] || 'Dashboard'

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions">
        <div className="topbar-search">
          <Search size={16} className="text-secondary" color="var(--text-secondary)" />
          <input type="text" placeholder="Search..." />
        </div>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            padding: '8px'
          }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="user-profile">
          {/* Notification bell could go here */}
          <div className="avatar">DS</div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
