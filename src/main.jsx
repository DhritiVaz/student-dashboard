import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          background: '#0a0a0a',
          color: '#fafafa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <h1 style={{ color: '#dc2626', margin: 0 }}>Something went wrong</h1>
          <pre style={{ background: '#1a1a1a', padding: 16, overflow: 'auto', fontSize: 14 }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 16px', cursor: 'pointer', alignSelf: 'flex-start' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;">No #root element found. Check index.html.</div>'
} else {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  } catch (err) {
    root.innerHTML = `<div style="padding:20px;font-family:sans-serif;background:#0a0a0a;color:#fafafa;min-height:100vh;">
      <h1 style="color:#dc2626">Failed to start</h1>
      <pre style="background:#1a1a1a;padding:16px;overflow:auto;">${String(err.message)}</pre>
    </div>`
    console.error(err)
  }
}
