import { useState, useRef, useEffect, useMemo } from 'react'
import { api } from '../api/client'

const DEFAULT_URL = 'https://www.youtube.com/watch?v=XtxFdX7yIAs'
const POLL_INTERVAL_MS = 2500
const MAX_POLL_ATTEMPTS = 240 // 10 min

const STAGES = [
  { id: 'info', label: 'Analisi video' },
  { id: 'download', label: 'Download audio' },
  { id: 'transcribe', label: 'Trascrizione AI' },
  { id: 'cleanup', label: 'Pulizia testo' },
]

function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  const beMatch = trimmed.match(/\byoutu\.be\/([a-zA-Z0-9_-]{11})/)
  if (beMatch) return beMatch[1]
  const vMatch = trimmed.match(/(?:v=|\/embed\/)([a-zA-Z0-9_-]{11})/)
  return vMatch ? vMatch[1] : null
}

const SEGMENT_REGEX = /^Speaker\s+(\S+):\s*\[(\d+(?:\.\d+)?)s?\]\s*(.*)$/s
function parseTranscript(raw) {
  if (!raw || typeof raw !== 'string') return []
  const segments = []
  const lines = raw.split(/\n+/)
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    const m = t.match(SEGMENT_REGEX)
    if (m) {
      segments.push({
        speaker: m[1],
        speakerLabel: `Speaker ${m[1]}`,
        timeSeconds: parseFloat(m[2], 10),
        text: m[3].trim(),
      })
    } else if (segments.length) {
      segments[segments.length - 1].text += '\n' + t
    } else {
      segments.push({ speaker: '?', speakerLabel: 'Speaker ?', timeSeconds: 0, text: t })
    }
  }
  return segments
}

function normalizeMapStance(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (s === 'pro') return 'pro'
  if (s === 'contra') return 'contra'
  return 'neutral'
}

function toMapLabel(v) {
  const s = String(v || '').trim()
  return s || 'unknown'
}

function buildModelDebateMapData(result) {
  const topicsRaw = Array.isArray(result?.output?.topics) ? result.output.topics : []
  const claimsRaw = Array.isArray(result?.output?.claims) ? result.output.claims : []
  const disagreementsRaw = Array.isArray(result?.output?.disagreements) ? result.output.disagreements : []

  const topicMentions = new Map()
  const linkMap = new Map()
  const speakerSet = new Set()

  claimsRaw.forEach((c) => {
    if (!c || typeof c !== 'object') return
    const speaker = toMapLabel(c.speaker)
    const topic = toMapLabel(c.topic)
    const stance = normalizeMapStance(c.stance)
    const ts = Number.isFinite(Number(c.timestamp_s)) ? Number(c.timestamp_s) : 0
    speakerSet.add(speaker)
    topicMentions.set(topic, (topicMentions.get(topic) || 0) + 1)
    const key = `${speaker}::${topic}`
    if (!linkMap.has(key)) {
      linkMap.set(key, {
        source: speaker,
        target: topic,
        pro: 0,
        contra: 0,
        neutral: 0,
        total: 0,
        firstTime: ts,
      })
    }
    const obj = linkMap.get(key)
    obj[stance] += 1
    obj.total += 1
    obj.firstTime = Math.min(obj.firstTime, ts)
  })

  const seededTopics = topicsRaw
    .filter((t) => t && typeof t === 'object')
    .map((t) => toMapLabel(t.name))
    .filter(Boolean)
  for (const t of seededTopics) {
    if (!topicMentions.has(t)) topicMentions.set(t, 0)
  }

  const topics = [...topicMentions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, mentions]) => ({ id, label: id, mentions }))

  const disagreementsMap = new Map()
  disagreementsRaw.forEach((d) => {
    if (!d || typeof d !== 'object') return
    const topic = toMapLabel(d.topic)
    const a = toMapLabel(d.speaker_a)
    const b = toMapLabel(d.speaker_b)
    const ts = Number.isFinite(Number(d.timestamp_s)) ? Number(d.timestamp_s) : 0
    speakerSet.add(a)
    speakerSet.add(b)
    const pair = [a, b].sort().join('::')
    const key = `${pair}::${topic}`
    if (!disagreementsMap.has(key)) {
      disagreementsMap.set(key, { a, b, topic, weight: 0, time: ts })
    }
    const obj = disagreementsMap.get(key)
    obj.weight += 1
    obj.time = Math.min(obj.time, ts)
  })

  const speakers = [...speakerSet]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 12)
    .map((id) => ({ id, label: id }))

  return {
    topics,
    speakers,
    links: [...linkMap.values()],
    disagreements: [...disagreementsMap.values()].sort((a, b) => b.weight - a.weight).slice(0, 8),
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatPercent(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '-'
  return `${Math.round(v * 100)}%`
}

function formatUsd(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '-'
  if (v <= 0) return '$0'
  if (v < 0.01) return `$${v.toFixed(4)}`
  return `$${v.toFixed(3)}`
}

function normalizeCmpText(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function toShort(v, maxLen = 190) {
  const t = String(v || '').trim()
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen - 1).trimEnd() + '…'
}

function getSortedClaims(result) {
  const claims = Array.isArray(result?.output?.claims) ? result.output.claims : []
  return claims
    .filter((c) => c && typeof c === 'object')
    .map((c, idx) => ({
      idx,
      speaker: String(c.speaker || '?'),
      topic: String(c.topic || 'unknown'),
      stance: String(c.stance || 'neutral'),
      timestamp_s: Number.isFinite(Number(c.timestamp_s)) ? Number(c.timestamp_s) : 0,
      claim: String(c.claim || ''),
      evidence_quote: String(c.evidence_quote || ''),
    }))
    .sort((a, b) => a.timestamp_s - b.timestamp_s)
}

function buildClaimDiffRows(results) {
  if (!Array.isArray(results) || results.length < 2) return null
  const left = results[0]
  const right = results[1]
  const leftClaims = getSortedClaims(left)
  const rightClaims = getSortedClaims(right)
  const rightUsed = new Set()
  const rows = []

  for (const l of leftClaims) {
    let bestIndex = -1
    let bestScore = -9999
    for (let i = 0; i < rightClaims.length; i += 1) {
      if (rightUsed.has(i)) continue
      const r = rightClaims[i]
      const sameTopic = normalizeCmpText(l.topic) === normalizeCmpText(r.topic)
      const sameSpeaker = normalizeCmpText(l.speaker) === normalizeCmpText(r.speaker)
      const sameStance = normalizeCmpText(l.stance) === normalizeCmpText(r.stance)
      const dt = Math.abs(l.timestamp_s - r.timestamp_s)

      let score = 0
      if (sameTopic) score += 4
      if (sameSpeaker) score += 2
      if (sameStance) score += 1
      score -= Math.min(4, dt / 35)

      if (score > bestScore) {
        bestScore = score
        bestIndex = i
      }
    }

    if (bestIndex >= 0 && bestScore >= 1.5) {
      const r = rightClaims[bestIndex]
      rightUsed.add(bestIndex)
      rows.push({
        left: l,
        right: r,
        topicMatch: normalizeCmpText(l.topic) === normalizeCmpText(r.topic),
        speakerMatch: normalizeCmpText(l.speaker) === normalizeCmpText(r.speaker),
        stanceMatch: normalizeCmpText(l.stance) === normalizeCmpText(r.stance),
        timeDelta: Math.abs(l.timestamp_s - r.timestamp_s),
      })
    } else {
      rows.push({
        left: l,
        right: null,
        topicMatch: false,
        speakerMatch: false,
        stanceMatch: false,
        timeDelta: null,
      })
    }
  }

  for (let i = 0; i < rightClaims.length; i += 1) {
    if (rightUsed.has(i)) continue
    rows.push({
      left: null,
      right: rightClaims[i],
      topicMatch: false,
      speakerMatch: false,
      stanceMatch: false,
      timeDelta: null,
    })
  }

  return {
    left,
    right,
    rows: rows.sort((a, b) => {
      const ta = a.left?.timestamp_s ?? a.right?.timestamp_s ?? 0
      const tb = b.left?.timestamp_s ?? b.right?.timestamp_s ?? 0
      return ta - tb
    }),
  }
}

function renderHighlightedText(text, snippets) {
  if (!snippets?.length) return text

  const lower = text.toLowerCase()
  const ranges = []

  for (const rawSnippet of snippets) {
    const snippet = (rawSnippet || '').trim()
    if (!snippet) continue
    const s = snippet.toLowerCase()
    const start = lower.indexOf(s)
    if (start === -1) continue
    const end = start + s.length

    const overlaps = ranges.some((r) => !(end <= r.start || start >= r.end))
    if (!overlaps) ranges.push({ start, end })
  }

  if (!ranges.length) return text
  ranges.sort((a, b) => a.start - b.start)

  const chunks = []
  let cursor = 0
  ranges.forEach((r, i) => {
    if (cursor < r.start) {
      chunks.push(
        <span key={`t-${i}-${cursor}`}>
          {text.slice(cursor, r.start)}
        </span>,
      )
    }
    chunks.push(
      <mark
        key={`m-${i}-${r.start}`}
        className="rounded bg-rose-200/70 dark:bg-rose-500/25 px-1 text-gray-900 dark:text-gray-100"
      >
        {text.slice(r.start, r.end)}
      </mark>,
    )
    cursor = r.end
  })
  if (cursor < text.length) {
    chunks.push(<span key={`tail-${cursor}`}>{text.slice(cursor)}</span>)
  }

  return chunks
}

const SPEAKER_STYLE_A = {
  line: 'bg-emerald-500',
  text: 'text-emerald-700 dark:text-emerald-400',
  pill: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/40',
}
const SPEAKER_STYLE_B = {
  line: 'bg-sky-500',
  text: 'text-sky-700 dark:text-sky-400',
  pill: 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/40',
}
const SPEAKER_STYLES = [
  SPEAKER_STYLE_A,
  SPEAKER_STYLE_B,
  { line: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', pill: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/40' },
  { line: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', pill: 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/40' },
]

function getSpeakerStyle(speaker, speakerOrder) {
  const key = String(speaker || '').trim().toLowerCase()
  // Keep A/B colors stable even if transcript starts from B.
  if (key === 'a' || key.endsWith(' a')) return SPEAKER_STYLE_A
  if (key === 'b' || key.endsWith(' b')) return SPEAKER_STYLE_B

  let idx = speakerOrder.indexOf(speaker)
  if (idx === -1) {
    speakerOrder.push(speaker)
    idx = speakerOrder.length - 1
  }
  return SPEAKER_STYLES[idx % SPEAKER_STYLES.length]
}

function TranscriptConversation({
  segments,
  activeSegmentIndex,
  onSegmentClick,
  scrollContainerRef,
  highlightsBySegment = new Map(),
  isMonologue = false,
}) {
  const speakerOrder = []
  segments.forEach((s) => {
    if (!speakerOrder.includes(s.speaker)) speakerOrder.push(s.speaker)
  })
  const segmentRefs = useRef([])

  useEffect(() => {
    if (activeSegmentIndex < 0 || !scrollContainerRef?.current) return
    const el = segmentRefs.current[activeSegmentIndex]
    if (!el) return
    const cont = scrollContainerRef.current
    const segRect = el.getBoundingClientRect()
    const contRect = cont.getBoundingClientRect()
    const segTopInContent = cont.scrollTop + (segRect.top - contRect.top)
    const targetTop = segTopInContent - cont.clientHeight / 2 + segRect.height / 2
    cont.scrollTop = Math.max(0, targetTop)
  }, [activeSegmentIndex, scrollContainerRef])

  if (isMonologue) {
    // Vista monologo: layout articolo, timestamp discreto, nessun pill Speaker
    return (
      <div className="relative py-4">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          {segments.map((seg, i) => {
            const isActive = i === activeSegmentIndex
            const segmentHighlights = highlightsBySegment.get(i) || []
            return (
              <article
                key={`m-${seg.timeSeconds}-${i}`}
                data-segment-index={i}
                ref={(el) => { segmentRefs.current[i] = el }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  const selected = window.getSelection?.()?.toString()?.trim()
                  if (selected) return
                  onSegmentClick?.(seg.timeSeconds)
                }}
                onKeyDown={(e) => e.key === 'Enter' && onSegmentClick?.(seg.timeSeconds)}
                className={[
                  'group cursor-pointer py-2.5 px-3 -mx-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gray-100/80 dark:bg-white/8 border-l-2 border-sky-500 pl-5'
                    : 'hover:bg-gray-50/60 dark:hover:bg-white/[0.04] border-l-2 border-transparent pl-5',
                ].join(' ')}
              >
                <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500 tabular-nums select-none mr-2">
                  [{formatTime(seg.timeSeconds)}]
                </span>
                <span className={`whitespace-pre-wrap break-words text-[15px] leading-[1.7] text-gray-800 dark:text-gray-200 select-text ${isActive ? 'font-medium' : ''}`}>
                  {renderHighlightedText(seg.text, segmentHighlights)}
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1 ml-2 text-[10px] text-sky-500 font-medium">
                    <span className="h-1 w-1 rounded-full bg-sky-500 animate-pulse" />
                    in riproduzione
                  </span>
                )}
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative pl-6 py-4">
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200/60 dark:bg-gray-700/50 rounded-full" aria-hidden />
      {segments.map((seg, i) => {
        const style = getSpeakerStyle(seg.speaker, speakerOrder)
        const isActive = i === activeSegmentIndex
        const segmentHighlights = highlightsBySegment.get(i) || []
        return (
          <article
            key={`${seg.speaker}-${seg.timeSeconds}-${i}`}
            data-segment-index={i}
            ref={(el) => { segmentRefs.current[i] = el }}
            role="button"
            tabIndex={0}
            onClick={() => {
              const selected = window.getSelection?.()?.toString()?.trim()
              if (selected) return
              onSegmentClick?.(seg.timeSeconds)
            }}
            onKeyDown={(e) => e.key === 'Enter' && onSegmentClick?.(seg.timeSeconds)}
            className="group flex gap-4 mb-2 last:mb-0"
          >
            <div className="shrink-0 w-6 flex flex-col items-center pt-0.5">
              <div
                className={[
                  'w-3 h-3 rounded-full shrink-0 ring-4 ring-white dark:ring-[#1a1d24] transition-all duration-200',
                  style.line,
                  isActive ? 'scale-125 shadow-lg shadow-emerald-500/30' : 'opacity-50 group-hover:opacity-100',
                ].join(' ')}
              />
            </div>
            <div
              className={[
                'flex-1 min-w-0 rounded-xl border px-3 py-2 cursor-pointer transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1a1d24]',
                isActive
                  ? 'bg-white dark:bg-white/10 border-emerald-300/80 dark:border-emerald-500/40 shadow-md shadow-emerald-500/5'
                  : 'bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/70 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-gray-600',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">{formatTime(seg.timeSeconds)}</span>
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${style.pill}`}>
                  {seg.speakerLabel}
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    live
                  </span>
                )}
              </div>
              <p className={`whitespace-pre-wrap break-words text-[14px] leading-[1.65] text-gray-800 dark:text-gray-200 select-text ${isActive ? 'font-medium' : ''}`}>
                {renderHighlightedText(seg.text, segmentHighlights)}
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function LlmDebateMap({ result, onSeekTo }) {
  const data = useMemo(() => buildModelDebateMapData(result), [result])
  const claims = Array.isArray(result?.output?.claims) ? result.output.claims : []
  const speakers = data.speakers.map((s) => s.id)

  const stanceMeta = (link) => {
    if (!link) return { stance: 'neutral', count: 0 }
    const pro = Number(link.pro || 0)
    const contra = Number(link.contra || 0)
    const neutral = Number(link.neutral || 0)
    const count = Number(link.total || 0)
    if (pro > contra && pro >= neutral) return { stance: 'pro', count }
    if (contra > pro && contra >= neutral) return { stance: 'contra', count }
    return { stance: 'neutral', count }
  }
  const stancePill = (stance) => {
    if (stance === 'pro') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (stance === 'contra') return 'border-rose-200 bg-rose-50 text-rose-700'
    return 'border-slate-200 bg-slate-100 text-slate-700'
  }

  const topicRows = data.topics.map((topic) => {
    const links = data.links.filter((l) => l.target === topic.id)
    const speakerCells = speakers.map((sp) => {
      const link = links.find((l) => l.source === sp)
      if (!link) return { speaker: sp, stance: 'neutral', count: 0, empty: true }
      const m = stanceMeta(link)
      return { speaker: sp, stance: m.stance, count: m.count, empty: false }
    })

    const firstTimes = links.map((l) => Number(l.firstTime || 0)).filter((v) => Number.isFinite(v))
    const firstTime = firstTimes.length ? Math.min(...firstTimes) : null

    const sampleClaims = claims
      .filter((c) => normalizeCmpText(c?.topic) === normalizeCmpText(topic.id))
      .slice(0, 2)
      .map((c) => ({
        timestamp_s: Number.isFinite(Number(c?.timestamp_s)) ? Number(c.timestamp_s) : 0,
        speaker: String(c?.speaker || '?'),
        stance: String(c?.stance || 'neutral'),
        claim: String(c?.claim || ''),
      }))

    return {
      id: topic.id,
      label: topic.label,
      mentions: topic.mentions,
      speakerCells,
      firstTime,
      sampleClaims,
    }
  })

  const topDisagreements = data.disagreements.slice(0, 4)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_24px_rgba(15,23,42,0.08)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Mappa dibattito • {result?.label || result?.model || 'LLM'}
          </h3>
          <p className="text-[10px] text-slate-400">
            Stessi dati del confronto: topic, speaker, claim per modello. parse: {result?.parse_mode || 'n/a'} • topics {data.topics.length} • links {data.links.length}
          </p>
        </div>
        <span className={[
          'rounded-full border px-2 py-0.5 text-[10px] font-medium',
          result?.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700',
        ].join(' ')}>
          {result?.ok ? 'PASS' : 'FAIL'}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] text-slate-600">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">topics {data.topics.length}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">speakers {data.speakers.length}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">claims {claims.length}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">disagreements {data.disagreements.length}</span>
      </div>

      {topicRows.length === 0 ? (
        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-400">
          Output insufficiente per costruire la mappa.
        </div>
      ) : (
        <div className="space-y-2">
          {topicRows.map((row, idx) => (
            <article key={`topic-row-${row.id}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {idx + 1}. {row.label}
                  </p>
                  <p className="text-[11px] text-slate-500">mentions: {row.mentions}</p>
                </div>
                {row.firstTime != null ? (
                  <button
                    type="button"
                    onClick={() => onSeekTo?.(row.firstTime)}
                    className="rounded-md border border-sky-200 bg-white px-2 py-1 text-[11px] text-sky-700 hover:bg-sky-50"
                  >
                    vai {formatTime(row.firstTime)}
                  </button>
                ) : null}
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                {row.speakerCells.map((cell) => (
                  <span
                    key={`cell-${row.id}-${cell.speaker}`}
                    className={[
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]',
                      stancePill(cell.stance),
                    ].join(' ')}
                  >
                    <strong>{cell.speaker}</strong>
                    <span>{cell.empty ? '—' : cell.stance}</span>
                    {!cell.empty ? <span>({cell.count})</span> : null}
                  </span>
                ))}
              </div>

              {row.sampleClaims.length > 0 ? (
                <div className="space-y-1">
                  {row.sampleClaims.map((c, ci) => (
                    <div key={`claim-${row.id}-${ci}`} className="rounded-md bg-white px-2 py-1 text-[11px] text-slate-700">
                      <span className="font-mono text-slate-500">{formatTime(c.timestamp_s)}</span>
                      <span className="mx-1">•</span>
                      <span className="font-medium">{c.speaker}</span>
                      <span className="mx-1">•</span>
                      <span>{c.stance}</span>
                      <p className="mt-0.5 text-slate-600">{toShort(c.claim, 160)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {topDisagreements.length > 0 ? (
        <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50/35 p-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-violet-700">Top disaccordi</p>
          <div className="space-y-1">
            {topDisagreements.map((d, i) => (
              <div key={`dg-${i}`} className="text-[11px] text-violet-800">
                {d.a} vs {d.b} su <strong>{d.topic}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LlmDebateMaps({ compareData, loading, onSeekTo }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
        Generazione mappe LLM in corso...
      </div>
    )
  }
  const results = Array.isArray(compareData?.results) ? compareData.results : []
  if (!results.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-400">
        Dopo il confronto AI (colonna destra) qui vedi la mappa dibattito per ciascuno dei 3 modelli.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500 mb-1">Una mappa per ciascuno dei 3 modelli (topic, speaker, claim).</p>
      {results.map((r) => (
        <LlmDebateMap key={r.model || r.label} result={r} onSeekTo={onSeekTo} />
      ))}
    </div>
  )
}

function ModelComparisonPanel({ loading, error, data, onRetry, strictBenchmark }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3">
        <p className="text-xs font-medium text-indigo-800">Confronto modelli in corso...</p>
        <p className="text-xs text-indigo-700/80 mt-1">
          {strictBenchmark
            ? 'Benchmark rigoroso attivo: nessun repair/autofix, soglie minime su claim e disaccordi.'
            : 'Confronto standard: è consentito il repair/autofix dell’output.'}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-xs font-medium text-red-800 mb-1">Confronto modelli fallito</p>
        <p className="text-xs text-red-700 whitespace-pre-wrap">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md border border-red-200 bg-white px-2.5 py-1 text-[11px] text-red-700 hover:bg-red-50"
        >
          Riprova
        </button>
      </div>
    )
  }

  if (!data?.results?.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
        <p className="text-xs text-slate-600">
          Usa &quot;Confronto AI&quot; per far analizzare la trascrizione ai 3 Gemini e vedere quale modello è il migliore.
        </p>
      </div>
    )
  }

  const claimDiff = buildClaimDiffRows(data.results)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Quale modello è il migliore?
          </p>
          <p className="text-[11px] text-slate-400">
            Confronto tra i 3 Gemini Flash Lite sull’analisi del dibattito (topic, claim, disaccordi). Estratto: {data.excerpt_chars} chars • grounding min: {formatPercent(data.grounding_min_ratio)} • mode: {data.strict_benchmark ? 'strict benchmark' : 'standard'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={[
            'rounded-full px-2 py-1 text-[11px] font-medium border',
            data.from_cache ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-700 border-slate-200',
          ].join(' ')}>
            {data.from_cache ? 'LLM cache' : 'LLM fresh'}
          </span>
          {data.strict_benchmark ? (
            <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 border border-violet-200">
              strict
            </span>
          ) : null}
          {data.winner_label ? (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200">
              Winner: {data.winner_label}
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 border border-amber-200">
              Nessun winner (hard fail)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {data.results.map((r) => {
          const isWinner = data.winner_model && data.winner_model === r.model
          return (
            <div
              key={r.model}
              className={[
                'rounded-xl border bg-white p-3',
                isWinner ? 'border-emerald-300 shadow-[0_6px_20px_rgba(16,185,129,0.18)]' : 'border-slate-200',
              ].join(' ')}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.label || r.model}</p>
                  <p className="text-[11px] text-slate-500">{r.model}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    parse: {r.parse_mode || 'n/a'}
                  </p>
                </div>
                <span className={[
                  'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                  r.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700',
                ].join(' ')}>
                  {r.ok ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600 mb-2">
                <span>score: <strong className="text-slate-800">{r.metrics?.score ?? 0}</strong></span>
                <span>cost: <strong className="text-slate-800">{formatUsd(r.usage?.total_cost_usd ?? r.usage?.cost_usd)}</strong></span>
                <span>claims: <strong className="text-slate-800">{r.metrics?.claims_count ?? 0}</strong></span>
                <span>topics: <strong className="text-slate-800">{r.metrics?.topics_count ?? 0}</strong></span>
                <span>disagree: <strong className="text-slate-800">{r.metrics?.disagreements_count ?? 0}</strong></span>
                <span>grounding: <strong className="text-slate-800">{formatPercent(r.metrics?.quote_grounding_ratio)}</strong></span>
              </div>
              {Number(r.usage?.repair_cost_usd || 0) > 0 ? (
                <p className="mb-2 text-[10px] text-amber-700">
                  repair cost: {formatUsd(r.usage?.repair_cost_usd)}
                </p>
              ) : null}

              {!r.ok && r.error ? (
                <p className="mb-2 rounded-md bg-rose-50 px-2 py-1 text-[11px] text-rose-700">{r.error}</p>
              ) : null}

              <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Output JSON</p>
              <pre className="max-h-56 overflow-auto rounded-md bg-slate-950 p-2 text-[10px] leading-relaxed text-slate-100">
                {JSON.stringify(r.output || {}, null, 2)}
              </pre>
            </div>
          )
        })}
      </div>

      {claimDiff && (
        <div className="rounded-xl border border-indigo-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
              Diff claim-by-claim
            </p>
            <p className="text-[11px] text-indigo-500">
              {claimDiff.left?.label} vs {claimDiff.right?.label}
            </p>
          </div>

          <div className="max-h-[26rem] overflow-auto space-y-2 pr-1">
            {claimDiff.rows.slice(0, 20).map((row, i) => (
              <article key={`diff-row-${i}`} className="rounded-lg border border-slate-200 bg-slate-50/40 p-2.5">
                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600">
                    #{i + 1}
                  </span>
                  {row.timeDelta != null ? (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600">
                      Δt {row.timeDelta.toFixed(1)}s
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-500">
                      unmatched
                    </span>
                  )}
                  <span className={[
                    'rounded-full border px-2 py-0.5',
                    row.topicMatch ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700',
                  ].join(' ')}>
                    topic {row.topicMatch ? 'match' : 'diff'}
                  </span>
                  <span className={[
                    'rounded-full border px-2 py-0.5',
                    row.stanceMatch ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700',
                  ].join(' ')}>
                    stance {row.stanceMatch ? 'match' : 'diff'}
                  </span>
                  <span className={[
                    'rounded-full border px-2 py-0.5',
                    row.speakerMatch ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700',
                  ].join(' ')}>
                    speaker {row.speakerMatch ? 'match' : 'diff'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="rounded-md border border-indigo-100 bg-indigo-50/40 p-2">
                    <p className="text-[11px] font-medium text-indigo-700 mb-1">{claimDiff.left?.label}</p>
                    {row.left ? (
                      <>
                        <p className="text-[10px] text-slate-500 mb-1">
                          {formatTime(row.left.timestamp_s)} • {row.left.speaker} • {row.left.topic} • {row.left.stance}
                        </p>
                        <p className="text-[11px] text-slate-800 leading-relaxed mb-1">
                          {toShort(row.left.claim)}
                        </p>
                        <p className="text-[10px] text-slate-500 italic">
                          "{toShort(row.left.evidence_quote, 120)}"
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">Nessun claim allineato</p>
                    )}
                  </div>

                  <div className="rounded-md border border-fuchsia-100 bg-fuchsia-50/35 p-2">
                    <p className="text-[11px] font-medium text-fuchsia-700 mb-1">{claimDiff.right?.label}</p>
                    {row.right ? (
                      <>
                        <p className="text-[10px] text-slate-500 mb-1">
                          {formatTime(row.right.timestamp_s)} • {row.right.speaker} • {row.right.topic} • {row.right.stance}
                        </p>
                        <p className="text-[11px] text-slate-800 leading-relaxed mb-1">
                          {toShort(row.right.claim)}
                        </p>
                        <p className="text-[10px] text-slate-500 italic">
                          "{toShort(row.right.evidence_quote, 120)}"
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">Nessun claim allineato</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function YouTubeViewer() {
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL)
  const [urlError, setUrlError] = useState('')
  const [activeUrl, setActiveUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [transcriptError, setTranscriptError] = useState(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptStage, setTranscriptStage] = useState('')
  const [transcriptMessage, setTranscriptMessage] = useState('')
  const [fromCache, setFromCache] = useState(false)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1)
  const [copyOk, setCopyOk] = useState(false)
  const [highlights, setHighlights] = useState([])
  const [pendingSelection, setPendingSelection] = useState(null)
  const [showHighlightsPanel, setShowHighlightsPanel] = useState(true)
  const [speakers, setSpeakers] = useState(2) // 1 = monologo, 2 = dialogo
  const [language, setLanguage] = useState('it') // it, en, auto
  const [forceRefresh, setForceRefresh] = useState(false)
  const [useAssembly, setUseAssembly] = useState(false)

  const pollAbort = useRef(false)
  const playerRef = useRef(null)
  const transcriptScrollRef = useRef(null)

  const videoId = activeUrl ? getYouTubeVideoId(activeUrl) : null
  const showPlayer = Boolean(videoId)
  const isValidInputUrl = Boolean(getYouTubeVideoId(inputUrl.trim()))
  const segments = useMemo(() => parseTranscript(transcript), [transcript])
  const activeSegment = activeSegmentIndex >= 0 ? segments[activeSegmentIndex] : null

  const stageIndex = STAGES.findIndex((s) => s.id === transcriptStage)
  const activeStageLabel = STAGES.find((s) => s.id === transcriptStage)?.label || 'Elaborazione'

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const url = inputUrl.trim()
    const id = getYouTubeVideoId(url)
    if (!id) {
      setUrlError('Inserisci un URL YouTube valido (youtube.com/watch?v=... o youtu.be/...).')
      return
    }

    setUrlError('')
    setActiveUrl(url)
    setTranscript('')
    setTranscriptError(null)
    setTranscriptLoading(true)
    setTranscriptStage('info')
    setTranscriptMessage('Avvio processo...')
    setFromCache(false)
    setActiveSegmentIndex(-1)
    setHighlights([])
    setPendingSelection(null)
    pollAbort.current = false

    try {
      const res = await api.youtube.transcriptStart(url, speakers, language, forceRefresh, useAssembly)
      if (res.error || res.job_id == null) {
        let msg = res.error || 'Errore sconosciuto'
        if (res.traceback) msg += '\n\n' + res.traceback.split('\n').slice(-10).join('\n')
        setTranscriptError(msg)
        setTranscriptLoading(false)
        return
      }

      const job_id = res.job_id
      let attempts = 0

      while (attempts < MAX_POLL_ATTEMPTS && !pollAbort.current) {
        const status = await api.youtube.transcriptStatus(job_id)
        if (status.stage) setTranscriptStage(status.stage)
        if (status.message) setTranscriptMessage(status.message)

        if (status.status === 'ready') {
          const readyTranscript = status.transcript || ''
          setTranscript(readyTranscript)
          setFromCache(Boolean(status.from_cache))
          break
        }

        if (status.status === 'failed') {
          setTranscriptError(status.error || 'Trascrizione fallita')
          break
        }

        // Faster early polling so stage changes don't appear "stuck" on step 1.
        const waitMs = attempts < 8 ? 500 : POLL_INTERVAL_MS
        await new Promise((r) => setTimeout(r, waitMs))
        attempts += 1
      }

      if (attempts >= MAX_POLL_ATTEMPTS && !pollAbort.current) {
        setTranscriptError('Timeout: trascrizione troppo lunga.')
      }
    } catch (err) {
      let msg = err.body || err.message || 'Errore di rete'
      if (err.status === 500 && (!msg || msg.trim() === '')) {
        msg = 'Backend non raggiungibile (500). Avvia il backend dalla cartella backend: uvicorn app.main:app --port 8000'
      } else if (typeof msg === 'string' && msg.startsWith('{')) {
        try {
          const d = JSON.parse(msg)
          msg = d.detail || d.error || msg
          if (d.traceback) msg += '\n\n' + d.traceback.split('\n').slice(-8).join('\n')
        } catch (_) {}
      }
      setTranscriptError(msg)
    }

    setTranscriptLoading(false)
  }

  const handleReset = () => {
    setActiveUrl('')
    setInputUrl(DEFAULT_URL)
    setUrlError('')
    setTranscript('')
    setTranscriptError(null)
    setTranscriptLoading(false)
    setTranscriptStage('')
    setTranscriptMessage('')
    setFromCache(false)
    setActiveSegmentIndex(-1)
    setHighlights([])
    setPendingSelection(null)
    pollAbort.current = true
  }

  useEffect(() => {
    if (window.YT?.Player) return
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {}
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    if (!videoId) return

    const initPlayer = () => {
      if (!window.YT?.Player || !document.getElementById('yt-player-container')) return false

      if (playerRef.current) {
        try { playerRef.current.destroy() } catch (_) {}
        playerRef.current = null
      }

      playerRef.current = new window.YT.Player('yt-player-container', {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, rel: 0 },
        events: {
          onReady: (evt) => {
            try { evt.target.playVideo() } catch (_) {}
          },
        },
      })
      return true
    }

    if (initPlayer()) return () => {
      try { playerRef.current?.destroy() } catch (_) {}
      playerRef.current = null
    }

    const interval = setInterval(() => {
      if (initPlayer()) clearInterval(interval)
    }, 120)

    return () => {
      clearInterval(interval)
      try { playerRef.current?.destroy() } catch (_) {}
      playerRef.current = null
    }
  }, [videoId])

  useEffect(() => {
    if (!segments.length || !playerRef.current?.getCurrentTime) return
    const interval = setInterval(() => {
      try {
        const t = playerRef.current.getCurrentTime()
        if (typeof t !== 'number' || t < 0) return
        let i = 0
        for (let j = 0; j < segments.length; j++) {
          if (segments[j].timeSeconds <= t) i = j
        }
        setActiveSegmentIndex((prev) => (prev !== i ? i : prev))
      } catch (_) {}
    }, 450)

    return () => clearInterval(interval)
  }, [segments])

  const handleSeekTo = (timeSeconds) => {
    try {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(timeSeconds, true)
        playerRef.current.playVideo?.()
      }
    } catch (_) {}
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 1500)
    } catch (_) {}
  }

  const highlightsBySegment = useMemo(() => {
    const map = new Map()
    for (const h of highlights) {
      if (!map.has(h.segmentIndex)) map.set(h.segmentIndex, [])
      map.get(h.segmentIndex).push(h.text)
    }
    return map
  }, [highlights])

  const captureSelection = () => {
    setTimeout(() => {
      if (!transcriptScrollRef.current || !segments.length) return
      const selection = window.getSelection?.()
      if (!selection || selection.rangeCount === 0) {
        setPendingSelection(null)
        return
      }
      const text = selection.toString().trim()
      if (text.length < 2) {
        setPendingSelection(null)
        return
      }
      const range = selection.getRangeAt(0)
      const getHost = (node) => (node?.nodeType === 1 ? node : node?.parentElement)
      const startHost = getHost(range.startContainer)
      const endHost = getHost(range.endContainer)
      const hostEl = startHost?.closest?.('[data-segment-index]') || endHost?.closest?.('[data-segment-index]')
      if (!hostEl || !transcriptScrollRef.current.contains(hostEl)) return
      const segmentIndex = Number(hostEl.dataset.segmentIndex)
      const seg = segments[segmentIndex]
      if (!seg) return
      setPendingSelection({
        text,
        segmentIndex,
        timeSeconds: seg.timeSeconds,
        speakerLabel: seg.speakerLabel,
      })
    }, 0)
  }

  const addSelectionToHighlights = () => {
    if (!pendingSelection?.text) return
    setHighlights((prev) => {
      const exists = prev.some(
        (h) =>
          h.segmentIndex === pendingSelection.segmentIndex &&
          h.text.toLowerCase() === pendingSelection.text.toLowerCase(),
      )
      if (exists) return prev
      return [
        ...prev,
        {
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          text: pendingSelection.text,
          segmentIndex: pendingSelection.segmentIndex,
          timeSeconds: pendingSelection.timeSeconds,
          speakerLabel: pendingSelection.speakerLabel,
        },
      ]
    })
    setPendingSelection(null)
    window.getSelection?.()?.removeAllRanges?.()
  }

  const removeHighlight = (id) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
  }
  const clearHighlights = () => setHighlights([])

  const copyHighlights = async () => {
    if (!highlights.length) return
    const payload = highlights
      .map((h, idx) => `${idx + 1}. [${formatTime(h.timeSeconds)}] ${h.speakerLabel}\n"${h.text}"`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(payload)
    } catch (_) {}
  }

  useEffect(() => {
    if (!pendingSelection) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPendingSelection(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pendingSelection])

  if (!showPlayer) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-5 bg-gray-100/80 dark:bg-[#0B0F19] relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-2xl rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-[#1a1d24]/80 backdrop-blur-xl shadow-2xl p-10 sm:p-12 relative z-10">
          <div className="mb-8 text-center flex flex-col items-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              YouTube
              <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-lg uppercase tracking-widest shadow-md">Transcript</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              Incolla il link di un video per generare una trascrizione interattiva. Analizza, evidenzia e naviga i momenti chiave.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Tipo:</span>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSpeakers(1)}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${speakers === 1 ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                  Monologo (1)
                </button>
                <button
                  type="button"
                  onClick={() => setSpeakers(2)}
                  className={`px-4 py-2 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${speakers === 2 ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                  Dialogo (2)
                </button>
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 ml-2">Lingua:</span>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLanguage('it')}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${language === 'it' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                  Italiano
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-2 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${language === 'en' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('auto')}
                  className={`px-3 py-2 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${language === 'auto' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                  Auto
                </button>
              </div>
              <label className="flex items-center gap-2 ml-2 cursor-pointer" title="Rigenera ignorando la cache">
                <input type="checkbox" checked={forceRefresh} onChange={(e) => setForceRefresh(e.target.checked)} className="rounded border-gray-300 text-rose-500 dark:border-gray-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Rigenera</span>
              </label>
              <label className="flex items-center gap-2 ml-1 cursor-pointer" title="Usa AssemblyAI per trascrizione completa (include le ultime frasi, più lento)">
                <input type="checkbox" checked={useAssembly} onChange={(e) => setUseAssembly(e.target.checked)} className="rounded border-gray-300 text-sky-500 dark:border-gray-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Trascrizione completa</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value)
                  if (urlError) setUrlError('')
                }}
                placeholder={DEFAULT_URL}
                className={[
                  'w-full rounded-xl border bg-gray-50/50 pl-5 pr-32 py-4 text-sm text-gray-800 transition-colors placeholder-gray-400 dark:bg-[#0B0F19]/50 dark:text-gray-200 dark:placeholder-gray-500',
                  urlError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700/50',
                ].join(' ')}
                autoFocus
              />
              <button
                type="submit"
                disabled={!getYouTubeVideoId(inputUrl)}
                className="absolute right-2 top-2 bottom-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Inizia
              </button>
            </div>
            {urlError && <p className="text-xs font-medium text-red-600 dark:text-red-400 ml-2">{urlError}</p>}
          </form>
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-center gap-6 text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sincronizzato</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Interattivo</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Export AI</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-100/80 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30 antialiased">
      <div className="shrink-0 px-5 py-3 flex items-center justify-between bg-white/95 dark:bg-[#1a1d24] border-b border-gray-200/80 dark:border-gray-800/80">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-lg font-extrabold tracking-tight text-gray-800 dark:text-gray-100 shrink-0 flex items-center gap-2">
            YouTube
            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-500/25 text-rose-600 dark:text-rose-300 rounded-md uppercase tracking-widest">Transcript</span>
          </h1>
          <div className="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
            <button type="button" onClick={() => setSpeakers(1)} className={`px-2.5 py-1.5 text-[10px] font-medium ${speakers === 1 ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`} title="Monologo">1</button>
            <button type="button" onClick={() => setSpeakers(2)} className={`px-2.5 py-1.5 text-[10px] font-medium border-l border-gray-200 dark:border-gray-700 ${speakers === 2 ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`} title="Dialogo">2</button>
          </div>
          <div className="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0" title="Lingua trascrizione">
            <button type="button" onClick={() => setLanguage('it')} className={`px-2 py-1.5 text-[10px] font-medium ${language === 'it' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}>IT</button>
            <button type="button" onClick={() => setLanguage('en')} className={`px-2 py-1.5 text-[10px] font-medium border-l border-gray-200 dark:border-gray-700 ${language === 'en' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}>EN</button>
            <button type="button" onClick={() => setLanguage('auto')} className={`px-2 py-1.5 text-[10px] font-medium border-l border-gray-200 dark:border-gray-700 ${language === 'auto' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}>Auto</button>
          </div>
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value)
              if (urlError) setUrlError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            placeholder={DEFAULT_URL}
            className={[
              'flex-1 min-w-0 max-w-xl rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-800 transition-colors placeholder-gray-400 dark:bg-white/5 dark:text-gray-200 dark:placeholder-gray-500',
              urlError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700/50',
            ].join(' ')}
          />
          <label className="flex items-center gap-1.5 shrink-0 cursor-pointer" title="Rigenera (ignora cache)">
            <input type="checkbox" checked={forceRefresh} onChange={(e) => setForceRefresh(e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 text-rose-500 dark:border-gray-600" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Rigenera</span>
          </label>
          <label className="flex items-center gap-1.5 shrink-0 cursor-pointer" title="Trascrizione completa (AssemblyAI)">
            <input type="checkbox" checked={useAssembly} onChange={(e) => setUseAssembly(e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 text-sky-500 dark:border-gray-600" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Completa</span>
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValidInputUrl || transcriptLoading}
            className="shrink-0 rounded-lg bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {transcriptLoading ? 'Caricamento…' : 'Carica'}
          </button>
          <button type="button" onClick={handleReset} className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
            Cambia video
          </button>
        </div>
        {urlError ? <p className="ml-2 text-[10px] text-red-600 dark:text-red-400">{urlError}</p> : null}
      </div>

      <div className="flex-1 min-h-0 p-5 flex gap-5 overflow-hidden">
        <aside className="w-full lg:w-[40%] xl:w-[36%] rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-[#1a1d24] shadow-sm overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-4 space-y-4">
            <div className="mb-3 flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                sincronizzato
              </span>
              {activeSegment && <span className="font-mono tabular-nums">{formatTime(activeSegment.timeSeconds)}</span>}
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md shadow-black/10 dark:shadow-black/40 ring-1 ring-gray-200 dark:ring-white/10">
              <div id="yt-player-container" className="w-full h-full relative z-10" />
            </div>
            <div className="rounded-lg border border-gray-200/80 dark:border-gray-700/80 bg-gray-50 dark:bg-white/5 px-3 py-2 text-[11px] text-gray-600 dark:text-gray-400">
              Clicca un blocco della trascrizione per fare seek al timestamp.
            </div>
          </div>
        </aside>

        <section className="relative flex-1 flex flex-col min-w-0 min-h-0 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-[#1a1d24] shadow-sm overflow-hidden">
          <div className="flex-shrink-0 px-5 py-3 border-b border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Trascrizione</span>
              {fromCache && <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">cache</span>}
              {transcriptLoading ? (
                <span className="rounded-md border border-sky-200 dark:border-sky-500/50 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                  in corso: {activeStageLabel}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {activeSegment && (
                <span className="hidden sm:inline text-[10px] text-gray-500 dark:text-gray-400">
                  focus: <span className="font-mono">{formatTime(activeSegment.timeSeconds)}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowHighlightsPanel((s) => !s)}
                className="rounded-lg border border-rose-200 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
              >
                Evidenziati {highlights.length}
              </button>
              {transcript ? (
                <button type="button" onClick={handleCopy} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-white/5 px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                  {copyOk ? 'Copiato' : 'Copia'}
                </button>
              ) : null}
            </div>
          </div>

          <div
            ref={transcriptScrollRef}
            className="flex-1 min-h-0 overflow-y-auto relative"
            onMouseUp={captureSelection}
            onKeyUp={captureSelection}
          >
          {showHighlightsPanel && (
            <div className="border-b border-rose-200/50 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 px-4 py-2.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-800 dark:text-rose-300">
                  Raccolta evidenziati ({highlights.length})
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyHighlights}
                    disabled={!highlights.length}
                    className="text-[10px] font-medium text-rose-700 dark:text-rose-400 hover:underline disabled:opacity-40"
                  >
                    Copia raccolta
                  </button>
                  <button
                    type="button"
                    onClick={clearHighlights}
                    disabled={!highlights.length}
                    className="text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-40"
                  >
                    Svuota
                  </button>
                </div>
              </div>
              {highlights.length === 0 ? (
                <p className="text-[11px] text-rose-700/90 dark:text-rose-400/90">
                  Seleziona testo nella trascrizione e clicca "Evidenzia selezione".
                </p>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {highlights.map((h) => (
                    <div key={h.id} className="rounded-lg border border-rose-200/70 dark:border-rose-500/30 bg-white dark:bg-white/5 px-2.5 py-1.5">
                      <div className="mb-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleSeekTo(h.timeSeconds)}
                          className="font-mono text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          {formatTime(h.timeSeconds)}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHighlight(h.id)}
                          className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          rimuovi
                        </button>
                      </div>
                      {speakers !== 1 && <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{h.speakerLabel}</p>}
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">"{h.text}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

              <div className="mx-auto w-full max-w-[46rem] px-4 pb-6">
                {transcriptError && (
                  <div className="my-4 rounded-xl border border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-300">
                    {transcriptError}
                  </div>
                )}

                {transcript ? (
                  <TranscriptConversation
                    segments={segments}
                    activeSegmentIndex={activeSegmentIndex}
                    onSegmentClick={handleSeekTo}
                    scrollContainerRef={transcriptScrollRef}
                    highlightsBySegment={highlightsBySegment}
                    isMonologue={speakers === 1}
                  />
                ) : transcriptLoading ? (
                  <div className="mx-auto max-w-md py-12 flex flex-col items-center justify-center">
                    <div className="relative w-14 h-14 flex items-center justify-center mb-8">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800" />
                      <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
                      <div className="w-5 h-5 rounded-full bg-sky-500/20 animate-pulse" />
                    </div>
                    
                    <div className="w-full bg-white dark:bg-[#1a1d24] rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800">
                        <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-r-full" style={{ width: '30%', animation: 'transcript-progress 1.7s ease-in-out infinite' }} />
                      </div>
                      
                      <h3 className="text-center font-bold text-gray-800 dark:text-gray-100 mb-1 mt-2">
                        {stageIndex > 0 ? 'Generazione in corso...' : 'Controllo video...'}
                      </h3>
                      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-6">
                        {transcriptMessage || 'Attendere prego, l\'AI sta elaborando il contenuto.'}
                      </p>

                      {stageIndex > 0 ? (
                        <div className="space-y-2">
                          {STAGES.map((s, i) => {
                            const done = stageIndex >= 0 && i < stageIndex
                            const current = s.id === transcriptStage
                            return (
                              <div
                                key={s.id}
                                className={[
                                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300',
                                  current ? 'bg-sky-50/80 dark:bg-sky-500/10 border border-sky-200/50 dark:border-sky-500/20 shadow-sm' : done ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 opacity-60',
                                ].join(' ')}
                              >
                                <span className={[
                                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors duration-300',
                                  current ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-500/20' : done ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500',
                                ].join(' ')}>
                                  {done ? '✓' : i + 1}
                                </span>
                                <span className={current ? 'font-medium text-sky-700 dark:text-sky-300' : ''}>{s.label}</span>
                                {current ? <span className="ml-auto text-[9px] font-bold text-sky-500 uppercase tracking-widest animate-pulse">Live</span> : null}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 opacity-60">
                          <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                          <div className="h-10 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mx-auto" />
                          <div className="h-10 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500/80">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gray-400 dark:text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">Pronto per trascrivere</h3>
                    <p className="text-xs text-center max-w-xs">
                      Inserisci l'URL di un video e clicca Carica. L'AI genererà una trascrizione interattiva.
                    </p>
                  </div>
                )}
              </div>

            <div className="pointer-events-none sticky left-0 right-0 top-0 z-10 h-12 -mt-12 bg-gradient-to-b from-white dark:from-[#1a1d24] to-transparent" />
            <div className="pointer-events-none sticky left-0 right-0 bottom-0 z-10 h-12 -mb-12 bg-gradient-to-t from-white dark:from-[#1a1d24] to-transparent" />

          </div>

          {pendingSelection && (
            <div className="fixed bottom-6 right-6 z-[100] w-[min(30rem,calc(100vw-3rem))] rounded-xl border border-rose-200/80 dark:border-rose-500/40 bg-white dark:bg-[#1a1d24] shadow-xl p-3">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                {speakers === 1 ? formatTime(pendingSelection.timeSeconds) : `${pendingSelection.speakerLabel} • ${formatTime(pendingSelection.timeSeconds)}`}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed max-h-16 overflow-hidden mb-3">
                "{pendingSelection.text}"
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingSelection(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={addSelectionToHighlights}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                >
                  Evidenzia selezione
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.4); border-radius: 6px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.6); }
        @keyframes transcript-progress { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(200%); } }
      `}</style>
    </div>
  )
}
