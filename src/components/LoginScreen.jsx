import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Building2, CheckCircle, AlertCircle } from 'lucide-react'
import './LoginScreen.css'

const LoginScreen = () => {
  const location = useLocation()
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/signup')
  useEffect(() => {
    setIsSignUp(location.pathname === '/signup')
  }, [location.pathname])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')

  const { login, register } = useAuth()

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setStudentId('')
    setDepartment('')
    setMessage({ type: '', text: '' })
  }

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
    clearForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (isSignUp) {
        const result = await register({
          email,
          password,
          name,
          studentId,
          department
        })
        if (result.success) {
          setMessage({ type: 'success', text: result.message })
          setTimeout(() => {
            setIsSignUp(false)
            setPassword('')
            setName('')
            setStudentId('')
            setDepartment('')
            setMessage({ type: '', text: '' })
          }, 2000)
        } else {
          setMessage({ type: 'error', text: result.error })
        }
      } else {
        const result = await login(email, password)
        if (!result.success) {
          setMessage({ type: 'error', text: result.error })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-bg"></div>

      <div className={`login-card ${isSignUp ? 'signup-mode' : ''}`}>
        {/* Title */}
        <div className="login-header">
          <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p>{isSignUp ? 'Register to get started' : 'Sign in to continue'}</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`login-message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Name field - only for sign up */}
          {isSignUp && (
            <div className="form-field">
              <label>Full Name *</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required={isSignUp}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="form-field">
            <label>Email Address *</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-field">
            <label>Password * {isSignUp && <span className="hint">(min. 6 characters)</span>}</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                required
                minLength={isSignUp ? 6 : undefined}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Additional fields for sign up */}
          {isSignUp && (
            <>
              <div className="form-field">
                <label>Student ID <span className="optional">(optional)</span></label>
                <div className="input-wrapper">
                  <GraduationCap size={18} className="input-icon" />
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g., STU2024001"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Department <span className="optional">(optional)</span></label>
                <div className="input-wrapper">
                  <Building2 size={18} className="input-icon" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics & Communication</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Chemical">Chemical Engineering</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Submit button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <div className="btn-loader">
                <div className="spinner"></div>
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </div>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="login-footer">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
          <button 
            type="button" 
            className="toggle-btn" 
            onClick={handleToggleMode}
            disabled={loading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {!isSignUp && (
          <button
            type="button"
            className="demo-btn"
            onClick={async () => {
              setLoading(true)
              setMessage({ type: '', text: '' })
              const result = await login('demo@university.edu', 'demo123')
              if (!result.success) setMessage({ type: 'error', text: result.error })
              setLoading(false)
            }}
            disabled={loading}
          >
            Try Demo Account
          </button>
        )}

        <div className="login-back-home">
          <Link to="/">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
