import { useState } from 'react'
import { 
  BookOpen, Calendar, Calculator, Clock, FileText, 
  Brain, ArrowRight, CheckCircle, Zap, Shield, Smartphone
} from 'lucide-react'
import './LandingPage.css'

const LandingPage = ({ onGetStarted }) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleGetStarted = () => {
    setIsExiting(true)
    setTimeout(() => {
      onGetStarted()
    }, 500)
  }

  const features = [
    {
      icon: <BookOpen size={22} />,
      title: 'Course Management',
      description: 'Track all your courses, credits, and faculty in one place'
    },
    {
      icon: <Clock size={22} />,
      title: 'Smart Timetable',
      description: 'Day, week, and list views with automatic scheduling'
    },
    {
      icon: <Calculator size={22} />,
      title: 'CGPA Calculator',
      description: 'Indian 10-point grading system with semester tracking'
    },
    {
      icon: <Calendar size={22} />,
      title: 'Event Calendar',
      description: 'Never miss assignments, exams, or deadlines'
    },
    {
      icon: <Brain size={22} />,
      title: 'MindSpace',
      description: 'Task management with priorities and notes'
    },
    {
      icon: <FileText size={22} />,
      title: 'File Organization',
      description: 'Store and organize materials by course'
    }
  ]

  const highlights = [
    { icon: <Zap size={18} />, text: 'Works offline' },
    { icon: <Shield size={18} />, text: 'Data stays local' },
    { icon: <Smartphone size={18} />, text: 'No sign-up required' }
  ]

  return (
    <div className={`landing-page ${isExiting ? 'exiting' : ''}`}>
      {/* Background */}
      <div className="landing-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Content */}
      <div className="landing-content">
        {/* Hero Section */}
        <header className="landing-hero">
          <div className="hero-badge">
            <span>Built for Indian Universities</span>
          </div>
          
          <h1 className="hero-title">
            <span className="title-line">Student</span>
            <span className="title-line accent">Dashboard</span>
          </h1>
          
          <p className="hero-subtitle">
            Your complete academic companion. Manage courses, track grades, 
            organize schedules — all in one unified platform.
          </p>

          <div className="hero-highlights">
            {highlights.map((item, idx) => (
              <div key={idx} className="highlight-item">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <button className="cta-button" onClick={handleGetStarted}>
            <span>Get Started</span>
            <ArrowRight size={20} />
          </button>
        </header>

        {/* Features Grid */}
        <section className="features-section">
          <h2 className="section-title">Everything you need</h2>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="feature-card"
                style={{ '--delay': `${idx * 0.1}s` }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bottom-cta">
          <div className="cta-card">
            <div className="cta-content">
              <h3>Ready to organize your semester?</h3>
              <p>No account needed. Your data stays on your device.</p>
            </div>
            <button className="cta-button secondary" onClick={handleGetStarted}>
              <span>Enter Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>Built with React + Vite</p>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage
