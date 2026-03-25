'use client'

import { useEffect, useState } from 'react'
import { getScoreColor, cn } from '@/lib/utils'

interface Stats {
  total: number
  approved: number
  rejected: number
  pending: number
  avgScore: number
  byPlatform: { google: number; meta: number; both: number }
  byNiveau: { FAIBLE: number; MODÉRÉ: number; ÉLEVÉ: number; CRITIQUE: number }
  realRefusalRate: number | null
}

const niveauColors: Record<string, string> = {
  FAIBLE: '#22c55e',
  MODÉRÉ: '#f59e0b',
  ÉLEVÉ: '#ef4444',
  CRITIQUE: '#dc2626',
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/3 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const feedbackTotal = stats.approved + stats.rejected
  const predictedHighRisk = stats.total > 0
    ? Math.round(((stats.byNiveau.ÉLEVÉ + stats.byNiveau.CRITIQUE) / stats.total) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold text-white">Statistiques</h1>
        <p className="text-white/30 text-sm mt-1">Vue globale de vos analyses</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total analyses" value={stats.total} />
        <StatCard
          label="Score moyen"
          value={stats.avgScore}
          suffix="/100"
          color={getScoreColor(stats.avgScore)}
        />
        <StatCard
          label="Taux refus réel"
          value={stats.realRefusalRate !== null ? `${stats.realRefusalRate}%` : '—'}
          sublabel={feedbackTotal > 0 ? `sur ${feedbackTotal} feedbacks` : 'pas encore de feedback'}
          color="#ef4444"
        />
        <StatCard
          label="Risque prédit élevé"
          value={`${predictedHighRisk}%`}
          sublabel="scores > 60"
          color="#f59e0b"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Par plateforme */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-5">
          <h2 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-4">
            Par plateforme
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byPlatform).map(([platform, count]) => (
              <BarRow
                key={platform}
                label={platform === 'both' ? 'Les deux' : platform === 'google' ? 'Google Ads' : 'Meta Ads'}
                count={count}
                total={stats.total}
                color="#8b5cf6"
              />
            ))}
          </div>
        </div>

        {/* Par niveau */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-5">
          <h2 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-4">
            Par niveau de risque
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byNiveau).map(([niveau, count]) => (
              <BarRow
                key={niveau}
                label={niveau}
                count={count}
                total={stats.total}
                color={niveauColors[niveau]}
              />
            ))}
          </div>
        </div>

        {/* Feedback loop */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-5 sm:col-span-2">
          <h2 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-4">
            Feedback loop
          </h2>
          {feedbackTotal === 0 ? (
            <p className="text-sm text-white/30 text-center py-4">
              Aucun feedback encore. Marquez vos analyses comme approuvées ou refusées pour calibrer l&apos;IA.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-green-400">{stats.approved}</p>
                <p className="text-xs text-white/30 mt-1">Approuvés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-red-400">{stats.rejected}</p>
                <p className="text-xs text-white/30 mt-1">Refusés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-white/40">{stats.pending}</p>
                <p className="text-xs text-white/30 mt-1">En attente</p>
              </div>
            </div>
          )}
          {stats.realRefusalRate !== null && feedbackTotal >= 5 && (
            <div className={cn(
              'mt-4 rounded-lg p-3 text-sm text-center',
              stats.realRefusalRate > predictedHighRisk
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            )}>
              {stats.realRefusalRate > predictedHighRisk
                ? `⚠️ Taux de refus réel (${stats.realRefusalRate}%) supérieur au risque prédit (${predictedHighRisk}%) — l'IA sous-estime peut-être les risques`
                : `✓ Taux de refus réel (${stats.realRefusalRate}%) cohérent avec le risque prédit (${predictedHighRisk}%)`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  sublabel,
  color,
}: {
  label: string
  value: string | number
  suffix?: string
  sublabel?: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <p className="text-xs font-mono text-white/30 mb-2">{label}</p>
      <p className="text-2xl font-mono font-bold" style={{ color: color || '#fff' }}>
        {value}
        {suffix && <span className="text-sm text-white/30">{suffix}</span>}
      </p>
      {sublabel && <p className="text-xs text-white/20 mt-1">{sublabel}</p>}
    </div>
  )
}

function BarRow({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/50 font-mono">{label}</span>
        <span className="text-white/30 font-mono">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
