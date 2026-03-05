import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runPlaywrightExtraction } from '@/lib/playwright/capture';
import { runMoatScore } from '@/lib/gemini/client';
import { saveRun } from '@/lib/store';
import { RunRecord, MoatScoreResult } from '@/lib/types';

export const maxDuration = 300; // allow extending Vercel timeout up to 5 mins

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
      
      return NextResponse.json({ runId });

    } catch (err) {
      console.error(`[${runId}] Execution failed`, err);
      record.status = 'warn';
      record.error = 'Execution failed during extraction or inference';
      saveRun(record);
      return NextResponse.json({ error: 'Extraction or inference failed', runId }, { status: 500 });
    }

  } catch (err) {
    console.error('Audit route failed', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
