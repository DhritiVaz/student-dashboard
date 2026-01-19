import { Link, useLocation } from 'react-router-dom'
import { FileText } from "lucide-react";

import {
  BookOpen,
  Calendar,
  Brain,
  Clock,
  Calculator,
  Folder,
  PanelLeft // Added icon
} from 'lucide-react'
import { useState } from 'react'
import './Layout.css'
import TopBar from './TopBar'
import { useData } from '../context/DataContext'

const Layout = ({ children }) => {
  const location = useLocation()
  const { courses, files } = useData()

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(true) // Toggleable
  const [coursesOpen, setCoursesOpen] = useState(true)
  const [filesOpen, setFilesOpen] = useState(false)

  const adaptedNavItems = [
    { path: '/', icon: BookOpen, label: 'Dashboard' },
    { path: '/courses', icon: Folder, label: 'Courses' },
    { path: '/timetable', icon: Clock, label: 'Timetable' },
    { path: '/mindspace', icon: Brain, label: 'Notes' },
    { path: '/gpa', icon: Calculator, label: 'CGPA' },
    { path: '/files', icon: Folder, label: 'Files' },
  ]

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          {/* Title hides on collapse via CSS, icon remains or moves */}
          <h2 className="logo-text">StudentMetrics</h2>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {adaptedNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="main">
        <TopBar />
        {children}
      </main>
    </div>
  )
}

export default Layout
