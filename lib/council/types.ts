// Type definitions for The Council system

export interface Council {
  id: string
  user_id: string
  name: string
  description?: string
  type: 'custom' | 'quick' | 'preset'
  is_public: boolean
  uses_count: number
  created_at: Date
  updated_at: Date
}

export interface CouncilAdvisor {
  id: string
  council_id: string
  archetype: string
  display_name: string
  position: number
  ethics_score: number
  risk_score: number
  time_horizon_score: number
  ideology_score: number
  experience_score: number
  personality_preset?: string
  model: string
  system_prompt: string
  created_at: Date
}

export interface CouncilDebate {
  id: string
  council_id?: string
  user_id: string
  thread_id?: string
  question: string
  status: 'in_progress' | 'completed'
  verdict?: string
  created_at: Date
  completed_at?: Date
}

export interface CouncilDebateResponse {
  id: string
  debate_id: string
  advisor_archetype: string
  advisor_name: string
  round_number: number
  content: string
  model_used: string
  created_at: Date
}

export interface CouncilPrediction {
  id: string
  debate_id: string
  advisor_archetype: string
  advisor_name: string
  prediction_text: string
  confidence_score: number
  due_date: Date
  outcome: 'pending' | 'correct' | 'incorrect' | 'partial'
  verification_notes?: string
  verified_at?: Date
  created_at: Date
}

export interface CouncilVote {
  id: string
  debate_id: string
  user_id: string
  round_number: number
  advisor_archetype: string
  vote_type: 'agree' | 'disagree'
  created_at: Date
}

export interface AdvisorArchetype {
  id: string
  archetype_key: string
  display_name: string
  description: string
  category: 'executive' | 'wisdom' | 'creative' | 'life' | 'wild_card'
  default_icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  is_premium: boolean
  default_ethics: number
  default_risk: number
  default_time_horizon: number
  default_ideology: number
  default_experience: number
  created_at: Date
}

export interface SliderValues {
  ethics: number
  risk: number
  timeHorizon: number
  ideology: number
  experience: number
}
