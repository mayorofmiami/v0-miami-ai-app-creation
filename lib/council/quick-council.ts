// Quick Council: Auto-select advisors based on question analysis

interface QuestionAnalysis {
  domains: string[]
  suggestedAdvisors: string[]
}

const patterns = {
  business: /\b(revenue|profit|pricing|market|competitor|sales|customer|business|company|startup|strategy|growth)\b/gi,
  personal: /\b(should I|my girlfriend|my boyfriend|my job|my life|move to|quit|break up|marry|relationship|career)\b/gi,
  creative: /\b(design|art|style|aesthetic|color|layout|visual|brand|logo|creative|website|app)\b/gi,
  technical: /\b(code|architecture|database|API|scale|infrastructure|deploy|framework|programming|software)\b/gi,
  ethical: /\b(right|wrong|moral|ethical|should society|fair|just|values|principle)\b/gi,
  financial: /\b(invest|stock|crypto|portfolio|401k|savings|debt|loan|money|wealth)\b/gi,
}

export function analyzeQuestion(question: string): QuestionAnalysis {
  const domains: string[] = []
  
  // Test question against all patterns
  for (const [domain, pattern] of Object.entries(patterns)) {
    if (pattern.test(question)) {
      domains.push(domain)
    }
  }
  
  // Select advisors based on domains
  const advisors = selectAdvisorsForDomains(domains, question)
  
  return {
    domains,
    suggestedAdvisors: advisors
  }
}

function selectAdvisorsForDomains(domains: string[], question: string): string[] {
  // Default safe combination
  let advisors = ['sage', 'realist', 'contrarian']
  
  // Business questions
  if (domains.includes('business') || domains.includes('financial')) {
    advisors = ['visionary', 'guardian', 'realist']
  }
  
  // Personal questions
  else if (domains.includes('personal')) {
    advisors = ['counselor', 'mentor', 'sage']
  }
  
  // Creative questions
  else if (domains.includes('creative')) {
    advisors = ['artist', 'critic', 'craftsperson']
  }
  
  // Technical questions
  else if (domains.includes('technical')) {
    advisors = ['builder', 'realist', 'visionary']
  }
  
  // Ethical dilemmas
  else if (domains.includes('ethical')) {
    advisors = ['ethicist', 'sage', 'contrarian']
  }
  
  // Multi-domain questions get hybrid councils
  if (domains.length > 2) {
    advisors = ['sage', 'contrarian', 'realist'] // Generalists
  }
  
  // Always include a contrarian for debate quality
  if (!advisors.includes('contrarian')) {
    advisors[2] = 'contrarian'
  }
  
  return advisors
}
