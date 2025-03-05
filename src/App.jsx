import { useState } from 'react'
import OpenAI from 'openai'

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [threadId, setThreadId] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setError(null)
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      })

      let currentThreadId = threadId
      
      // Create a thread if we don't have one
      if (!currentThreadId) {
        const thread = await openai.beta.threads.create()
        currentThreadId = thread.id
        setThreadId(thread.id)
      }

      // Add the user's message to the thread
      await openai.beta.threads.messages.create(currentThreadId, {
        role: "user",
        content: input
      })

      // Run the assistant
      const run = await openai.beta.threads.runs.create(currentThreadId, {
        assistant_id: import.meta.env.VITE_ASSISTANT_ID
      })

      // Poll for completion
      let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
      }

      if (runStatus.status === 'completed') {
        // Get the assistant's response
        const messages = await openai.beta.threads.messages.list(currentThreadId)
        const lastMessage = messages.data[0]
        
        const assistantMessage = {
          role: 'assistant',
          content: lastMessage.content[0].text.value
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(`Run failed with status: ${runStatus.status}`)
      }
    } catch (error) {
      console.error('Detailed Error:', error)
      let errorMessage = 'There was an error processing your request.'
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key in the .env file.'
      } else if (error.response?.status === 429) {
        errorMessage = 'You have exceeded your API quota. Please check your OpenAI account billing.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      setError(errorMessage)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE5E5' }}>
      <div style={{ width: '100%', maxWidth: '42rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '1.5rem', border: '2px solid #FFB6C1' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#FF69B4' }}>
              Millenial Sounding Board
            </h1>
            <p style={{ color: '#FF1493', fontSize: '1.125rem', fontWeight: '500' }}>Daniel Bedingfield. When you need him.</p>
          </div>
          
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1rem', marginBottom: '1.5rem', minHeight: '400px', maxHeight: '600px', overflowY: 'auto', border: '2px solid #FFB6C1' }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#FF69B4' }}>
                <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>Share your thoughts, you've gotta get thru this</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    borderRadius: '1rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    width: '100%',
                    maxWidth: '85%',
                    ...(message.role === 'user'
                      ? { backgroundColor: '#FF69B4', color: 'white', marginLeft: 'auto' }
                      : { backgroundColor: '#FFF0F5', color: '#FF1493', marginRight: 'auto', border: '2px solid #FFB6C1' })
                  }}
                >
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.125rem' }}>{message.content}</p>
                </div>
              ))}
              {isLoading && (
                <div style={{ backgroundColor: '#FFF0F5', padding: '1rem', borderRadius: '1rem', marginRight: 'auto', width: '100%', maxWidth: '85%', border: '2px solid #FFB6C1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#FF69B4', borderRadius: '9999px', animation: 'bounce 1s infinite' }}></div>
                    <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#FF1493', borderRadius: '9999px', animation: 'bounce 1s infinite 0.1s' }}></div>
                    <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#FF69B4', borderRadius: '9999px', animation: 'bounce 1s infinite 0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What's on your mind?"
              style={{
                flex: 1,
                padding: '1rem',
                backgroundColor: 'white',
                border: '2px solid #FFB6C1',
                borderRadius: '1rem',
                outline: 'none',
                fontSize: '1.125rem'
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#FF69B4',
                color: 'white',
                borderRadius: '1rem',
                outline: 'none',
                fontSize: '1.125rem',
                fontWeight: '500',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
