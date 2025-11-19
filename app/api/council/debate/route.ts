import { streamText } from "ai"
import { createDebate, saveDebateResponse, completeDebate, getDebateResponses, getCouncilAdvisors, incrementCouncilUsage } from "@/lib/council/db"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { userId, councilId, question, threadId } = await req.json()
    
    if (!userId || !councilId || !question) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create debate
    const debate = await createDebate(userId, councilId, question, threadId)
    
    // Get council advisors
    const advisors = await getCouncilAdvisors(councilId)
    
    if (advisors.length === 0) {
      return Response.json({ error: 'No advisors found for council' }, { status: 400 })
    }
    
    // Increment council usage
    await incrementCouncilUsage(councilId)
    
    // Stream debate responses
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send debate ID first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'debate_id', debate_id: debate.id })}\n\n`))
          
          // Send advisor info
          const advisorInfo = advisors.map(a => ({
            name: a.display_name,
            archetype: a.archetype,
            icon: a.display_name.includes('Visionary') ? '🚀' : 
                  a.display_name.includes('Guardian') ? '🛡️' :
                  a.display_name.includes('Sage') ? '🧙' : '⭐'
          }))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'advisors', advisors: advisorInfo })}\n\n`))
          
          // Run 3 rounds of debate
          for (let round = 1; round <= 3; round++) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'round_start', round })}\n\n`))
            
            // Get context from previous rounds
            const previousRounds = round > 1 ? await getDebateResponses(debate.id) : []
            const context = previousRounds.length > 0 
              ? `\n\nPREVIOUS ROUNDS:\n${previousRounds.map(r => `Round ${r.round_number} - ${r.advisor_name}: ${r.content}`).join('\n\n')}`
              : ''
            
            // Each advisor responds
            for (const advisor of advisors) {
              const roundPrompt = round === 1 
                ? `Give your opening statement on: "${question}"${context}`
                : round === 2
                ? `Provide your rebuttal and deeper analysis on: "${question}"${context}`
                : `Give your final thoughts and make one specific, measurable prediction about the outcome.${context}`
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'advisor_start', advisor: advisor.display_name, round })}\n\n`))
              
              let fullResponse = ''
              const result = streamText({
                model: advisor.model,
                system: advisor.system_prompt,
                prompt: roundPrompt,
                maxTokens: 400,
                temperature: 0.7,
              })
              
              for await (const chunk of result.textStream) {
                fullResponse += chunk
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'text', 
                  advisor: advisor.display_name,
                  content: chunk,
                  round
                })}\n\n`))
              }
              
              // Save response to database
              await saveDebateResponse(
                debate.id,
                advisor.archetype,
                advisor.display_name,
                round,
                fullResponse,
                advisor.model
              )
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'advisor_end', advisor: advisor.display_name, round })}\n\n`))
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'round_end', round })}\n\n`))
          }
          
          // Generate final verdict/synthesis
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'verdict_start' })}\n\n`))
          
          const allResponses = await getDebateResponses(debate.id)
          const debateContext = allResponses.map(r => 
            `${r.advisor_name} (Round ${r.round_number}): ${r.content}`
          ).join('\n\n')
          
          let verdict = ''
          const verdictResult = streamText({
            model: "openai/gpt-4o",
            system: `You are The Verdict, the final synthesizer of The Council's debate. Analyze all advisor perspectives and provide a balanced final recommendation.`,
            prompt: `Based on this Council debate, provide The Verdict with these sections:

CONSENSUS POINTS: What did the advisors agree on?
KEY DISAGREEMENTS: Where did they differ?
RECOMMENDED ACTION: What should be done?
CONFIDENCE LEVEL: How confident is this recommendation (0-100%)?

DEBATE TRANSCRIPT:
${debateContext}

Question: ${question}`,
            maxTokens: 600,
            temperature: 0.6,
          })
          
          for await (const chunk of verdictResult.textStream) {
            verdict += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'verdict', content: chunk })}\n\n`))
          }
          
          // Complete debate
          await completeDebate(debate.id, verdict)
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'verdict_end' })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('[v0] Debate stream error:', error)
          controller.error(error)
        }
      },
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[v0] Debate API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
