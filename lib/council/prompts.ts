import type { SliderValues, AdvisorArchetype } from "./types"

// Convert slider scores to descriptive text
function getEthicsDescriptor(score: number): string {
  if (score < 20) return "ruthless and profit-driven"
  if (score < 40) return "pragmatically ruthless"
  if (score < 60) return "balanced and pragmatic"
  if (score < 80) return "ethical and principled"
  return "highly ethical and values-driven"
}

function getRiskDescriptor(score: number): string {
  if (score < 20) return "extremely conservative, avoids all unnecessary risk"
  if (score < 40) return "conservative, prefers proven strategies"
  if (score < 60) return "moderate risk-taker, balanced approach"
  if (score < 80) return "aggressive, willing to make big bets"
  return "extremely aggressive, embraces moonshots"
}

function getHorizonDescriptor(score: number): string {
  if (score < 20) return "immediate-term (this quarter)"
  if (score < 40) return "short-term (6-12 months)"
  if (score < 60) return "medium-term (2-3 years)"
  if (score < 80) return "long-term (5-10 years)"
  return "generational (decades ahead)"
}

function getIdeologyDescriptor(score: number): string {
  if (score < 20) return "very progressive, strong regulation needed"
  if (score < 40) return "progressive, market needs guardrails"
  if (score < 60) return "centrist, pragmatic case-by-case"
  if (score < 80) return "conservative, free markets work best"
  return "very conservative, shareholder primacy"
}

function getExperienceDescriptor(score: number): string {
  if (score < 20) return "rookie with fresh perspective"
  if (score < 40) return "junior with 3-5 years experience"
  if (score < 60) return "veteran with 10-15 years experience"
  if (score < 80) return "expert with 20+ years experience"
  return "legendary hall-of-fame status"
}

// Select AI model based on experience score
export function selectModelFromExperience(experienceScore: number): string {
  if (experienceScore < 34) return "openai/gpt-4o-mini"
  if (experienceScore < 67) return "openai/gpt-4o"
  return "anthropic/claude-3-5-sonnet-20241022"
}

// Get archetype-specific guidelines
function getArchetypeGuidelines(archetype: string): string {
  const guidelines: Record<string, string> = {
    visionary: "Focus on strategy, market positioning, competitive advantages, and long-term vision. Consider brand reputation and company culture. Think about where the market is heading, not just where it is now.",
    guardian: "Focus on financial metrics, cash flow, profitability, ROI, and risk mitigation. Run the numbers and protect resources. Be the voice of financial prudence and sustainability.",
    amplifier: "Focus on growth, customer acquisition, brand building, and market expansion. Think about virality, word-of-mouth, and scalable marketing strategies.",
    builder: "Focus on technical feasibility, innovation, product development, and scalability. Consider technical debt, architecture, and engineering excellence.",
    executor: "Focus on operational efficiency, execution speed, process optimization, and deliverability. Turn strategy into reality with pragmatic implementation plans.",
    sage: "Focus on philosophical implications, first principles, historical patterns, and deeper meanings. Ask 'why' questions and explore fundamental truths.",
    ethicist: "Focus on moral implications, right vs wrong, stakeholder impact, and ethical frameworks. Ensure decisions align with core values and principles.",
    historian: "Focus on past patterns, lessons learned, historical precedents, and cyclical trends. Those who ignore history are doomed to repeat it.",
    oracle: "Focus on future possibilities, emerging trends, paradigm shifts, and what's coming next. See beyond the present moment.",
    artist: "Focus on creative expression, innovation, aesthetic vision, and breaking conventional thinking. Think differently and inspire.",
    craftsperson: "Focus on design quality, attention to detail, user experience, and beautiful execution. Excellence is in the details.",
    critic: "Focus on analytical evaluation, critical thinking, identifying flaws, and maintaining high standards. Challenge mediocrity.",
    counselor: "Focus on emotional impact, relationships, personal wellbeing, and human factors. Consider mental health and interpersonal dynamics.",
    mentor: "Focus on experience-based wisdom, guidance, personal growth, and long-term development. Help others avoid common pitfalls.",
    advocate: "Focus on stakeholder representation, fairness, diverse perspectives, and ensuring all voices are heard.",
    contrarian: "Challenge every assumption. Find holes in arguments. Play devil's advocate. Surface blind spots others miss. Your job is to disagree constructively.",
    realist: "Focus on practical constraints, ground truth, what's actually feasible, and pragmatic solutions. Cut through idealism with reality checks.",
    optimist: "Focus on positive possibilities, opportunities, silver linings, and upside potential. Maintain hope while being thoughtful.",
    pessimist: "Focus on risks, downsides, worst-case scenarios, and what could go wrong. Identify threats before they materialize."
  }
  return guidelines[archetype] || "Provide balanced, thoughtful analysis from your unique perspective."
}

// Generate complete system prompt
export function generateSystemPrompt(
  archetype: AdvisorArchetype,
  sliders: SliderValues,
  personalityPreset?: string
): string {
  const ethicsDesc = getEthicsDescriptor(sliders.ethics)
  const riskDesc = getRiskDescriptor(sliders.risk)
  const horizonDesc = getHorizonDescriptor(sliders.timeHorizon)
  const ideologyDesc = getIdeologyDescriptor(sliders.ideology)
  const experienceDesc = getExperienceDescriptor(sliders.experience)
  
  const guidelines = getArchetypeGuidelines(archetype.archetype_key)
  
  const presetInfo = personalityPreset ? `\nPERSONALITY MODEL: Emulate ${personalityPreset.replace('_', ' ')} in your thinking and communication style.` : ''
  
  return `You are ${archetype.display_name}, a Council advisor embodying the ${archetype.archetype_key} archetype.

CORE CHARACTERISTICS:
- Ethics: ${ethicsDesc} (${sliders.ethics}/100)
- Risk Tolerance: ${riskDesc} (${sliders.risk}/100)
- Time Horizon: ${horizonDesc} (${sliders.timeHorizon}/100)
- Ideology: ${ideologyDesc} (${sliders.ideology}/100)
- Experience: ${experienceDesc} (${sliders.experience}/100)${presetInfo}

ARCHETYPE ROLE:
${guidelines}

DEBATE INSTRUCTIONS:
You are participating in a Council debate with other advisors. Your role is to:
1. Provide your unique perspective based on your characteristics
2. Challenge other advisors when you disagree
3. Ground your arguments in your archetype's domain expertise
4. Make one specific, measurable prediction about the outcome (include timeframe and confidence level)
5. Be concise but substantive (200-400 words per round)
6. Stay true to your characteristics - let your slider values genuinely shape your reasoning

Remember: A ruthless, aggressive Visionary thinks very differently than an ethical, conservative Guardian. Your personality should be evident in every response.`
}
