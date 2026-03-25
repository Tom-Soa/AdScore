export type Platform = 'google' | 'meta' | 'both'

export type GraviteLevel = 'faible' | 'moyen' | 'élevé' | 'critique'

export type NiveauRisque = 'FAIBLE' | 'MODÉRÉ' | 'ÉLEVÉ' | 'CRITIQUE'

export interface Probleme {
  texte: string
  type: string
  gravite: GraviteLevel
  explication: string
  suggestion: string
}

export interface AnalysisResult {
  score_risque: number
  niveau: NiveauRisque
  resume: string
  problemes: Probleme[]
  points_positifs: string[]
  conseil_global: string
}

export interface AnalysisRecord {
  id: string
  created_at: string
  script_preview: string
  platform: Platform
  score: number
  niveau: NiveauRisque
  resume: string
  result_json: string
  status: 'pending' | 'approved' | 'rejected'
  feedback_reason: string | null
}

export interface AnalyzeRequest {
  script: string
  platform: Platform
  refusHistory?: string[]
}

export interface CompareRequest {
  scriptA: string
  scriptB: string
  platform: Platform
}
