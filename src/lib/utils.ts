import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateScript(script: string, maxLength = 200): string {
  if (script.length <= maxLength) return script
  return script.substring(0, maxLength) + '...'
}

export function getScoreColor(score: number): string {
  if (score <= 30) return '#22c55e'
  if (score <= 60) return '#f59e0b'
  if (score <= 80) return '#ef4444'
  return '#dc2626'
}

export function getScoreBg(score: number): string {
  if (score <= 30) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (score <= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (score <= 80) return 'bg-red-500/20 text-red-400 border-red-500/30'
  return 'bg-red-600/20 text-red-300 border-red-600/30'
}

export function getNiveauLabel(niveau: string): string {
  const labels: Record<string, string> = {
    FAIBLE: 'Risque faible',
    MODÉRÉ: 'Risque modéré',
    ÉLEVÉ: 'Risque élevé',
    CRITIQUE: 'Risque critique',
  }
  return labels[niveau] || niveau
}
