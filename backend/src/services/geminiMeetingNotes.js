import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai'
import { env } from '../config/env.js'

let ai = null
function getAi() {
  if (!ai && env.geminiApiKey) {
    ai = new GoogleGenAI({ apiKey: env.geminiApiKey })
  }
  return ai
}

const MEETING_NOTES_SYSTEM_INSTRUCTION = `Role: You are a Financial Planning Meeting Analyst.

Objective: Analyse a meeting transcript between a financial advisor and their client. Cross-reference this with the client's actual financial data to produce structured, actionable meeting notes.

Data Inputs:
- Meeting Transcript (provided by the user)
- Risk Profile Description
- Asset Allocation
- Cashflow
- Plans Held

Output Requirements:
- Key Takeaways: Summarise the main discussion points from the meeting in clear, concise bullet-point form.
- Action Items: Extract specific, concrete next steps that the advisor or client committed to. If none were explicitly stated, infer reasonable ones from the discussion.
- Financial Insights: Cross-reference what was discussed in the meeting against the client's actual financial data. Highlight any discrepancies, opportunities, or concerns that the advisor should be aware of. This is the most important section.

- Ensure response is as concise as possible.
- Do NOT hallucinate data — only reference financial figures from the provided data inputs.`

function buildMeetingNotesContents(params) {
  return [
    {
      role: 'user',
      parts: [
        {
          text: `Meeting Transcript:
${params.transcript}

Client Financial Context:
- Risk Profile Description: ${params.riskProfileDescription}
- Asset Allocation: ${params.assetAllocation}
- Cashflow: ${params.cashflow}
- Plans Held: ${params.plansHeld}`,
        },
      ],
    },
  ]
}

export async function generateMeetingNotes(params) {
  if (!env.geminiApiKey) {
    return {
      'Key Takeaways': 'AI functions are currently disabled to save tokens.',
      'Action Items': 'AI functions are currently disabled to save tokens.',
      'Financial Insights': 'AI functions are currently disabled to save tokens.',
    }
  }

  const schema = {
    type: Type.OBJECT,
    required: ['Key Takeaways', 'Action Items', 'Financial Insights'],
    properties: {
      'Key Takeaways': { type: Type.STRING },
      'Action Items': { type: Type.STRING },
      'Financial Insights': { type: Type.STRING },
    },
  }

  const config = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
    responseSchema: schema,
    systemInstruction: [{ text: MEETING_NOTES_SYSTEM_INSTRUCTION }],
  }

  const activeAi = getAi()
  const res = await activeAi.models.generateContent({
    model: env.geminiModel,
    config,
    contents: buildMeetingNotesContents(params),
  })

  const text = res?.text ?? ''
  try {
    return JSON.parse(text)
  } catch {
    return { _raw: text }
  }
}
