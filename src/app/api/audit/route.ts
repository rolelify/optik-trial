import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runPlaywrightExtraction, checkOcclusion } from '@/lib/playwright';
import { askGemini } from '@/lib/gemini';
import { saveRun, getRun } from '@/lib/store';
import { RunRecord } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, diffText, intentMode = true } = body;

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
      intentMode,
      status: 'running'
    };
    saveRun(record);

    // Run async so we don't block the UI
    (async () => {
      try {
        console.log(`[${runId}] Starting Playwright capture`);
        const capture = await runPlaywrightExtraction(url, runId);
        
        console.log(`[${runId}] Requesting Gemini mobile inference`);
        let mobileRes = await askGemini(capture.mobile, diffText);
        console.log(`[${runId}] Requesting Gemini desktop inference`);
        let desktopRes = await askGemini(capture.desktop, diffText);

        record.mobileResult = mobileRes;
        record.desktopResult = desktopRes;

        let finalStatus: 'pass' | 'fail' | 'warn' = 'pass';
        if (!mobileRes.pass || !desktopRes.pass) finalStatus = 'fail';

        // Check if primary-cta was completely missing
        if (!capture.mobile.primaryBBox && !capture.desktop.primaryBBox) {
          finalStatus = 'warn';
          console.log(`[${runId}] Target not found, downgrading to warn`);
        } else {
          // Playwright Sanity Check if occlusion failed
          if (mobileRes.failure_type === 'occluded' && capture.mobile.primaryBBox) {
            console.log(`[${runId}] Sanity check mobile occlusion`);
            const isOccluded = await checkOcclusion(url, 'mobile', capture.mobile.primaryBBox);
            if (!isOccluded) {
              finalStatus = 'warn';
              mobileRes.issue_detected += ' (Note: Deterministic check could not confirm occlusion, needs review.)';
            }
          } else if (desktopRes.failure_type === 'occluded' && capture.desktop.primaryBBox) {
             console.log(`[${runId}] Sanity check desktop occlusion`);
             const isOccluded = await checkOcclusion(url, 'desktop', capture.desktop.primaryBBox);
             if (!isOccluded) {
               finalStatus = 'warn';
               desktopRes.issue_detected += ' (Note: Deterministic check could not confirm occlusion, needs review.)';
             }
          }
        }

        record.status = finalStatus;
        saveRun(record);
        console.log(`[${runId}] Finished with status: ${finalStatus}`);

      } catch (err) {
        console.error(`[${runId}] Async execution failed:`, err);
        record.status = 'warn';
        record.error = String(err);
        saveRun(record);
      }
    })();

    return NextResponse.json({ runId });

  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
