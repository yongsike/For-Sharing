import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export interface RiskAnalysisParams {
  riskProfileCategory: string;
  investmentAllocation: string;
  cashflow: string;
  plansHeld: string;
}

export async function* generateRiskAnalysis({
  riskProfileCategory,
  investmentAllocation,
  cashflow,
  plansHeld,
}: RiskAnalysisParams) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not defined in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const model = 'gemini-3-flash-preview';

  const config = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ["Key Insights", "Potential Risks", "Recommendations"],
      properties: {
        "Key Insights": {
          type: Type.STRING,
        },
        "Potential Risks": {
          type: Type.STRING,
        },
        "Recommendations": {
          type: Type.STRING,
        },
      },
    },
    systemInstruction: [
      {
        text: `Role: You are a Financial Planning Consultant and Investment Analyst.

Objective: Synthesize data to determine if the client's current financial reality matches their stated risk appetite.

Data Inputs for Synthesis:
- Risk Profile Category: [e.g. Conservative, Balanced, Aggressive]
- Investment Allocation: [e.g. 60% Equities, 20% Fixed Income, 20% Cash]
- Cashflow: [e.g. Inflow, Outflow, Net]
- Plans Held: [e.g. Tax-advantaged accounts, Pensions, Insurance policies]

Analysis Requirements and Logic:
- Allocation Alignment: Does the current Asset Allocation match the volatility expected of their Risk Profile?
- Capacity vs. Tolerance: Does the client’s Cashflow provide the capacity to take the risk their Risk Profile suggests?
- Structural Analysis: Review Plans Held. Are there illiquid assets or locked-in plans that conflict with the client's need for flexibility?
- The "Gap": Identify the specific delta between where they are and where their profile says they should be.

Output:
- Key Insights: Bulleted insights based on synthesized data.
- Potential Risks: Any immediate dangers.
- Recommendations: Clear actions for the advisor to take.
- Ensure response is as concise as possible.`,
      }
    ],
  };

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Risk Profile Category: ${riskProfileCategory}
- Investment Allocation: ${investmentAllocation}
- Cashflow: ${cashflow}
- Plans Held: ${plansHeld}`,
        },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error('Error generating risk analysis:', error);
    throw error;
  }
}

export async function* generateRiskSummary({
  riskProfileCategory,
  investmentAllocation,
  cashflow,
  plansHeld,
}: RiskAnalysisParams) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not defined');

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  const config = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ["Executive Summary"],
      properties: {
        "Executive Summary": {
          type: Type.STRING,
        },
      },
    },
    systemInstruction: [
      {
        text: `Role: You are a Financial Planning Consultant and Investment Analyst.

Objective: Synthesize data to determine if the client's current financial reality matches their stated risk appetite.

Data Inputs for Synthesis:
- Risk Profile Category: [e.g. Conservative, Balanced, Aggressive]
- Investment Allocation: [e.g. 60% Equities, 20% Fixed Income, 20% Cash]
- Cashflow: [e.g. Inflow, Outflow, Net]
- Plans Held: [e.g. Tax-advantaged accounts, Pensions, Insurance policies]

Analysis Requirements and Logic:
- Allocation Alignment: Does the current Asset Allocation match the volatility expected of their Risk Profile?
- Capacity vs. Tolerance: Does the client’s Cashflow provide the capacity to take the risk their Risk Profile suggests?
- Structural Analysis: Review Plans Held. Are there illiquid assets or locked-in plans that conflict with the client's need for flexibility?
- The "Gap": Identify the specific delta between where they are and where their profile says they should be.

Output:
- Executive Summary: A 2-sentence executive summary of the client's risk alignment
- Ensure response is as concise as possible.`,
      }
    ],
  };

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Risk Profile Category: ${riskProfileCategory}
- Investment Allocation: ${investmentAllocation}
- Cashflow: ${cashflow}
- Plans Held: ${plansHeld}`,
        },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error('Error generating risk summary:', error);
    throw error;
  }
}
