'use client'

import { useState } from 'react'
import { CheckCircle, Lightbulb, RotateCcw, Copy, Check } from 'lucide-react'
import { ScoreGauge } from './ScoreGauge'
import { ProblemeCard } from './ProblemeCard'
import { AnalysisResult as AnalysisResultType } from '@/types/analysis'
import { Platform } from '@/types/analysis'
import { cn } from '@/lib/utils'

interface AnalysisResultProps {
  result: AnalysisResultType
  analysisId?: string
  script: string
  platform: Platform
  onFeedback?: (status: 'approved' | 'rejected', reason?: string) => void
  feedbackStatus?: 'pending' | 'approved' | 'rejected'
}

export function AnalysisResultPanel({
  result,
  analysisId,
  script,
  platform,
  onFeedback,
  feedbackStatus = 'pending',
}: AnalysisResultProps) {
  const [rewriting, setRewriting] = useState(false)
  const [rewrittenScript, setRewrittenScript] = useState('')
  const [copied, setCopied] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackReason, setFeedbackReason] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const handleRewrite = async () => {
    setRewriting(true)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, platform, analysis: result }),
      })
      const data = await res.json()
      setRewrittenScript(data.rewrittenScript)
    } catch (e) {
      console.error(e)
    } finally {
      setRewriting(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rewrittenScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = async (status: 'approved' | 'rejected') => {
    if (!analysisId) return
    setSubmittingFeedback(true)
    try {
      await fetch(`/api/analyses/${analysisId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback_reason: feedbackReason || null }),
      })
      onFeedback?.(status, feedbackReason)
      setFeedbackOpen(false)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="flex flex-col items-center py-4">
        <ScoreGauge score={result.score_risque} niveau={result.niveau} size={180} />
        <p className="mt-4 text-center text-white/60 text-sm max-w-sm">{result.resume}</p>
      </div>

      {/* Problemes */}
      {result.problemes.length > 0 && (
        <div>
          <h3 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
            Problèmes identifiés ({result.problemes.length})
          </h3>
          <div className="space-y-2">
            {result.problemes.map((p, i) => (
              <ProblemeCard key={i} probleme={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Points positifs */}
      {result.points_positifs.length > 0 && (
        <div className="rounded-lg bg-green-500/5 border border-green-500/15 p-4">
          <h3 className="text-xs font-mono text-green-400/60 uppercase tracking-wider mb-3">
            Points positifs
          </h3>
          <ul className="space-y-2">
            {result.points_positifs.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-300/80">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conseil global */}
      <div className="rounded-lg bg-violet-500/5 border border-violet-500/15 p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-violet-400" />
          <div>
            <h3 className="text-xs font-mono text-violet-400/60 uppercase tracking-wider mb-1">
              Conseil global
            </h3>
            <p className="text-sm text-white/70">{result.conseil_global}</p>
          </div>
        </div>
      </div>

      {/* Réécriture automatique */}
      <div>
        {!rewrittenScript ? (
          <button
            onClick={handleRewrite}
            disabled={rewriting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors font-mono text-sm disabled:opacity-50"
          >
            <RotateCcw className={cn('w-4 h-4', rewriting && 'animate-spin')} />
            {rewriting ? 'Réécriture en cours...' : 'Réécrire le script complet'}
          </button>
        ) : (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5">
            <div className="flex items-center justify-between p-3 border-b border-violet-500/10">
              <span className="text-xs font-mono text-violet-400/60 uppercase tracking-wider">
                Script réécrit
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="p-4 text-sm text-white/70 whitespace-pre-wrap font-sans">
              {rewrittenScript}
            </pre>
            <div className="p-3 border-t border-violet-500/10">
              <button
                onClick={() => setRewrittenScript('')}
                className="text-xs text-white/30 hover:text-white/50"
              >
                Masquer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback loop */}
      {analysisId && (
        <div className="border-t border-white/5 pt-4">
          {feedbackStatus === 'pending' ? (
            <div>
              <p className="text-xs font-mono text-white/30 mb-3 text-center">
                Ce script a-t-il été approuvé par la plateforme ?
              </p>
              {!feedbackOpen ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback('approved')}
                    className="flex-1 py-2 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 text-sm hover:bg-green-500/25 transition-colors"
                  >
                    ✓ Approuvé
                  </button>
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="flex-1 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-sm hover:bg-red-500/25 transition-colors"
                  >
                    ✗ Refusé
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={feedbackReason}
                    onChange={(e) => setFeedbackReason(e.target.value)}
                    placeholder="Raison du refus (optionnel)..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-red-500/40"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback('rejected')}
                      disabled={submittingFeedback}
                      className="flex-1 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-sm hover:bg-red-500/25 transition-colors disabled:opacity-50"
                    >
                      Confirmer le refus
                    </button>
                    <button
                      onClick={() => setFeedbackOpen(false)}
                      className="px-4 py-2 rounded-lg text-white/30 text-sm hover:text-white/50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                'text-center text-sm py-2 rounded-lg',
                feedbackStatus === 'approved'
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-red-400 bg-red-500/10'
              )}
            >
              {feedbackStatus === 'approved' ? '✓ Marqué comme approuvé' : '✗ Marqué comme refusé'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
