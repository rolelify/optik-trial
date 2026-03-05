import { GoogleGenAI, Type, Schema } from '@google/genai';
import { MOATSCORE_SYSTEM_PROMPT, buildMoatScoreUserPrompt, JSON_REPAIR_PROMPT } from './prompts';
import { MoatScoreResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_score: { type: Type.NUMBER },
    vectors: {
      type: Type.OBJECT,
      properties: {
        clear_wedge: { type: Type.NUMBER },
        distribution_hooks: { type: Type.NUMBER },
        workflow_lock_in: { type: Type.NUMBER },
        data_flywheel: { type: Type.NUMBER },
        switching_costs: { type: Type.NUMBER },
        trust_and_risk: { type: Type.NUMBER },
        differentiation: { type: Type.NUMBER },
        monetization_power: { type: Type.NUMBER }
      }
    },
    moat_delta: {
      type: Type.OBJECT,
      properties: {
        strengthened: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vector: { type: Type.STRING },
              reason: { type: Type.STRING },
              evidence: { type: Type.STRING }
            }
          }
        },
        weakened: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vector: { type: Type.STRING },
              reason: { type: Type.STRING },
              evidence: { type: Type.STRING }
            }
          }
        }
      }
    },
    top_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    quick_wins: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommended_experiments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hypothesis: { type: Type.STRING },
          change: { type: Type.STRING },
          expected_impact: { type: Type.STRING },
          effort: { type: Type.STRING, enum: ['S', 'M', 'L'] }
        }
      }
    },
    confidence: { type: Type.NUMBER }
  },
  required: [
    'overall_score', 'vectors', 'moat_delta', 'top_issues', 
    'quick_wins', 'recommended_experiments', 'confidence'
  ]
};

export async function runMoatScore(images: { mobile: string, desktop: string }, domSummary: { mobile: string, desktop: string }, diffText?: string): Promise<MoatScoreResult> {
  console.log('Building MoatScore system and user prompts...');
  const userPrompt = buildMoatScoreUserPrompt({
    pageUrl: 'Preview URL', // Generic passed in, we don't strictly require url here for Gemini to score
    mobileDomSummary: domSummary.mobile,
    desktopDomSummary: domSummary.desktop,
    diffText
  });

  const req = {
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: MOATSCORE_SYSTEM_PROMPT },
          { text: userPrompt },
          {
            inlineData: {
              mimeType: 'image/png',
              data: images.mobile,
            }
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: images.desktop,
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0,
    }
  };

  try {
    console.log(`[Gemini] Sending request to ${GEMINI_MODEL}...`);
    const start = Date.now();
    const response = await ai.models.generateContent(req);
    console.log(`[Gemini] Received response in ${Date.now() - start}ms`);
    return JSON.parse(response.text || '{}') as MoatScoreResult;
  } catch (err) {
    console.error('MoatScore Gemini failed, parsing error. Retrying with repair prompt...', err);
    
    // Explicit specific retry
    const retryReq = JSON.parse(JSON.stringify(req));
    retryReq.contents[0].parts.push({ text: JSON_REPAIR_PROMPT });
    
    try {
      console.log(`[Gemini] Sending RETRY request to ${GEMINI_MODEL}...`);
      const start = Date.now();
      const response = await ai.models.generateContent(retryReq);
      console.log(`[Gemini] Received RETRY response in ${Date.now() - start}ms`);
      let resultText = response.text || '{}';
      resultText = resultText.replace(/```json/g, '').replace(/```/g, '');
      return JSON.parse(resultText) as MoatScoreResult;
    } catch (finalErr) {
      console.error('MoatScore Gemini failed permanently.', finalErr);
      throw new Error("Failed to generate strict JSON MoatScore report.");
    }
  }
}
