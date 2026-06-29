import { useState, useEffect } from 'react'
import React from 'react'
import './App.css'

function App() {
  const [ status, setStatus ] = useState("loading...")

  const [file, setFile] = useState<File | null>(null)

  const [ question, setQuestion ] = useState("")
  const [ answer, setAnswer ] = useState("")

  const [ uploading, setUploading ] = useState(false)
  const [ asking, setAsking ] = useState(false)

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

    setUploading(true)
    setStatus("")

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
    setUploading(false)
  }

  async function handleAsk(question: string) {
    if (!question) {
      setStatus("Please enter a valid question.")
      return
    }

    setAsking(true)
    setAnswer("")

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question })
      })

      const data = await response.json()
      setAnswer(data.answer)
    } catch (error) {
      setAnswer("Question was not sent properly.")
    }
    setAsking(false)
  }

  return (
    /* Layout & Background */
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center py-12 px-4'>
      <div className='max-w-2xl mx-auto'>

        {/* Header */}
        <div className='text-center mb-10'>
          <h1 className='text-8xl font-medium font-bitcount bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent'>
            docquery
          </h1>
          <p className='text-2xl text-black-600 mt-2'>
            Upload a document, ask anything, get answers from its contents.
          </p>
        </div> 
        
        {/* Upload Card */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
          
          <h2 className='text-xl text-indigo-800 mb-4'>
            1. Upload a document
          </h2>

          <div className='flex flex-col sm:flex-row gap-3'>
            <input 
              type="file" 
              onChange={handleFileChange}
              className='flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-bold hover:file:bg-indigo-100 cursor-pointer'
            />
            <button
              onClick={() => sendToUpload(file)}
              disabled={uploading}
              className='px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition'>
                {uploading ? "Uploading..." : "Upload"}
              </button>
          </div>
          {status && <p className='mt-3 text-sm text-gray-600'>{status}</p>}
        </div>

        {/* Ask Card */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-xl text-gray-80 mb-4'>
            2. Ask a question
          </h2>

          <div className='flex flex-col sm:flex-row gap-3'>
            <input 
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder='What is this document about?'
              className='flex-1 px-4 py-2 font-semibold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400'
              />
            <button 
              onClick={() => handleAsk(question)}
              disabled={asking}
              className='px-5 py-2 rounded-lg bg-pink-600 text-whiet font-medium hover:bg-pink-700 transition'>
              {asking ? "Thinking..." : "Ask"}
            </button>
          </div>

          {/* Answer Area */}
          {(answer || asking) && (
            <div className='mt-5 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-pink-50 border border-indigo-100'>
              {asking ? (
                <p className='text-gray-500 italic'>Thinking...</p>
              ) : (
                <p className='text-gray-800 whitespace-pre-wrap'>{answer}</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default App
