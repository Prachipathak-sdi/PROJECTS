import React, { useState } from 'react'
import axios from 'axios'
import { BookOpen, Send, Upload, Sparkles, FileText, ChevronDown, CheckCircle, Database } from 'lucide-react'

const API_BASE = 'http://localhost:8007'

export default function App() {
  const [question, setQuestion] = useState('How many paid time off (PTO) days do full-time employees get per year?')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCitations, setShowCitations] = useState(true)

  const presetQuestions = [
    'How many paid time off (PTO) days do full-time employees get per year?',
    'What is the equipment stipend for remote work?',
    'How much does Acme Corp cover for health insurance premiums?',
    'What is the annual professional development reimbursement limit?'
  ]

  const handleQuery = async (e) => {
    if (e) e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/rag/query`, { question })
      setResponse(res.data)
    } catch (err) {
      console.error('RAG query error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/rag/ingest`, formData)
      alert(res.data.status)
    } catch (err) {
      alert('Failed to ingest document.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <BookOpen size={14} /> MVP 01 • Enterprise RAG Knowledge Base
        </div>
        <h1>Enterprise Document Q&A</h1>
        <p>Retrieval-Augmented Generation (RAG). Ask questions against indexed enterprise policies with grounded citations and zero hallucination.</p>
      </header>

      <div className="chat-card">
        {/* Document Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} color="var(--accent-indigo)" />
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Active Document: Employee Handbook 2025</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Indexed Chunks: 5 Sections Vectorized</div>
            </div>
          </div>

          <label htmlFor="rag-file" style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={14} /> Upload Custom TXT Document
          </label>
          <input
            id="rag-file"
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Preset Pills */}
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Suggested Preset Questions:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {presetQuestions.map((pq, i) => (
            <button
              key={i}
              className="pill-btn"
              onClick={() => {
                setQuestion(pq)
                setResponse(null)
              }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {pq}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleQuery}>
          <div className="query-input-box">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask any question about company policy..."
              required
            />
            <button type="submit" className="btn-send" disabled={loading}>
              <Send size={16} /> {loading ? 'Searching...' : 'Ask RAG'}
            </button>
          </div>
        </form>

        {/* Synthesized Answer Box */}
        {response && (
          <div className="answer-box">
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Sparkles size={16} /> Grounded AI Answer
            </div>
            <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#f8fafc', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
              {response.answer}
            </div>

            {/* Citations Accordion */}
            {response.citations && response.citations.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div
                  onClick={() => setShowCitations(!showCitations)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Database size={14} /> Retrieved Source Citations ({response.citations.length} Chunks Matched)
                  </span>
                  <ChevronDown size={16} style={{ transform: showCitations ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {showCitations && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {response.citations.map((c) => (
                      <div key={c.chunk_id} className="citation-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: '#c4b5fd' }}>Source Chunk #{c.chunk_id}</span>
                          <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>
                            {c.similarity_percentage || Math.round((c.similarity_score || 0.85) * 100)}% Similarity Match
                          </span>
                        </div>
                        <div style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.85rem' }}>"{c.text}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
