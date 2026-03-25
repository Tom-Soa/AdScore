'use client'

import { useState } from 'react'
import { ChevronDown, AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react'
import { Probleme } from '@/types/analysis'
import { cn } from '@/lib/utils'

const graviteConfig = {
  faible: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  moyen: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  élevé: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    badge: 'bg-orange-500/20 text-orange-300',
  },
  critique: {
    icon: Zap,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    badge: 'bg-red-500/20 text-red-300',
  },
}

interface ProblemeCardProps {
  probleme: Probleme
  index: number
}

export function ProblemeCard({ probleme, index }: ProblemeCardProps) {
  const [open, setOpen] = useState(index === 0)
  const config = graviteConfig[probleme.gravite] || graviteConfig.moyen
  const Icon = config.icon

  return (
    <div className={cn('rounded-lg border', config.bg)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <Icon className={cn('mt-0.5 shrink-0 w-4 h-4', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full', config.badge)}>
              {probleme.type}
            </span>
            <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full', config.badge)}>
              {probleme.gravite}
            </span>
          </div>
          <blockquote className="mt-2 text-sm text-white/70 italic border-l-2 border-white/20 pl-3">
            &ldquo;{probleme.texte}&rdquo;
          </blockquote>
        </div>
        <ChevronDown
          className={cn('shrink-0 w-4 h-4 text-white/40 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1">
              Pourquoi c&apos;est problématique
            </p>
            <p className="text-sm text-white/70">{probleme.explication}</p>
          </div>
          <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
            <p className="text-xs font-mono text-green-400/60 uppercase tracking-wider mb-1">
              Suggestion de réécriture
            </p>
            <p className="text-sm text-green-300">{probleme.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}
