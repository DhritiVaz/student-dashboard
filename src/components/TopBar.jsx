import { Search, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './TopBar.css'

const TopBar = () => {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
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
