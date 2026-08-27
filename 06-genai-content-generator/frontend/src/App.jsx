import React, { useState } from 'react'
import axios from 'axios'
import { Sparkles, Copy, Check, Wand2, Share2, Mail, Tag, Zap } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [topic, setTopic] = useState('Eco-friendly double-walled smart water bottle with hydration tracking LED ring')
  const [contentType, setContentType] = useState('social_post')
  const [loading, setLoading] = useState(false)
  const [copiedTone, setCopiedTone] = useState(null)
  
  const [results, setResults] = useState({
    Professional: null,
    Casual: null,
    Playful: null
  })

  const tones = [
    { name: 'Professional', key: 'Professional', color: 'professional', icon: '💼' },
    { name: 'Casual', key: 'Casual', color: 'casual', icon: '🌿' },
    { name: 'Playful', key: 'Playful', color: 'playful', icon: '🚀' }
  ]

  const handleGenerate = async (e) => {
    if (e) e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setResults({ Professional: null, Casual: null, Playful: null })

    try {
      // Trigger all 3 tone requests in parallel for side-by-side demo hook
      const promises = tones.map((t) =>
        axios.post(`${API_BASE}/api/genai/generate`, {
          topic,
          content_type: contentType,
          tone: t.key
        }).then(res => ({ tone: t.key, data: res.data }))
      )

      const responseList = await Promise.all(promises)
      const newResults = {}
      responseList.forEach((item) => {
        newResults[item.tone] = item.data
      })
      setResults(newResults)
    } catch (err) {
      console.error('Generation error:', err)
      // Fallback display if backend is offline or loading
      setResults({
        Professional: { result: `Elevate your wellness routine with our revolutionary ${topic}. Engineered with precision tracking and premium eco-friendly materials.`, mock: true },
        Casual: { result: `Struggling to drink enough water? Meet your new daily hydration buddy: ${topic}. Sleek, green, and super helpful!`, mock: true },
        Playful: { result: `Hydration just got a major glow-up! ✨ Meet the ${topic} — keeping your water ice cold and your vibe top tier! 🌊`, mock: true }
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (tone, text) => {
    navigator.clipboard.writeText(text)
    setCopiedTone(tone)
    setTimeout(() => setCopiedTone(null), 2000)
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <Sparkles size={14} /> MVP 06 • GenAI Content Engine
        </div>
        <h1>Brand-Voice Content Generator</h1>
        <p>Enter any product or topic and generate marketing copy across three distinct brand tones simultaneously.</p>
      </header>

      <div className="controls-card">
        <form onSubmit={handleGenerate}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="topic-input">Product / Topic Description</label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Ergonomic wireless mechanical keyboard for coders..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type-select">Content Type</label>
              <select
                id="type-select"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="social_post">Social Media Post</option>
                <option value="product_description">Product Description</option>
                <option value="email">Email Copy</option>
              </select>
            </div>

            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <button
                id="generate-btn"
                type="submit"
                className="btn-primary"
                disabled={loading || !topic.trim()}
              >
                {loading ? <Sparkles className="spin" size={18} /> : <Wand2 size={18} />}
                {loading ? 'Generating...' : 'Generate 3 Tones'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="cards-grid">
        {tones.map((t) => {
          const res = results[t.key]
          return (
            <div key={t.key} className={`tone-card ${t.color}`}>
              <div className="card-header">
                <span className="tone-title">
                  <span>{t.icon}</span> {t.name}
                </span>
                {res?.mock && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Demo Mode
                  </span>
                )}
              </div>

              <div className="card-body">
                {loading ? (
                  <div>
                    <div className="skeleton" style={{ width: '90%' }}></div>
                    <div className="skeleton" style={{ width: '100%' }}></div>
                    <div className="skeleton" style={{ width: '75%' }}></div>
                  </div>
                ) : res ? (
                  res.result
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Click "Generate 3 Tones" above to generate {t.name.toLowerCase()} copy.
                  </span>
                )}
              </div>

              {res && (
                <div className="card-footer">
                  <button
                    id={`copy-btn-${t.key}`}
                    className="copy-btn"
                    onClick={() => copyToClipboard(t.key, res.result)}
                  >
                    {copiedTone === t.key ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                    {copiedTone === t.key ? 'Copied!' : 'Copy Copy'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
