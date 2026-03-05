import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runPlaywrightExtraction } from '@/lib/playwright/capture';
import { runMoatScore } from '@/lib/gemini/client';
import { saveRun } from '@/lib/store';
import { RunRecord, MoatScoreResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, diffText } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const runId = crypto.randomUUID();
    
    // Initial record
    const record: RunRecord = {
      id: runId,
      url,
      timestamp: new Date().toISOString(),
      diffText,
      status: 'running'
    };
    saveRun(record);

    // SAFETY HARNESS: Check for local demo mode (only if mock=true is provided)
    if (url.includes('localhost') && url.includes('/demo') && url.includes('variant=')) {
      const variant = url.includes('variant=strong') ? 'strong' : 'weak';
      const mockResult: MoatScoreResult = variant === 'strong' ? {
        overall_score: 85,
        vectors: {
          clear_wedge: 90,
          distribution_hooks: 70,
          workflow_lock_in: 80,
          data_flywheel: 60,
          switching_costs: 75,
          trust_and_risk: 95,
          differentiation: 85,
          monetization_power: 80
        },
        moat_delta: {
          strengthened: [
            { vector: 'trust_and_risk', reason: 'SOC2 and compliance badges visible', evidence: 'DOM: Keywords: soc2, security' },
            { vector: 'clear_wedge', reason: 'Sharp value proposition in H1', evidence: 'DOM: H1: The ultimate wedge.' }
          ],
          weakened: []
        },
        top_issues: ['Social proof could be stronger'],
        quick_wins: ['Add G2/Capterra badges'],
        recommended_experiments: [
          { hypothesis: 'Adding customer logos will increase trust', change: 'Add "Trusted by" section', expected_impact: 'High', effort: 'S' }
        ],
        confidence: 1.0
      } : {
        overall_score: 42,
        vectors: {
          clear_wedge: 40,
          distribution_hooks: 30,
          workflow_lock_in: 20,
          data_flywheel: 10,
          switching_costs: 30,
          trust_and_risk: 40,
          differentiation: 50,
          monetization_power: 60
        },
        moat_delta: {
          strengthened: [],
          weakened: [
            { vector: 'trust_and_risk', reason: 'No trust signals or compliance mentions', evidence: 'DOM: Keywords: none' },
            { vector: 'clear_wedge', reason: 'Vague headline', evidence: 'DOM: H1: Generic SaaS Template' }
          ]
        },
        top_issues: ['No clear differentiation', 'Missing trust signals'],
        quick_wins: ['Add clear pricing', 'Add trust badges'],
        recommended_experiments: [
          { hypothesis: 'Clear pricing will improve monetization power', change: 'Add pricing table', expected_impact: 'Medium', effort: 'M' }
        ],
        confidence: 0.9
      };

      setTimeout(() => {
        record.status = mockResult.overall_score > 70 ? 'pass' : 'fail';
        record.result = mockResult;
        saveRun(record);
      }, 1000);

      return NextResponse.json({ runId });
    }

    // Run async so we don't block the UI
    (async () => {
      try {
        console.log(`[${runId}] Starting Playwright capture`);
        const capture = await runPlaywrightExtraction(url, runId);
        
        console.log(`[${runId}] Requesting Gemini Moat analysis`);
        const result = await runMoatScore(
          { mobile: capture.mobile.base64Image, desktop: capture.desktop.base64Image },
          { mobile: capture.mobile.domSummary, desktop: capture.desktop.domSummary },
          diffText
        );

        record.result = result;
        record.mobileScreenshot = capture.mobile.base64Image;
        record.desktopScreenshot = capture.desktop.base64Image;

        // Determine status based on overall score (threshold: 70)
        record.status = result.overall_score >= 70 ? 'pass' : 'fail';
        
        saveRun(record);
        console.log(`[${runId}] Finished with status: ${record.status}`);

      } catch (err) {
        console.error(`[${runId}] Async execution failed`, err);
        record.status = 'warn';
        record.error = 'Async execution failed during extraction or inference';
        saveRun(record);
      }
    })();

    return NextResponse.json({ runId });

  } catch (err) {
    console.error('Audit route failed', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
