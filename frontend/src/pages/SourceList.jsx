import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function SourceList() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')
  const [tipo, setTipo] = useState('article')
  const [error, setError] = useState(null)

  useEffect(() => {
    api.sources.list().then(setSources).catch(() => setSources([])).finally(() => setLoading(false))
  }, [])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const fileTipo = file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.md') ? 'note' : 'note'
    api.sources
      .createFile(file, fileTipo, file.name, 7)
      .then(() => api.sources.list().then(setSources))
      .catch((err) => setError(err.message || 'Upload failed'))
      .finally(() => { setUploading(false); e.target.value = '' })
  }

  const handleUrlSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setUploading(true)
    setError(null)
    api.sources
      .createUrl(url.trim(), tipo, null, 7)
      .then(() => { setUrl(''); return api.sources.list().then(setSources) })
      .catch((err) => setError(err.message || 'Import failed'))
      .finally(() => setUploading(false))
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Sources</h1>

      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-stone-600 mb-1">Upload file (PDF, Markdown)</label>
          <input
            type="file"
            accept=".pdf,.md,.markdown"
            onChange={handleFileUpload}
            disabled={uploading}
            className="text-sm"
          />
        </div>
        <form onSubmit={handleUrlSubmit} className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-sm text-stone-600 mb-1">URL (article or YouTube)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="border border-stone-300 rounded px-3 py-2 w-72"
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">Type</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="border border-stone-300 rounded px-3 py-2"
              disabled={uploading}
            >
              <option value="article">Article</option>
              <option value="video">Video (YouTube)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={uploading || !url.trim()}
            className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-700 disabled:opacity-50"
          >
            {uploading ? 'Adding…' : 'Add URL'}
          </button>
        </form>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : sources.length === 0 ? (
        <p className="text-stone-500">No sources yet. Upload a file or add a URL.</p>
      ) : (
        <ul className="space-y-2">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between border border-stone-200 rounded-lg px-4 py-3 bg-white">
              <div>
                <Link to={`/source/${s.id}`} className="font-medium text-stone-800 hover:underline">
                  {s.title || s.url_or_path || `Source ${s.id}`}
                </Link>
                <span className="ml-2 text-xs text-stone-500">{s.tipo} · {s.status}</span>
              </div>
              <Link
                to={`/source/${s.id}`}
                className="text-sm text-stone-600 hover:text-stone-800"
              >
                Open →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
