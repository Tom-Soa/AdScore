import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform')
  const status = searchParams.get('status')
  const minScore = searchParams.get('minScore')
  const maxScore = searchParams.get('maxScore')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  let query = supabase
    .from('analyses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (platform && platform !== 'all') query = query.eq('platform', platform)
  if (status && status !== 'all') query = query.eq('status', status)
  if (minScore) query = query.gte('score', parseInt(minScore))
  if (maxScore) query = query.lte('score', parseInt(maxScore))

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ analyses: data, total: count, page, limit })
}
