import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Compass, Sparkles, ArrowRight, Zap, RefreshCw, ShoppingBag } from 'lucide-react'

const API_BASE = 'http://localhost:8001'

export default function App() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(0)
  const [activeItem, setActiveItem] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCatalog()
  }, [])

  useEffect(() => {
    if (selectedId !== null) {
      fetchRecommendations(selectedId)
    }
  }, [selectedId])

  const fetchCatalog = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/items`)
      setItems(res.data)
      if (res.data.length > 0) {
        setActiveItem(res.data[0])
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err)
    }
  }

  const fetchRecommendations = async (id) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/recommend/${id}?top_n=5`)
      setActiveItem(res.data.source_item)
      setRecommendations(res.data.recommendations)
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (id) => {
    setSelectedId(id)
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <Compass size={14} /> MVP 08 • Recommendation Engine
        </div>
        <h1>Content-Based Recommender</h1>
        <p>Select any item from the catalog to see real-time vector recommendations. Click any recommended item to re-center the engine (chain-clicking).</p>
      </header>

      {/* Featured / Selected Item */}
      {activeItem && (
        <div>
          <div className="section-title">
            <Sparkles size={20} color="var(--accent-cyan)" /> Selected Item (Current Focus)
          </div>
          <div className="featured-box">
            <div className="featured-icon">{activeItem.icon}</div>
            <div className="featured-details">
              <div className="featured-category">{activeItem.category}</div>
              <div className="featured-title">{activeItem.title}</div>
              <div className="featured-desc">{activeItem.description}</div>
              <div className="featured-price">${activeItem.price}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Row */}
      <div style={{ marginBottom: '3rem' }}>
        <div className="section-title">
          <Zap size={20} color="#34d399" /> Recommended Next (TF-IDF Cosine Similarity)
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw className="spin" size={24} style={{ marginBottom: '0.5rem' }} />
            <div>Calculating cosine similarity scores...</div>
          </div>
        ) : (
          <div className="catalog-grid">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="item-card"
                onClick={() => handleSelect(rec.id)}
              >
                <div className="item-header">
                  <div className="item-icon">{rec.icon}</div>
                  <div className="item-info">
                    <div className="item-category">{rec.category}</div>
                    <div className="item-title">{rec.title}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {rec.description}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="similarity-badge">
                    <Sparkles size={12} /> {rec.similarity_percentage}% Match
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    Click to Focus <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Catalog */}
      <div>
        <div className="section-title">
          <ShoppingBag size={20} color="var(--text-muted)" /> Complete Item Catalog ({items.length} Products)
        </div>
        <div className="catalog-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className={`item-card ${activeItem?.id === item.id ? 'active' : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <div className="item-header">
                <div className="item-icon">{item.icon}</div>
                <div className="item-info">
                  <div className="item-category">{item.category}</div>
                  <div className="item-title">{item.title}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '0.5rem' }}>
                ${item.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
