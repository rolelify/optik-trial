import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runPlaywrightExtraction } from '@/lib/playwright/capture';
import { runMoatScore } from '@/lib/gemini/client';
import { saveRun } from '@/lib/store';
import { RunRecord, MoatScoreResult } from '@/lib/types';

function normalizeOverallScore(score: number) {
  let s = score;
  if (s <= 10) s = s * 10;
  if (s < 0) s = 0;
  if (s > 100) s = 100;
  return Math.round(s);
}

export const maxDuration = 300; // allow extending Vercel timeout up to 5 mins
export const runtime = 'nodejs';

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

      result.overall_score = normalizeOverallScore(result.overall_score);

      record.result = result;
      record.mobileScreenshot = capture.mobile.base64Image;
      record.desktopScreenshot = capture.desktop.base64Image;

      // Determine status based on overall score (threshold: 60)
      record.status = result.overall_score >= 60 ? 'pass' : 'fail';
      
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
