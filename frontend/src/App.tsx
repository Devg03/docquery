import { useState, useEffect } from 'react'

import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [ status, setStatus ] = useState("loading...")

  const [ file, setFile ] = useState(null)
  const [ uploadStatus, setUploadStatus ] = useState("")

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

  function handleFileChange(event) {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }    
  }

  async function sendToUpload(file) {

    if (!file) {
      setStatus("Please choose a file first.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const response = await fetch('http://localhost:8000/upload', {
        method:"POST",
        body: formData,
      })
      const data = await response.json()
      setStatus(`Uploaded ${data.filename} - ${data.num_chunks} chunks`)
    } catch (error) {
      setStatus("Upload failed. Is the backend running?")
    }

  }


  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={() => sendToUpload(file)}>Upload</button>
      <p>{status}</p>
    </div>
  )
}

export default App
