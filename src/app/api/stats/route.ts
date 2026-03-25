import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('analyses')
    .select('score, niveau, platform, status')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = data.length
  const approved = data.filter((a) => a.status === 'approved').length
  const rejected = data.filter((a) => a.status === 'rejected').length
  const pending = data.filter((a) => a.status === 'pending').length

  const avgScore = total > 0 ? Math.round(data.reduce((sum, a) => sum + a.score, 0) / total) : 0

  const byPlatform = {
    google: data.filter((a) => a.platform === 'google').length,
    meta: data.filter((a) => a.platform === 'meta').length,
    both: data.filter((a) => a.platform === 'both').length,
  }

  const byNiveau = {
    FAIBLE: data.filter((a) => a.niveau === 'FAIBLE').length,
    MODÉRÉ: data.filter((a) => a.niveau === 'MODÉRÉ').length,
    ÉLEVÉ: data.filter((a) => a.niveau === 'ÉLEVÉ').length,
    CRITIQUE: data.filter((a) => a.niveau === 'CRITIQUE').length,
  }

  // Real refusal rate among analyzed scripts that got feedback
  const withFeedback = data.filter((a) => a.status !== 'pending')
  const realRefusalRate =
    withFeedback.length > 0 ? Math.round((rejected / withFeedback.length) * 100) : null

  return NextResponse.json({
    total,
    approved,
    rejected,
    pending,
    avgScore,
    byPlatform,
    byNiveau,
    realRefusalRate,
  })
}
