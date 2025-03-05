import { useState } from 'react'
import OpenAI from 'openai'
import './App.css'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

const ASSISTANTS = {
  daniel: {
    id: import.meta.env.VITE_ASSISTANT_ID_DANIEL,
    name: 'Daniel Bedingfield',
    username: 'GottaGetThruThis',
    avatar: '🎤',
    status: 'online'
  },
  craig: {
    id: import.meta.env.VITE_ASSISTANT_ID_CRAIG,
    name: 'Craig David',
    username: 'FillMeIn',
    avatar: '🎵',
    status: 'online'
  }
}

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [threadId, setThreadId] = useState(null)
  const [selectedAssistant, setSelectedAssistant] = useState('daniel')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    try {
      let currentThreadId = threadId
      
      if (!currentThreadId) {
        const thread = await openai.beta.threads.create()
        currentThreadId = thread.id
        setThreadId(currentThreadId)
      }

      // Add user message
      await openai.beta.threads.messages.create(currentThreadId, {
        role: "user",
        content: input
      })

      // Update UI with user message
      setMessages(prev => [...prev, { 
        role: "user", 
        content: input,
        username: 'You'
      }])
      setInput('')

      // Run the assistant
      const run = await openai.beta.threads.runs.create(currentThreadId, {
        assistant_id: ASSISTANTS[selectedAssistant].id
      })

      // Poll for completion
      let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
      }

      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(currentThreadId)
        const lastMessage = messages.data[0]
        if (lastMessage.role === "assistant") {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: lastMessage.content[0].text.value,
            username: ASSISTANTS[selectedAssistant].username
          }])
        }
      } else {
        throw new Error(`Run failed with status: ${runStatus.status}`)
      }
    } catch (error) {
      console.error('Error:', error)
      let errorMessage = 'An error occurred while processing your request.'
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.'
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (error.message.includes('No thread found')) {
        errorMessage = 'Session expired. Please try again.'
        setThreadId(null)
      }
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: errorMessage,
        username: ASSISTANTS[selectedAssistant].username
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssistantChange = (assistantKey) => {
    setSelectedAssistant(assistantKey)
    setThreadId(null) // Reset thread when switching assistants
    setMessages([]) // Clear messages when switching assistants
  }

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="assistant-selector">
          {Object.entries(ASSISTANTS).map(([key, assistant]) => (
            <button
              key={key}
              className={`assistant-button ${selectedAssistant === key ? 'selected' : ''}`}
              onClick={() => handleAssistantChange(key)}
            >
              <span className="assistant-avatar">{assistant.avatar}</span>
              <div className="assistant-info">
                <div className="username">{assistant.username}</div>
                <div className="status">
                  <span className={`status-indicator status-${assistant.status}`}></span>
                  {assistant.status.charAt(0).toUpperCase() + assistant.status.slice(1)}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                {message.role === 'assistant' && (
                  <span className="assistant-avatar">
                    {ASSISTANTS[selectedAssistant].avatar}
                  </span>
                )}
                <div className="message-text">
                  <div className="username">{message.username}</div>
                  <div className="content">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
