import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Eye, Upload, Sparkles, Layers, Box, RefreshCw } from 'lucide-react'

const API_BASE = 'http://localhost:8006'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSample()
  }, [])

  const fetchSample = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/vision/sample`)
      setData(res.data)
    } catch (err) {
      console.error('Failed to fetch sample vision detection:', err)
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
      const res = await axios.post(`${API_BASE}/api/vision/detect`, formData)
      setData(res.data)
    } catch (err) {
      alert('Object detection failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <Eye size={14} /> MVP 05 • Vision Object Detection
        </div>
        <h1>YOLOv8 Computer Vision</h1>
        <p>Real-time object detection and bounding box localization on images. Powered by Ultralytics YOLOv8 nano neural networks.</p>
      </header>

      {/* Control Bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Box size={24} color="var(--accent-rose)" />
          <div>
            <div style={{ fontWeight: 700, color: '#fff' }}>Image: {data?.filename || 'sample_urban_traffic.jpg'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resolution: {data?.width} x {data?.height} px</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label htmlFor="image-input" style={{ cursor: 'pointer', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fda4af', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> Upload Image File
          </label>
          <input
            id="image-input"
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />

          <button onClick={fetchSample} className="tag-pill" style={{ cursor: 'pointer', padding: '0.65rem 1rem' }}>
            <RefreshCw size={14} /> Sample Street Image
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="split-grid">
        {/* Left Pane: Annotated Canvas */}
        <div className="card">
          <div className="card-title">
            <Eye size={18} color="var(--accent-rose)" /> Annotated Image Canvas (Bounding Boxes Overlay)
          </div>

          <div className="image-canvas-box">
            {loading ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                <RefreshCw className="spin" size={28} style={{ marginBottom: '0.5rem' }} />
                <div>Running YOLOv8 neural network inference...</div>
              </div>
            ) : (
              <img src={data?.annotated_image} alt="Detected objects" />
            )}
          </div>
        </div>

        {/* Right Pane: Class Breakdown */}
        <div className="card">
          <div className="card-title">
            <Sparkles size={18} color="var(--accent-pink)" /> Detection Breakdown
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#fda4af', textTransform: 'uppercase', fontWeight: 700 }}>Total Objects Detected</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{data?.total_detected || 0}</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Detected Object Classes:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data?.class_counts && Object.entries(data.class_counts).map(([cls, cnt]) => (
                <div key={cls} className="tag-pill" style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}>
                  <span style={{ color: '#fda4af', textTransform: 'capitalize' }}>{cls}</span>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>x{cnt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bounding box list */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} /> Localized Coordinates (Bounding Boxes)
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Conf.</th>
                    <th>[x1, y1, x2, y2]</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.detections?.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{d.class_name}</td>
                      <td style={{ color: '#34d399', fontWeight: 700 }}>{Math.round(d.confidence * 100)}%</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                        [{d.bbox.join(', ')}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
