import { useState } from 'react'
import { api } from '../api/client'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    api.search
      .semantic(query.trim(), 10)
      .then((r) => setResults(r.hits))
      .catch((err) => { setError(err.message || 'Search failed'); setResults([]) })
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Semantic search</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by meaning…"
          className="flex-1 border border-stone-300 rounded-lg px-4 py-2"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-stone-800 text-white px-6 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {results && (
        <ul className="space-y-3">
          {results.length === 0 ? (
            <p className="text-stone-500">No results.</p>
          ) : (
            results.map((h, i) => (
              <li key={i} className="border border-stone-200 rounded-lg p-4 bg-white">
                <p className="text-stone-700">{h.text}</p>
                <p className="text-xs text-stone-500 mt-1">
                  score {h.score?.toFixed(3)} · source {h.source_id} · {h.tipo}
                </p>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
