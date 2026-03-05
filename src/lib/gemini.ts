import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ViewportData, GeminiVerdict } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    pass: { type: Type.BOOLEAN },
    viewport: { type: Type.STRING, enum: ['mobile', 'desktop'] },
    intent_target: { type: Type.STRING, nullable: true },
    failure_type: { type: Type.STRING, nullable: true, enum: ['occluded', 'offscreen', 'clipped', 'unreadable', 'unknown'] },
    issue_detected: { type: Type.STRING, nullable: true },
    evidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          selector: { type: Type.STRING },
          bbox: { type: Type.ARRAY, items: { type: Type.NUMBER } }
        }
      }
    },
    suggested_patch: { type: Type.STRING, nullable: true },
    confidence: { type: Type.NUMBER }
  },
  required: ['pass', 'viewport', 'intent_target', 'failure_type', 'issue_detected', 'evidence', 'suggested_patch', 'confidence']
};

export async function askGemini(data: ViewportData, diffText?: string): Promise<GeminiVerdict> {
  const elementsMarkdown = data.elements.map(e => 
    `- Intent: ${e.intentValue}
  Selector: ${e.selector}
  Text: ${e.innerText}
  BBox (x,y,w,h): ${e.bbox ? JSON.stringify(e.bbox) : 'null'}`
  ).join('\n');

  const prompt = `You are OptikOps, a Visual CI reasoning engine.
Analyze the provided screenshot of the ${data.viewport} viewport to determine if the primary CTA is usable.
The primary intent target is: data-optikops="primary-cta".
Primary BBox (x,y,w,h): ${data.primaryBBox ? JSON.stringify(data.primaryBBox) : 'null'}

All detected intent elements:
${elementsMarkdown}

Your job is to determine if the primary CTA is occluded, cut off, offscreen, or unclickable.
Look closely at the screenshot. Does a sticky header (like a banner that says "Warning..."), modal, or footer overlap the button area? 
Even if the button is partially visible, if it is covered by a translucent or solid element that isn't its own parent, set pass=false.
If the primary BBox is null, it means it wasn't rendered.

Review the diff (if any) to see if recent changes caused the issue.
Diff:
${diffText ? diffText.substring(0, 2000) : 'None'}

Guardrails: 
- If ANY part of the button is covered by an overlay, it is a FAIL.
- Do not hallucinate. If unsure, set failure_type="unknown" and pass=true with low confidence.
Return STRICT JSON ONLY matching the provided schema.`;

  const req = {
    model: 'gemini-3.1-flash-image-preview', // Exact identifier from list_models discovery
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/png',
              data: data.base64Image,
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1,
    }
  };

  try {
    const response = await ai.models.generateContent(req);
    const resultText = response.text || '{}';
    return JSON.parse(resultText) as GeminiVerdict;
  } catch (err) {
    console.error('Gemini first pass failed, retrying...', err);
    // Retry once
    const retryReq = {
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt + '\n\nIMPORTANT: Return JSON ONLY, no commentary or markdown backticks.' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: data.base64Image,
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Don't enforce schema object in retry to see if it bypasses errors
      }
    };
    const response = await ai.models.generateContent(retryReq);
    let resultText = response.text || '{}';
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(resultText) as GeminiVerdict;
  }
}
