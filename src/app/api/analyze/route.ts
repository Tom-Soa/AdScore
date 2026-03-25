import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AnalyzeRequest, AnalysisResult } from '@/types/analysis'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(platform: string, refusHistory: string[]): string {
  const platformContext =
    platform === 'google'
      ? 'Google Ads et YouTube Ads'
      : platform === 'meta'
        ? 'Meta Ads (Facebook/Instagram)'
        : 'Google Ads, YouTube Ads et Meta Ads (Facebook/Instagram)'

  const platformGuidelines =
    platform === 'google'
      ? `SPÉCIFICITÉS GOOGLE ADS & YOUTUBE ADS (très strict) :
- Zéro tolérance pour les allégations de santé/perte de poids sans preuve clinique
- Interdit : "garanti", "résultats assurés", toute promesse de résultat chiffré
- Interdit : urgence artificielle ("plus que X places", "offre expire dans")
- Interdit : avant/après pour la perte de poids, chirurgie esthétique, fitness
- Interdit : superlatifs absolus non vérifiables ("le meilleur", "n°1", "révolutionnaire")
- Interdit : comparaisons avec des concurrents nommés sans preuve
- YouTube : règles encore plus strictes sur le contenu "clickbait" et les promesses financières
- Scoring : appliquer un malus de +15 points par rapport à Meta sur les mêmes éléments`
      : platform === 'meta'
        ? `SPÉCIFICITÉS META ADS (modérément strict) :
- Interdit : allégations de santé directes ("guérit", "traite", "soigne")
- Interdit : images avant/après pour la perte de poids
- Toléré avec nuances : urgence légère, témoignages avec disclaimer, résultats "typiques"
- Toléré : superlatifs si contexte clair (ex: "notre meilleure offre")
- Plus permissif que Google sur les promesses de résultats si formulées avec précaution
- Scoring : appliquer le barème standard`
        : `COMPARAISON DES PLATEFORMES :
Google Ads & YouTube Ads sont SIGNIFICATIVEMENT plus stricts que Meta.
- Un script acceptable sur Meta peut être refusé sur Google/YouTube
- Applique un malus de +15 points pour Google/YouTube vs Meta sur les mêmes éléments
- Identifie clairement dans chaque problème quelle plateforme est concernée
- Le score_risque doit refléter le risque sur la plateforme la plus stricte (Google/YouTube)`

  const historyContext =
    refusHistory.length > 0
      ? `\n\nBASE DE REFUS RÉELS DE L'AGENCE (patterns à scorer plus sévèrement) :\n${refusHistory.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
      : ''

  return `Tu es un expert en conformité publicitaire pour ${platformContext}.
Analyse le script publicitaire et réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.

${platformGuidelines}

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
      "explication": "<pourquoi c'est problématique sur ${platformContext}>",
      "suggestion": "<version réécrite conforme>"
    }
  ],
  "points_positifs": ["<point positif 1>", "<point positif 2>"],
  "conseil_global": "<conseil actionnable en 2-3 phrases>"
}

Catégories de problèmes : allégation santé non prouvée, promesse de résultats garantis, urgence artificielle/FOMO, comparaison déloyale, langage trompeur, ciblage sensible, témoignage douteux, avant/après interdit, vocabulaire financier risqué, superlatifs non conformes.

Règles de scoring (adaptées à la sévérité de la plateforme) :
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
      model: 'claude-haiku-4-5-20251001',
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
