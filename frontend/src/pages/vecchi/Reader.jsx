import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'

const INTENTS = [
  { value: 'deep_dive', label: 'Deep dive' },
  { value: 'fact_checking', label: 'Fact checking' },
  { value: 'skimming', label: 'Skimming' },
  { value: 'auto', label: 'Auto' },
]

export default function Reader() {
  const { sourceId } = useParams()
  const [source, setSource] = useState(null)
  const [content, setContent] = useState(null)
  const [insights, setInsights] = useState([])
  const [intent, setIntent] = useState('deep_dive')
  const [selection, setSelection] = useState(null)
  const [principle, setPrinciple] = useState('')
  const [contexts, setContexts] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sourceId) return
    api.sources.get(Number(sourceId)).then(setSource).catch(() => setSource(null))
  }, [sourceId])

  useEffect(() => {
    if (!sourceId) return
    api.content.getBySource(Number(sourceId)).then(setContent).catch(() => setContent(null))
  }, [sourceId])

  useEffect(() => {
    if (!content?.id) return
    api.insights.list({ content_id: content.id }).then(setInsights).catch(() => setInsights([]))
  }, [content?.id])

  const text = content?.clean_text || content?.raw_text || ''
  const loading = source === null || (source?.status === 'ready' && !content)

  const handleMouseUp = () => {
    const sel = window.getSelection()
    const text = sel.toString().trim()
    if (text) setSelection(text)
    else setSelection(null)
  }

  const handleSaveHighlight = () => {
    if (!selection || !content?.id) return
    setSaving(true)
    setError(null)
    api.insights
      .create({
        content_id: content.id,
        text: selection.slice(0, 2000),
        transferable_principle: principle || null,
        applicability_contexts: contexts ? contexts.split(',').map((s) => s.trim()).filter(Boolean) : null,
        session_intent: intent,
      })
      .then((ins) => {
        setInsights((prev) => [ins, ...prev])
        setSelection(null)
        setPrinciple('')
        setContexts('')
      })
      .catch((err) => setError(err.message || 'Failed to save'))
      .finally(() => setSaving(false))
  }

  const handleUpdateInsight = (insightId, patch) => {
    api.insights
      .update(insightId, patch)
      .then((updated) =>
        setInsights((prev) => prev.map((i) => (i.id === insightId ? updated : i)))
      )
      .catch((err) => setError(err.message))
  }

  if (!source && !loading) return <p className="text-stone-500">Source not found.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">{source?.title || `Source ${sourceId}`}</h1>
        <span className="text-sm text-stone-500">{source?.status}</span>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">Session intent:</label>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="border border-stone-300 rounded px-2 py-1 text-sm"
          >
            {INTENTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {source?.status === 'pending' || source?.status === 'processing' ? (
        <p className="text-stone-500">Content is being processed. Refresh in a moment.</p>
      ) : loading && !text ? (
        <p className="text-stone-500">Loading content…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              className="bg-white border border-stone-200 rounded-lg p-6 min-h-[400px] whitespace-pre-wrap text-stone-700 selection:bg-amber-200"
              onMouseUp={handleMouseUp}
            >
              {text || 'No text content.'}
            </div>

            {selection && (
              <div className="mt-4 p-4 border border-amber-300 bg-amber-50 rounded-lg">
                <p className="text-sm text-stone-600 mb-2">Selected: &quot;{selection.slice(0, 120)}{selection.length > 120 ? '…' : ''}&quot;</p>
                <input
                  type="text"
                  placeholder="Transferable principle (optional)"
                  value={principle}
                  onChange={(e) => setPrinciple(e.target.value)}
                  className="w-full border border-stone-300 rounded px-3 py-2 mb-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Applicability contexts, comma-separated (optional)"
                  value={contexts}
                  onChange={(e) => setContexts(e.target.value)}
                  className="w-full border border-stone-300 rounded px-3 py-2 mb-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveHighlight}
                    disabled={saving}
                    className="bg-stone-800 text-white px-4 py-2 rounded text-sm hover:bg-stone-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save as insight'}
                  </button>
                  <button
                    onClick={() => { setSelection(null); setPrinciple(''); setContexts('') }}
                    className="border border-stone-300 px-4 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-medium mb-2">Insights</h2>
            {insights.length === 0 ? (
              <p className="text-stone-500 text-sm">No highlights yet. Select text and save.</p>
            ) : (
              <ul className="space-y-3">
                {insights.map((ins) => (
                  <li key={ins.id} className="border border-stone-200 rounded-lg p-3 bg-white text-sm">
                    <p className="text-stone-700 mb-2">&quot;{ins.text.slice(0, 150)}{ins.text.length > 150 ? '…' : ''}&quot;</p>
                    <input
                      type="text"
                      placeholder="Principle"
                      defaultValue={ins.transferable_principle || ''}
                      onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (v !== (ins.transferable_principle || '')) handleUpdateInsight(ins.id, { transferable_principle: v })
                      }}
                      className="w-full border border-stone-200 rounded px-2 py-1 mb-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Contexts (comma-separated)"
                      defaultValue={Array.isArray(ins.applicability_contexts) ? ins.applicability_contexts.join(', ') : ''}
                      onBlur={(e) => {
                        const v = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        const prev = Array.isArray(ins.applicability_contexts) ? ins.applicability_contexts : []
                        if (JSON.stringify(v) !== JSON.stringify(prev)) handleUpdateInsight(ins.id, { applicability_contexts: v })
                      }}
                      className="w-full border border-stone-200 rounded px-2 py-1 text-xs"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
