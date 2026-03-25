'use client'

import { useState } from 'react'
import { Loader2, ScanLine, Sparkles } from 'lucide-react'
import { Platform, AnalysisResult } from '@/types/analysis'
import { cn } from '@/lib/utils'

interface AnalyzeFormProps {
  onResult: (result: AnalysisResult, id?: string, script?: string, platform?: Platform) => void
}

const PLATFORMS: { value: Platform; label: string; sublabel: string; color: string }[] = [
  { value: 'google', label: 'Google', sublabel: 'Ads', color: '#4285F4' },
  { value: 'meta', label: 'Meta', sublabel: 'Ads', color: '#0866FF' },
  { value: 'both', label: 'Les', sublabel: 'deux', color: '#8b5cf6' },
]

const EXAMPLE_SCRIPT = `Perdez 10kg en 2 semaines GARANTI ou remboursé ! 🔥
Cette méthode révolutionnaire que les médecins ne veulent pas vous montrer...
Plus de 50 000 clients satisfaits ont déjà transformé leur corps.
OFFRE EXCEPTIONNELLE : -70% seulement pour les 100 premiers inscrits !
Avant : 297€ → Maintenant : 89€
⚠️ Il ne reste que 3 places disponibles. Après minuit, le prix remonte.
Rejoignez maintenant et obtenez des résultats GARANTIS en moins de 14 jours !`

export function AnalyzeForm({ onResult }: AnalyzeFormProps) {
  const [script, setScript] = useState('')
  const [platform, setPlatform] = useState<Platform>('both')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!script.trim() || loading) return
    setError('')
    setLoading(true)

    try {
      const historyRes = await fetch('/api/analyses?status=rejected&limit=10')
      const historyData = await historyRes.json()
      const refusHistory = (historyData.analyses || [])
        .slice(0, 5)
        .map((a: { feedback_reason: string | null; resume: string }) =>
          a.feedback_reason ? `${a.resume} — Raison refus: ${a.feedback_reason}` : a.resume
        )
        .filter(Boolean)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, platform, refusHistory }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
      onResult(data.result, data.id, script, platform)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    } finally {
      setLoading(false)
    }
  }

  const charCount = script.length
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Platform selector */}
      <div>
        <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em] mb-3 block">
          Plateforme cible
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlatform(p.value)}
              className={cn(
                'relative py-3 px-2 rounded-xl border text-center transition-all duration-200 overflow-hidden group',
                platform === p.value
                  ? 'border-transparent'
                  : 'border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4'
              )}
              style={
                platform === p.value
                  ? {
                      background: `linear-gradient(135deg, ${p.color}22, ${p.color}10)`,
                      borderColor: `${p.color}50`,
                      boxShadow: `0 0 20px ${p.color}15, inset 0 1px 0 ${p.color}25`,
                    }
                  : {}
              }
            >
              {platform === p.value && (
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${p.color}30 0%, transparent 70%)`,
                  }}
                />
              )}
              <span
                className="block font-mono font-bold text-base leading-none"
                style={{ color: platform === p.value ? p.color : 'rgba(255,255,255,0.35)' }}
              >
                {p.label}
              </span>
              <span
                className="block font-mono text-[10px] mt-0.5"
                style={{ color: platform === p.value ? `${p.color}cc` : 'rgba(255,255,255,0.2)' }}
              >
                {p.sublabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Script textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em]">
            Script publicitaire
          </label>
          <button
            type="button"
            onClick={() => setScript(EXAMPLE_SCRIPT)}
            className="flex items-center gap-1 text-[10px] font-mono text-violet-500/50 hover:text-violet-400 transition-colors"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Exemple
          </button>
        </div>

        <div
          className={cn(
            'relative rounded-xl border transition-all duration-200',
            focused
              ? 'border-violet-500/30 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]'
              : 'border-white/8'
          )}
          style={{ background: '#0c0c0f' }}
        >
          {/* Corner accent */}
          <div className="absolute top-0 left-0 w-6 h-6 overflow-hidden rounded-tl-xl">
            <div
              className="absolute top-0 left-0 w-px h-full opacity-40"
              style={{ background: focused ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
            />
            <div
              className="absolute top-0 left-0 h-px w-full opacity-40"
              style={{ background: focused ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
            />
          </div>

          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Collez votre script publicitaire ici..."
            rows={10}
            className="textarea-dark w-full rounded-xl p-4 text-sm resize-none focus:outline-none font-sans leading-relaxed"
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.82)',
              caretColor: '#8b5cf6',
            }}
          />

          {/* Bottom stats bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/20">
                {charCount.toLocaleString()} car.
              </span>
              {wordCount > 0 && (
                <span className="text-[10px] font-mono text-white/20">
                  {wordCount} mots
                </span>
              )}
            </div>
            {script.length > 0 && (
              <button
                type="button"
                onClick={() => setScript('')}
                className="text-[10px] font-mono text-white/15 hover:text-white/35 transition-colors"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-950/60 border border-red-500/20 p-3">
          <span className="text-red-400 text-xs mt-0.5">✕</span>
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!script.trim() || loading}
        className={cn(
          'w-full relative flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-mono text-sm font-bold transition-all duration-200 overflow-hidden',
          !script.trim() || loading
            ? 'cursor-not-allowed'
            : 'hover:shadow-[0_4px_24px_rgba(139,92,246,0.3)] active:scale-[0.99]'
        )}
        style={
          !script.trim() || loading
            ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)' }
            : {
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                border: '1px solid rgba(139,92,246,0.4)',
                color: '#fff',
                boxShadow: '0 2px 12px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              }
        }
      >
        {/* Shimmer effect on active */}
        {script.trim() && !loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        )}
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <ScanLine className="w-4 h-4" />
            Analyser le script
          </>
        )}
      </button>
    </form>
  )
}
