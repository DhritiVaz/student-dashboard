import './LoadingScreen.css'

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-inner">
        <h1 className="loading-title">
          <span className="loading-title-word">Student</span>
          <span className="loading-title-word">Dashboard</span>
        </h1>
        <div className="loading-line-wrap">
          <div className="loading-line" />
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
