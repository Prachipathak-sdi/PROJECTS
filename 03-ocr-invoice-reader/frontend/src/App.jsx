import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, Upload, CheckCircle2, History, Database, FileCode, Edit3 } from 'lucide-react'

const API_BASE = 'http://localhost:8004'

export default function App() {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    fetchSample()
    fetchHistory()
  }, [])

  const fetchSample = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/api/ocr/sample`)
      setData(res.data)
    } catch (err) {
      console.error('Failed to fetch sample OCR:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/ocr/history`)
      setHistory(res.data)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPreviewUrl(URL.createObjectURL(file))
    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/ocr/extract`, formData)
      setData(res.data)
      fetchHistory()
    } catch (err) {
      alert('OCR extraction failed. Please try a clear image.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <FileText size={14} /> MVP 03 • OCR Invoice Reader
        </div>
        <h1>Invoice Data Extractor</h1>
        <p>Upload any invoice photo or PDF. Tesseract OCR automatically extracts key fields (Vendor, Date, Invoice #, Total) into structured editable forms logged in SQLite.</p>
      </header>

      {/* Dual Pane Layout */}
      <div className="split-grid">
        {/* Left Pane: Original Invoice Preview */}
        <div className="card">
          <div className="card-title">
            <Upload size={18} color="var(--accent-amber)" /> Original Invoice Document
          </div>

          <label htmlFor="file-input" className="dropzone">
            <FileText size={36} color="var(--accent-amber)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
              Click to Upload Invoice Image / PDF
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Supports PNG, JPG, JPEG or PDF formats
            </div>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*,.pdf"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />

          <div style={{ marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Document Canvas Preview ({data?.filename || 'sample_invoice.png'})
            </span>
            <div style={{ background: '#fff', color: '#0f172a', padding: '1.25rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', textAlign: 'left', minHeight: '220px', overflowY: 'auto' }}>
              {data?.raw_text || 'Loading document preview...'}
            </div>
          </div>
        </div>

        {/* Right Pane: Extracted Fields & Raw Text */}
        <div className="card">
          <div className="card-title">
            <Edit3 size={18} color="var(--accent-blue)" /> Extracted Structured Data (Editable)
          </div>

          <div className="form-field">
            <label>Vendor Name</label>
            <input
              type="text"
              value={data?.extracted?.vendor || ''}
              onChange={(e) => setData({ ...data, extracted: { ...data.extracted, vendor: e.target.value } })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-field">
              <label>Invoice Number</label>
              <input
                type="text"
                value={data?.extracted?.invoice_no || ''}
                onChange={(e) => setData({ ...data, extracted: { ...data.extracted, invoice_no: e.target.value } })}
              />
            </div>
            <div className="form-field">
              <label>Invoice Date</label>
              <input
                type="text"
                value={data?.extracted?.date || ''}
                onChange={(e) => setData({ ...data, extracted: { ...data.extracted, date: e.target.value } })}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Total Amount</label>
            <input
              type="text"
              value={data?.extracted?.total || ''}
              style={{ fontWeight: 800, color: '#34d399', fontSize: '1.1rem' }}
              onChange={(e) => setData({ ...data, extracted: { ...data.extracted, total: e.target.value } })}
            />
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <FileCode size={14} /> Raw OCR Text Stream
            </span>
            <div className="raw-box">{data?.raw_text}</div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card">
        <div className="card-title">
          <Database size={18} color="var(--accent-amber)" /> SQLite Extraction Audit Trail (Past Invoices)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>File Name</th>
                <th>Vendor</th>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Processed At</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{row.filename}</td>
                    <td>{row.vendor}</td>
                    <td>{row.invoice_no}</td>
                    <td>{row.date}</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>{row.total}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{row.created_at}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No extracted invoices logged in database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
