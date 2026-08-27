import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, Calendar, Upload, BarChart2, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const API_BASE = 'http://localhost:8003'

export default function App() {
  const [periods, setPeriods] = useState(6)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchForecast(periods)
  }, [periods])

  const fetchForecast = async (p) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/forecast/sample?periods=${p}`)
      setData(res.data)
    } catch (err) {
      console.error('Forecast error:', err)
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
      const res = await axios.post(`${API_BASE}/api/forecast?periods=${periods}`, formData)
      setData(res.data)
    } catch (err) {
      alert('Failed to process CSV file. Ensure it contains "date" and "sales" columns.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate SVG chart coordinates
  const renderChart = () => {
    if (!data) return null
    const history = data.history || []
    const forecast = data.forecast || []
    const all = [...history.map(h => ({ ds: h.ds, val: h.sales, type: 'hist' })), ...forecast.map(f => ({ ds: f.ds, val: f.yhat, lower: f.yhat_lower, upper: f.yhat_upper, type: 'fc' }))]

    const maxVal = Math.max(...all.map(d => d.upper || d.val)) * 1.15
    const minVal = Math.min(...all.map(d => d.lower || d.val)) * 0.85

    const width = 800
    const height = 300
    const padding = 40

    const getX = (idx) => padding + (idx / (all.length - 1)) * (width - 2 * padding)
    const getY = (val) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding)

    // Historical points path
    const histPoints = all.filter(d => d.type === 'hist').map((d, i) => `${getX(i)},${getY(d.val)}`).join(' L ')
    
    // Forecast points path (starts from last historical point)
    const lastHistIdx = history.length - 1
    const fcPoints = [
      `${getX(lastHistIdx)},${getY(history[lastHistIdx].sales)}`,
      ...forecast.map((f, i) => `${getX(lastHistIdx + 1 + i)},${getY(f.yhat)}`)
    ].join(' L ')

    return (
      <svg width="100%" height="320" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + ratio * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + ratio * (height - 2 * padding)}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />
        ))}

        {/* Historical Line */}
        <path d={`M ${histPoints}`} fill="none" stroke="#8b5cf6" strokeWidth="3" />

        {/* Forecast Line (Dashed Glowing) */}
        <path d={`M ${fcPoints}`} fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="6 4" />

        {/* Points */}
        {all.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.val)}
            r={d.type === 'fc' ? "4" : "3"}
            fill={d.type === 'fc' ? "#06b6d4" : "#8b5cf6"}
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    )
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <TrendingUp size={14} /> MVP 02 • Sales & Demand Forecaster
        </div>
        <h1>Enterprise Sales Forecaster</h1>
        <p>Upload historical sales CSV or use sample data. Adjust the prediction horizon slider to generate forward-looking demand projections.</p>
      </header>

      {/* Control Bar */}
      <div className="controls-card">
        <div className="slider-group">
          <div className="slider-header">
            <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Forecast Horizon: {periods} Months</label>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{periods} Months Ahead</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={periods}
            onChange={(e) => setPeriods(parseInt(e.target.value))}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label htmlFor="csv-upload" className="pill-btn" style={{ cursor: 'pointer', padding: '0.6rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> Upload CSV File
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Historical Months</div>
            <div className="metric-val">{data.summary.historical_months} Mo</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Forecast Horizon</div>
            <div className="metric-val" style={{ color: 'var(--accent-cyan)' }}>+{data.summary.forecast_months} Mo</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Projected Sales Total</div>
            <div className="metric-val" style={{ color: 'var(--accent-emerald)' }}>${data.summary.projected_total.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Forecast Trend</div>
            <div className="metric-val" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: data.summary.trend === 'Positive' ? '#34d399' : '#f87171' }}>
              {data.summary.trend === 'Positive' ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
              {data.summary.trend}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} color="var(--accent-violet)" /> Historical Sales vs Forecast Projection
          </span>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c4b5fd' }}>
              <span style={{ width: 12, height: 3, background: '#8b5cf6', borderRadius: 2 }}></span> Historical
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#67e8f9' }}>
              <span style={{ width: 12, height: 3, background: '#06b6d4', borderRadius: 2 }}></span> Forecast
            </span>
          </div>
        </div>

        {renderChart()}
      </div>

      {/* Data Table */}
      {data?.forecast && (
        <div className="chart-card">
          <span style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Layers size={18} color="var(--accent-cyan)" /> Projected Monthly breakdown
          </span>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Forecast Month</th>
                  <th>Projected Sales (yhat)</th>
                  <th>Lower Bound (yhat_lower)</th>
                  <th>Upper Bound (yhat_upper)</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{row.ds}</td>
                    <td style={{ fontWeight: 800, color: '#fff' }}>${row.yhat.toLocaleString()}</td>
                    <td style={{ color: '#94a3b8' }}>${row.yhat_lower.toLocaleString()}</td>
                    <td style={{ color: '#94a3b8' }}>${row.yhat_upper.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
