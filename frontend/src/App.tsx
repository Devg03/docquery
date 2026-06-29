import { useState, useEffect } from 'react'
import React from 'react'
import './App.css'

function App() {
  const [ status, setStatus ] = useState("loading...")

  const [file, setFile] = useState<File | null>(null)

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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }    
  }

  async function sendToUpload(file: File | null) {

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

  async function handleAsk(question: string) {
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
    /* Layout & Background */
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4'>
      <div className='max-w-2xl mx-auto'>

        {/* Header */}
        <div className='text-center mb-10'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent'>
            docquery
          </h1>
          <p className='text-gray-600 mt-2'>
            Upload a document, ask anything, get answers from its contents.
          </p>
        </div> 
        
        {/* Upload Card */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
          
          <h2 className='text-lg front-semibold text-gray-800 mb-4'>
            1. Upload a document
          </h2>

          <div className='flex flex-col sm:flex-row gap-3'>
            <input 
              type="file" 
              onChange={handleFileChange}
              className='flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-medium hover:file:bg-indigo-100 cursor-pointer'
            />
            <button
              onClick={() => sendToUpload(file)}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
                  Upload
              </button>
          </div>
          {status && <p className='mt-3 text-sm text-gray-600'>{status}</p>}
        </div>

          <input type="text" value={question} onChange={e => setQuestion(e.target.value)} />
          <button onClick={() => handleAsk(question)}>Ask</button>
          <p>{answer}</p>
      </div>
    </div>
  )
}

export default App
