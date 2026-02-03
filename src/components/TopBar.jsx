import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './TopBar.css'

const TopBar = () => {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <div className="topbar-right">
        <div className="topbar-actions">
          <div className="user-menu">
            <div className="user-avatar">
              {user?.avatar || 'U'}
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>

          <button className="topbar-icon-btn logout-btn" onClick={logout} title="Logout">
            <LogOut size={24} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
