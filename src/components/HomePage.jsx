import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Clock,
  Brain,
  Calculator,
  Folder,
  LogIn,
  UserPlus,
  ArrowRight,
} from 'lucide-react'
import './HomePage.css'

function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

export default function HomePage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [demoLoading, setDemoLoading] = useState(false)
  const [heroRef, heroVisible] = useReveal(0.2)
  const [whatRef, whatVisible] = useReveal()
  const [previewRef, previewVisible] = useReveal()
  const [ctaRef, ctaVisible] = useReveal()

  const handleTryDemo = async () => {
    setDemoLoading(true)
    try {
      await login('demo@university.edu', 'demo123')
      navigate('/', { replace: true })
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-inner">
          <Link to="/" className="home-logo">
            <span className="home-logo-text">Student Dashboard</span>
          </Link>
          <nav className="home-nav">
            <div className="home-nav-actions">
              <button type="button" className="home-btn home-btn-ghost" onClick={handleTryDemo} disabled={demoLoading}>
                {demoLoading ? '…' : 'Try demo'}
              </button>
              <button type="button" className="home-btn home-btn-ghost" onClick={() => navigate('/login')}>
                <LogIn size={18} /> Login
              </button>
              <button type="button" className="home-btn home-btn-ghost" onClick={() => navigate('/signup')}>
                <UserPlus size={18} /> Sign up
              </button>
              <button type="button" className="home-btn home-btn-primary" onClick={() => navigate('/login')}>
                Go to Dashboard <ArrowRight size={18} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className={`home-hero ${heroVisible ? 'reveal-visible' : ''}`} ref={heroRef}>
          <div className="home-hero-inner">
            <h1 className="home-hero-title">
              One place for your <span className="accent">courses</span>, <span className="accent">calendar</span>, and <span className="accent">grades</span>.
            </h1>
            <p className="home-hero-subtitle">
              Student Dashboard keeps semesters, timetables, notes, CGPA, and files in sync. Try the demo or sign in to your account.
            </p>
            <div className="home-hero-cta">
              <button type="button" className="home-btn home-btn-primary home-btn-lg" onClick={handleTryDemo} disabled={demoLoading}>
                {demoLoading ? 'Loading…' : 'Try demo'}
              </button>
              <button type="button" className="home-btn home-btn-outline home-btn-lg" onClick={() => navigate('/login')}>
                Go to Dashboard <ArrowRight size={20} />
              </button>
              <button type="button" className="home-btn home-btn-ghost home-btn-lg" onClick={() => navigate('/signup')}>
                Create account
              </button>
              <Link to="/login" className="home-link">
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className={`home-section home-what ${whatVisible ? 'reveal-visible' : ''}`} ref={whatRef}>
          <div className="home-section-inner">
            <h2 className="home-section-title">What you get</h2>
            <p className="home-section-lead">
              Manage your academic life in one app: semesters, courses, calendar, timetable, notes, CGPA, and files.
            </p>
            <ul className="home-features-grid">
              {[
                { icon: LayoutDashboard, label: 'Dashboard', desc: 'Overview, upcoming events, today’s classes, and quick stats.' },
                { icon: BookOpen, label: 'Courses', desc: 'Track courses per semester with progress and details.' },
                { icon: Calendar, label: 'Calendar', desc: 'Assignments, exams, and events with filters.' },
                { icon: Clock, label: 'Timetable', desc: 'Weekly schedule by semester.' },
                { icon: Brain, label: 'Notes', desc: 'MindSpace notes and tasks per semester.' },
                { icon: Calculator, label: 'CGPA', desc: 'Grades and GPA per semester.' },
                { icon: Folder, label: 'Files', desc: 'Course files and personal uploads.' },
              ].map(({ icon: Icon, label, desc }) => (
                <li key={label} className="home-feature-card">
                  <div className="home-feature-icon"><Icon size={22} /></div>
                  <h3>{label}</h3>
                  <p>{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="preview" className={`home-section home-preview ${previewVisible ? 'reveal-visible' : ''}`} ref={previewRef}>
          <div className="home-section-inner">
            <h2 className="home-section-title">See it in action</h2>
            <p className="home-section-lead">
              Live preview from the demo account: real data, real layout.
            </p>
            <div className="home-preview-screenshot">
              <img src="/Preview.png" alt="Dashboard preview: sidebar, summary cards, today's schedule, upcoming events, course progress, and recent tasks" />
            </div>
          </div>
        </section>

        <section className={`home-section home-cta ${ctaVisible ? 'reveal-visible' : ''}`} ref={ctaRef}>
          <div className="home-section-inner home-cta-inner">
            <h2 className="home-cta-title">Ready to get started?</h2>
            <p className="home-cta-text">Log in to your dashboard or create a new account.</p>
            <div className="home-cta-buttons">
              <button type="button" className="home-btn home-btn-primary home-btn-lg" onClick={handleTryDemo} disabled={demoLoading}>
                {demoLoading ? 'Loading…' : 'Try demo'}
              </button>
              <button type="button" className="home-btn home-btn-outline home-btn-lg" onClick={() => navigate('/login')}>
                Log in
              </button>
              <button type="button" className="home-btn home-btn-outline home-btn-lg" onClick={() => navigate('/signup')}>
                Create account
              </button>
              <button type="button" className="home-btn home-btn-ghost home-btn-lg" onClick={() => navigate('/login')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <span className="home-logo-text">Student Dashboard</span>
          <div className="home-footer-links">
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign up</Link>
            <button type="button" onClick={() => navigate('/login')}>Dashboard</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
