import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AnalyzeRequest, AnalysisResult } from '@/types/analysis'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(platform: string, refusHistory: string[]): string {
  const platformContext =
    platform === 'google'
      ? 'Google Ads'
      : platform === 'meta'
        ? 'Meta Ads (Facebook/Instagram)'
        : 'Google Ads et Meta Ads (Facebook/Instagram)'

  const historyContext =
    refusHistory.length > 0
      ? `\n\nBASE DE REFUS RÉELS DE L'AGENCE (patterns à scorer plus sévèrement) :\n${refusHistory.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
      : ''

  return `Tu es un expert en conformité publicitaire pour ${platformContext} et YouTube Ads.
Analyse le script publicitaire et réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.

Format de réponse OBLIGATOIRE :
{
  "score_risque": <entier 0-100>,
  "niveau": "<FAIBLE|MODÉRÉ|ÉLEVÉ|CRITIQUE>",
  "resume": "<résumé en 1-2 phrases>",
  "problemes": [
    {
      "texte": "<extrait exact du script>",
      "type": "<catégorie>",
      "gravite": "<faible|moyen|élevé|critique>",
      "explication": "<pourquoi c'est problématique>",
      "suggestion": "<version réécrite conforme>"
    }
  ],
  "points_positifs": ["<point positif 1>", "<point positif 2>"],
  "conseil_global": "<conseil actionnable en 2-3 phrases>"
}

Catégories de problèmes : allégation santé non prouvée, promesse de résultats garantis, urgence artificielle/FOMO, comparaison déloyale, langage trompeur, ciblage sensible, témoignage douteux, avant/après interdit, vocabulaire financier risqué, superlatifs non conformes.

Règles de scoring :
- 0-30 : FAIBLE — script conforme, quelques ajustements mineurs
- 31-60 : MODÉRÉ — plusieurs points à corriger avant diffusion
- 61-80 : ÉLEVÉ — risque de refus important, révision nécessaire
- 81-100 : CRITIQUE — refus quasi-certain, réécriture complète recommandée
${historyContext}`
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json()
    const { script, platform, refusHistory = [] } = body

    if (!script || script.trim().length < 10) {
      return NextResponse.json({ error: 'Script trop court' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(platform, refusHistory)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyse ce script publicitaire pour ${platform === 'both' ? 'Google Ads et Meta Ads' : platform === 'google' ? 'Google Ads' : 'Meta Ads'} :\n\n${script}`,
        },
      ],
    })

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : ''

    let result: AnalysisResult
    try {
      result = JSON.parse(rawContent)
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid JSON response')
      result = JSON.parse(jsonMatch[0])
    }

    // Save to Supabase
    const scriptPreview = script.substring(0, 200) + (script.length > 200 ? '...' : '')
    const { data: savedAnalysis, error: dbError } = await supabase
      .from('analyses')
      .insert({
        script_preview: scriptPreview,
        platform,
        score: result.score_risque,
        niveau: result.niveau,
        resume: result.resume,
        result_json: JSON.stringify(result),
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB save error:', dbError)
    }

    return NextResponse.json({
      result,
      id: savedAnalysis?.id,
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 })
  }
}
