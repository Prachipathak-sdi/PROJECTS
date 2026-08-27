import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Mic, Upload, FileText, Download, CheckSquare, Sparkles, Volume2 } from 'lucide-react'

const API_BASE = 'http://localhost:8005'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSample()
  }, [])

  const fetchSample = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/speech/sample`)
      setData(res.data)
    } catch (err) {
      console.error('Failed to fetch sample speech:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/speech/process`, formData)
      setData(res.data)
    } catch (err) {
      alert('Audio processing failed.')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!data) return
    const content = `TRANSCRIPT:\n\n${data.transcript}\n\n=========================================\n\nSUMMARY & ACTION ITEMS:\n\n${data.summary}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.filename || 'meeting'}_summary.txt`
    link.click()
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <Mic size={14} /> MVP 07 • Speech AI Engine
        </div>
        <h1>Meeting Transcriber & Summarizer</h1>
        <p>Upload meeting audio notes or voice memos. OpenAI Whisper converts speech to text, while GPT-4o-mini extracts bullet summaries and action checklists.</p>
      </header>

      {/* Upload & Sample Bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Volume2 size={24} color="var(--accent-teal)" />
          <div>
            <div style={{ fontWeight: 700, color: '#fff' }}>Current File: {data?.filename || 'sample_product_sync.mp3'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status: Processed & Summarized</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label htmlFor="audio-input" style={{ cursor: 'pointer', background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.4)', color: '#5eead4', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> Upload Audio File (.mp3, .wav)
          </label>
          <input
            id="audio-input"
            type="file"
            accept="audio/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />

          {data && (
            <button className="btn-download" onClick={downloadReport}>
              <Download size={16} /> Download .txt Report
            </button>
          )}
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="split-grid">
        {/* Left Pane: Full Transcript */}
        <div className="card">
          <div className="card-title">
            <FileText size={18} color="var(--accent-teal)" /> Full Audio Transcript
          </div>
          <div className="transcript-box">
            {loading ? 'Transcribing audio using Whisper model...' : data?.transcript}
          </div>
        </div>

        {/* Right Pane: Executive Summary */}
        <div className="card">
          <div className="card-title">
            <Sparkles size={18} color="var(--accent-cyan)" /> Executive Summary & Action Items
          </div>
          <div className="summary-box" style={{ whiteSpace: 'pre-wrap' }}>
            {loading ? 'Generating executive summary...' : data?.summary}
          </div>
        </div>
      </div>
    </div>
  )
}
