import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './PageTransition.css'

const PageTransition = ({ children }) => {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('enter')

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('exit')
    }
  }, [children, displayChildren])

  useEffect(() => {
    if (transitionStage === 'exit') {
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setTransitionStage('enter')
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [transitionStage, children])

  // Reset on location change
  useEffect(() => {
    setTransitionStage('enter')
  }, [location.pathname])

  return (
    <div className={`page-transition ${transitionStage}`}>
      {displayChildren}
    </div>
  )
}

export default PageTransition
