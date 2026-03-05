import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runPlaywrightExtraction, checkOcclusion } from '@/lib/playwright';
import { askGemini } from '@/lib/gemini';
import { saveRun } from '@/lib/store';
import { RunRecord, GeminiVerdict } from '@/lib/types';

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

    // SAFETY HARNESS: Check for local demo mode (only if mock=true is provided)
    if (url.includes('localhost') && url.includes('/demo') && url.includes('mock=true')) {
      const isBroken = url.includes('broken=true');
      const mockVerdict = (viewport: 'mobile' | 'desktop'): GeminiVerdict => ({
        pass: !isBroken || viewport === 'desktop', // Only fail mobile if broken=true
        viewport,
        intent_target: 'primary-cta',
        failure_type: isBroken && viewport === 'mobile' ? 'occluded' : null,
        issue_detected: isBroken && viewport === 'mobile' ? 'The primary CTA is occluded by the sticky header on mobile viewports.' : null,
        evidence: [{ selector: 'button[data-optikops="primary-cta"]', bbox: [40, 100, 310, 50] }],
        suggested_patch: isBroken ? '.header { position: relative; }' : null,
        confidence: 1.0
      });

      setTimeout(() => {
        record.status = isBroken ? 'fail' : 'pass';
        record.mobileResult = mockVerdict('mobile');
        record.desktopResult = mockVerdict('desktop');
        saveRun(record);
      }, 1000);

      return NextResponse.json({ runId });
    }

    // Run async so we don't block the UI
    (async () => {
      try {
        console.log(`[${runId}] Starting Playwright capture`);
        const capture = await runPlaywrightExtraction(url, runId);
        
        console.log(`[${runId}] Requesting Gemini mobile inference`);
        const mobileRes = await askGemini(capture.mobile, diffText);
        console.log(`[${runId}] Requesting Gemini desktop inference`);
        const desktopRes = await askGemini(capture.desktop, diffText);

        record.mobileResult = mobileRes;
        record.desktopResult = desktopRes;

        let finalStatus: 'pass' | 'fail' | 'warn' = 'pass';
        if (!mobileRes.pass || !desktopRes.pass) finalStatus = 'fail';

        // Check if primary-cta was completely missing
        if (!capture.mobile.primaryBBox && !capture.desktop.primaryBBox) {
          finalStatus = 'warn';
          console.log(`[${runId}] Target not found, downgrading to warn`);
        } else {
          // Playwright Watchdog Implementation
          const isOccludedMobile = capture.mobile.primaryBBox ? await checkOcclusion(url, 'mobile', capture.mobile.primaryBBox) : false;
          const isOccludedDesktop = capture.desktop.primaryBBox ? await checkOcclusion(url, 'desktop', capture.desktop.primaryBBox) : false;

          // UPGRADE: If AI says PASS but Watchdog says OCCLUDED -> FAIL
          if (mobileRes.pass && isOccludedMobile) {
            console.log(`[${runId}] Watchdog flagged mobile occlusion AI missed`);
            finalStatus = 'fail';
            mobileRes.pass = false;
            mobileRes.failure_type = 'occluded';
            mobileRes.issue_detected = 'OptikOps Deterministic Watchdog detected an occlusion that the AI missed. The CTA is covered by another element.';
          }
          if (desktopRes.pass && isOccludedDesktop) {
            console.log(`[${runId}] Watchdog flagged desktop occlusion AI missed`);
            finalStatus = 'fail';
            desktopRes.pass = false;
            desktopRes.failure_type = 'occluded';
            desktopRes.issue_detected = 'OptikOps Deterministic Watchdog detected an occlusion that the AI missed.';
          }

          // DOWNGRADE: If AI says FAIL (occlusion) but Watchdog says PASS -> WARN
          if (!mobileRes.pass && !isOccludedMobile && mobileRes.failure_type === 'occluded' && capture.mobile.primaryBBox) {
            if (finalStatus === 'fail' && desktopRes.pass) finalStatus = 'warn';
            mobileRes.issue_detected += ' (Manual review suggested: Deterministic check disagreed with AI prediction)';
          }
          if (!desktopRes.pass && !isOccludedDesktop && desktopRes.failure_type === 'occluded' && capture.desktop.primaryBBox) {
            if (finalStatus === 'fail' && mobileRes.pass) finalStatus = 'warn';
            desktopRes.issue_detected += ' (Manual review suggested: Deterministic check disagreed with AI prediction)';
          }
        }

        record.status = finalStatus;
        saveRun(record);
        console.log(`[${runId}] Finished with status: ${finalStatus}`);

      } catch {
        console.error(`[${runId}] Async execution failed`);
        record.status = 'warn';
        record.error = 'Async execution failed during extraction or inference';
        saveRun(record);
      }
    })();

    return NextResponse.json({ runId });

  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
