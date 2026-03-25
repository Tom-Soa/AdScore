'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnalysisRecord, NiveauRisque } from '@/types/analysis'
import { getScoreColor, getScoreBg, getNiveauLabel, cn } from '@/lib/utils'
import { ChevronDown, Filter } from 'lucide-react'

const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google',
  meta: 'Meta',
  both: 'Les deux',
  all: 'Toutes',
}

export default function HistoriquePage() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    minScore: '',
    maxScore: '',
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [feedbacks, setFeedbacks] = useState<Record<string, { status: string; reason: string }>>({})

  const fetchAnalyses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      ...(filters.platform !== 'all' && { platform: filters.platform }),
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.minScore && { minScore: filters.minScore }),
      ...(filters.maxScore && { maxScore: filters.maxScore }),
    })
    const res = await fetch(`/api/analyses?${params}`)
    const data = await res.json()
    setAnalyses(data.analyses || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, filters])

  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  const handleFeedback = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    await fetch(`/api/analyses/${id}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, feedback_reason: reason }),
    })
    setFeedbacks((prev) => ({ ...prev, [id]: { status, reason: reason || '' } }))
    fetchAnalyses()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white">Historique</h1>
          <p className="text-white/30 text-sm mt-1">{total} analyse{total > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs font-mono text-white/30 uppercase tracking-wider">Filtres</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-white/30 mb-1 block">Plateforme</label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
            >
              {['all', 'google', 'meta', 'both'].map((p) => (
                <option key={p} value={p} className="bg-zinc-900">
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/30 mb-1 block">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
            >
              <option value="all" className="bg-zinc-900">Tous</option>
              <option value="pending" className="bg-zinc-900">En attente</option>
              <option value="approved" className="bg-zinc-900">Approuvé</option>
              <option value="rejected" className="bg-zinc-900">Refusé</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/30 mb-1 block">Score min</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))}
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/30 mb-1 block">Score max</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.maxScore}
              onChange={(e) => setFilters((f) => ({ ...f, maxScore: e.target.value }))}
              placeholder="100"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/3 animate-pulse" />
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <p className="font-mono">Aucune analyse trouvée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {analyses.map((a) => {
            const localFeedback = feedbacks[a.id]
            const status = localFeedback?.status || a.status
            const isExpanded = expandedId === a.id
            const result = a.result_json ? JSON.parse(a.result_json) : null

            return (
              <div
                key={a.id}
                className="rounded-xl border border-white/8 bg-white/3 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors"
                >
                  {/* Score */}
                  <div
                    className="text-lg font-mono font-bold w-12 shrink-0"
                    style={{ color: getScoreColor(a.score) }}
                  >
                    {a.score}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-mono', getScoreBg(a.score))}>
                        {getNiveauLabel(a.niveau as NiveauRisque)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-mono">
                        {PLATFORM_LABELS[a.platform]}
                      </span>
                      {status === 'approved' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/20 text-green-400">
                          ✓ Approuvé
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-red-400">
                          ✗ Refusé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/50 truncate">{a.script_preview}</p>
                  </div>

                  {/* Date */}
                  <div className="shrink-0 text-xs text-white/20 font-mono">
                    {new Date(a.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </div>

                  <ChevronDown
                    className={cn('w-4 h-4 text-white/20 shrink-0 transition-transform', isExpanded && 'rotate-180')}
                  />
                </button>

                {isExpanded && result && (
                  <div className="border-t border-white/5 p-4 space-y-4">
                    <p className="text-sm text-white/60">{a.resume}</p>

                    {result.problemes?.length > 0 && (
                      <div className="space-y-2">
                        {result.problemes.map(
                          (p: { type: string; texte: string; suggestion: string }, i: number) => (
                            <div key={i} className="rounded-lg bg-white/3 border border-white/5 p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-white/30">{p.type}</span>
                              </div>
                              <p className="text-sm text-white/50 italic mb-2">&ldquo;{p.texte}&rdquo;</p>
                              <p className="text-xs text-green-400/70">→ {p.suggestion}</p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {status === 'pending' && (
                      <div>
                        <p className="text-xs text-white/30 mb-2">Ce script a-t-il été approuvé ?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFeedback(a.id, 'approved')}
                            className="flex-1 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 text-xs hover:bg-green-500/25 transition-colors"
                          >
                            ✓ Approuvé
                          </button>
                          <button
                            onClick={() => handleFeedback(a.id, 'rejected')}
                            className="flex-1 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs hover:bg-red-500/25 transition-colors"
                          >
                            ✗ Refusé
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/50 disabled:opacity-30"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm text-white/30 font-mono">
            {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/50 disabled:opacity-30"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
