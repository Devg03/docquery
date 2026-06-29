import { useState, useEffect } from 'react'

import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [ status, setStatus ] = useState("loading...")

  const [ file, setFile ] = useState(null)
  const [ uploadStatus, setUploadStatus ] = useState("")

  const [ question, setQuestion ] = useState("")
  const [ answer, setAnswer ] = useState("")

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`)
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method:"POST",
        body: formData,
      })
      const data = await response.json()
      setStatus(`Uploaded ${data.filename} - ${data.num_chunks} chunks`)
    } catch (error) {
      setStatus("Upload failed. Is the backend running?")
    }
  }

  async function handleAsk(question) {
    if (!question) {
      setStatus("Please enter a valid question.")
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question })
      })

      const data = await response.json()
      setAnswer(data.answer)

    } catch (error) {
      setStatus("Question was not sent properly.")
    }

  }

  return (
    <div>
      
      <input type="file" onChange={handleFileChange} />
      <button onClick={() => sendToUpload(file)}>Upload</button>
      <p>{status}</p>

      <input type="text" value={question} onChange={e => setQuestion(e.target.value)} />
      <button onClick={() => handleAsk(question)}>Ask</button>
      <p>{answer}</p>

    </div>
  )
}

export default App
