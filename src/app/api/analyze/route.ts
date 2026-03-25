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
      ? `SPÉCIFICITÉS GOOGLE ADS & YOUTUBE ADS :

CE QUI EST STRICTEMENT INTERDIT (refus automatique) :
- Allégations de santé sans preuve clinique ou approbation réglementaire (FDA/ANSM)
- Mots interdits en contexte santé : "guérit", "traite", "soigne", "élimine", "répare"
- Promesses de résultats garantis : "garanti", "100%", "résultats assurés", "vous perdrez X kg"
- Délais irréalistes : "en 24h", "en 2 semaines", "résultats immédiats"
- Fausse urgence avec compteurs : "offre expire dans X heures", "il reste X places" (surtout si fictif)
- Avant/après pour perte de poids, chirurgie esthétique, fitness
- Superlatifs non vérifiables : "le meilleur au monde", "n°1", "révolutionnaire", "unique au monde"
- Clickbait YouTube : titres/scripts conçus pour tromper sur le contenu ("Ce que les médecins cachent")
- Promesses financières irréalistes : "devenez riche", "gagnez X€ sans rien faire"
- Suspension de compte IMMÉDIATE sans avertissement pour violations graves

CE QUI EST TOLÉRÉ :
- Urgence réelle et vérifiable ("promotion jusqu'au 31 décembre")
- Témoignages avec disclaimer légal ("résultats non représentatifs")
- "Peut aider à", "conçu pour soutenir", "dans le cadre d'une alimentation équilibrée"
- Superlatifs avec contexte prouvable ("notre offre la plus populaire")
- Claims santé si documentation réglementaire disponible`

      : platform === 'meta'
        ? `SPÉCIFICITÉS META ADS (Facebook/Instagram) :

CE QUI EST STRICTEMENT INTERDIT (refus quasi-certain) :
- Allégations médicales directes : "guérit", "traite", "soigne", "diagnostique"
- Avant/après corps : transformation physique, perte de poids avant/après
- Messagerie négative sur le corps : suggérer que l'utilisateur est "incomplet", "laid", "en mauvaise santé"
- Promesses de résultats avec délai précis : "perdez 10kg en 2 semaines"
- Garanties absolues : "garanti ou remboursé" sur des résultats de santé
- Maladies graves : prétendre soigner cancer, diabète, Alzheimer, dépression

CE QUI EST TOLÉRÉ (Meta est plus permissif que Google sur ces points) :
- Urgence légère et réelle : "offre limitée", "places disponibles" (si vrai)
- Témoignages et avis clients avec disclaimer
- Superlatifs marketing classiques : "la meilleure méthode", "notre top produit"
- Résultats typiques avec nuance : "la plupart de nos clients constatent..."
- Promesses de résultats si formulées avec précaution ("peut vous aider à", "conçu pour")
- Scripts de coaching, business, formation : très permissif si pas d'allégation de santé
- FOMO léger : "rejoignez des milliers de clients satisfaits"
- Comparaisons générales sans nommer de concurrent

NOTE IMPORTANTE : Pour les scripts non liés à la santé/finances (coaching, e-commerce, services, SaaS), Meta est très permissif. Scorer avec indulgence sauf éléments clairement trompeurs.`

        : `ANALYSE COMPARATIVE GOOGLE ADS vs META ADS :

RÈGLE FONDAMENTALE : Google/YouTube est nettement plus strict que Meta.
Un script refusé sur Meta sera presque toujours refusé sur Google.
Un script accepté sur Google sera presque toujours accepté sur Meta.

DIFFÉRENCES CLÉS :
- Urgence : Meta tolère l'urgence légère. Google interdit les compteurs fictifs.
- Santé : Les deux sont stricts, mais Google exige des preuves réglementaires. Meta applique des restrictions visuelles/tonales.
- Superlatifs : Meta tolère "le meilleur". Google exige des preuves.
- Témoignages : Meta tolère avec disclaimer. Google est plus strict sur les preuves.
- Suspension : Google suspend immédiatement. Meta applique un processus graduel.
- Coaching/Services/Formation (hors santé) : Meta très permissif. Google modérément strict.

SCORING : Donne deux perspectives dans le conseil_global — ce qui passe sur Meta vs ce qui bloque sur Google.
Le score_risque reflète le risque sur la plateforme la plus stricte (Google).`

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
