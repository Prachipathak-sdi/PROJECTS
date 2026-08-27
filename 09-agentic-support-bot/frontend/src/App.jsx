import React, { useState } from 'react'
import axios from 'axios'
import { Bot, User, Send, Cpu, CheckCircle2, ArrowRight, Database, Wrench } from 'lucide-react'

const API_BASE = 'http://localhost:8008'

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your autonomous customer support AI agent. How can I assist you with your orders or account today?' }
  ])
  const [input, setInput] = useState('Where is my order ORD-1002?')
  const [toolLogs, setToolLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const samplePrompts = [
    'Where is my order ORD-1002?',
    'I want to return ORD-1001 and get a full refund.',
    'Check order ORD-1003 delivery status.'
  ]

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim()) return

    const newMsgs = [...messages, { role: 'user', content: input }]
    setMessages(newMsgs)
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_BASE}/api/agent/chat`, { messages: newMsgs })
      setMessages([...newMsgs, { role: 'assistant', content: res.data.answer }])
      if (res.data.tool_calls && res.data.tool_calls.length > 0) {
        setToolLogs((prev) => [...res.data.tool_calls, ...prev])
      }
    } catch (err) {
      console.error('Agent error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <Bot size={14} /> MVP 09 • Autonomous Support Agent
        </div>
        <h1>Agentic Customer Support</h1>
        <p>Powered by OpenAI Function Calling. The agent autonomously queries databases, issues refunds, and escalates tickets without human intervention.</p>
      </header>

      {/* Split Grid: Chat vs Agent Telemetry */}
      <div className="split-grid">
        {/* Left Pane: Chat Window */}
        <div className="card">
          <div className="card-title">
            <Bot size={18} color="var(--accent-purple)" /> Autonomous Support Conversation
          </div>

          <div className="chat-thread">
            {messages.map((m, i) => (
              <div key={i} className={`msg-bubble ${m.role}`}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.2rem', fontWeight: 700 }}>
                  {m.role === 'user' ? 'You' : 'AI Agent'}
                </div>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="msg-bubble assistant" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                Agent thinking and invoking tools...
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(p)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#e2e8f0', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask agent to check order, refund, or escalate..."
              required
            />
            <button type="submit" style={{ background: 'linear-gradient(135deg, #a855f7, #7e22ce)', color: '#fff', fontWeight: 700, padding: '0 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={16} /> Send
            </button>
          </form>
        </div>

        {/* Right Pane: Agent Tool Execution Telemetry */}
        <div className="card">
          <div className="card-title">
            <Cpu size={18} color="var(--accent-emerald)" /> Agent Thought Process & Function Telemetry
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Live execution log of tools invoked autonomously by the agent:
          </div>

          <div style={{ flexGrow: 1, maxHeight: '480px', overflowY: 'auto' }}>
            {toolLogs.length > 0 ? (
              toolLogs.map((tl, i) => (
                <div key={i} className="tool-call-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="tool-badge">
                      <Wrench size={10} style={{ display: 'inline', marginRight: '0.3rem' }} /> Tool Call: {tl.tool_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>Executed</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                    <strong>Arguments:</strong> <code style={{ color: '#e9d5ff' }}>{JSON.stringify(tl.arguments)}</code>
                  </div>

                  <div style={{ marginTop: '0.5rem', background: '#0b0f19', padding: '0.5rem', borderRadius: '0.4rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#a7f3d0', overflowX: 'auto' }}>
                    {JSON.stringify(tl.result, null, 2)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                <Database size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5, display: 'block' }} />
                No tool executions logged yet. Ask a question containing an Order ID (e.g. ORD-1002) to trigger tool calling.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
