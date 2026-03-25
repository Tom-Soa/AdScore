'use client'

import { useState } from 'react'
import { AnalyzeForm } from '@/components/AnalyzeForm'
import { AnalysisResultPanel } from '@/components/AnalysisResult'
import { AnalysisResult, Platform } from '@/types/analysis'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analysisId, setAnalysisId] = useState<string | undefined>()
  const [currentScript, setCurrentScript] = useState('')
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('both')
  const [feedbackStatus, setFeedbackStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const handleResult = (res: AnalysisResult, id?: string, script?: string, platform?: Platform) => {
    setResult(res)
    setAnalysisId(id)
    setCurrentScript(script || '')
    setCurrentPlatform(platform || 'both')
    setFeedbackStatus('pending')
    setTimeout(() => {
      document.getElementById('result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[10px] font-mono text-violet-400/80 uppercase tracking-[0.15em]">
            Compliance AI
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-mono font-bold text-white leading-tight mb-3">
          Script
          <span
            className="inline-block ml-3"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Analyzer
          </span>
        </h1>
        <p className="text-white/35 text-sm max-w-sm mx-auto leading-relaxed">
          Détectez les risques de refus avant de diffuser vos publicités sur Google &amp; Meta
        </p>
      </div>

      {/* Grid */}
      <div className={cn('grid gap-6', result ? 'lg:grid-cols-2 items-start' : 'max-w-xl mx-auto')}>

        {/* Form card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-amber-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.15em] ml-1">
              Nouveau script
            </span>
          </div>
          <AnalyzeForm onResult={handleResult} />
        </div>

        {/* Result card */}
        {result && (
          <div
            id="result-panel"
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-500/80 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-violet-500/40" />
                <div className="w-2 h-2 rounded-full bg-violet-500/20" />
              </div>
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.15em] ml-1">
                Résultat
              </span>
            </div>
            <AnalysisResultPanel
              result={result}
              analysisId={analysisId}
              script={currentScript}
              platform={currentPlatform}
              feedbackStatus={feedbackStatus}
              onFeedback={(status) => setFeedbackStatus(status)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
