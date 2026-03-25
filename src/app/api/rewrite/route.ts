import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { Platform, AnalysisResult } from '@/types/analysis'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { script, platform, analysis }: { script: string; platform: Platform; analysis: AnalysisResult } =
      await req.json()

    const platformLabel =
      platform === 'google'
        ? 'Google Ads'
        : platform === 'meta'
          ? 'Meta Ads'
          : 'Google Ads et Meta Ads'

    const problemsSummary = analysis.problemes
      .map((p) => `- ${p.type}: "${p.texte}" → ${p.suggestion}`)
      .join('\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: `Tu es un expert en copywriting publicitaire conforme aux règles de ${platformLabel}.
Réécris les scripts en conservant le message commercial tout en éliminant les problèmes de conformité.
Garde le même ton, la même structure et la même longueur approximative.
Réponds UNIQUEMENT avec le script réécrit, sans explication ni commentaire.`,
      messages: [
        {
          role: 'user',
          content: `Réécris ce script pour le rendre conforme à ${platformLabel}.

SCRIPT ORIGINAL :
${script}

PROBLÈMES IDENTIFIÉS À CORRIGER :
${problemsSummary}

Réécris le script en corrigeant ces problèmes tout en conservant l'impact commercial.`,
        },
      ],
    })

    const rewrittenScript = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ rewrittenScript })
  } catch (error) {
    console.error('Rewrite error:', error)
    return NextResponse.json({ error: 'Erreur lors de la réécriture' }, { status: 500 })
  }
}
