import { useState, useEffect } from 'react'

import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [ status, setStatus ] = useState("loading...")

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await fetch('http://localhost:8000/health')
        const data = await response.json()
        setStatus(data.status)
      } catch(error) {
        console.error('Failed to reach backend: ', error);
        setStatus('error connecting to backend')        
      }
    }
    loadHealth()
  }, [])

  return (
    <div>
      <h1>Backened status: {status}</h1>
    </div>
  )
}

export default App
