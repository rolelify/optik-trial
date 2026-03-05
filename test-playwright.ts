import { runPlaywrightExtraction } from './src/lib/playwright/capture';
import crypto from 'crypto';

(async () => {
    const runId = crypto.randomUUID();
    console.log(`Starting run: ${runId}`);
    try {
        const start = Date.now();
        const capture = await runPlaywrightExtraction('http://localhost:3000/demo?variant=weak', runId);
        console.log(`Capture complete in ${Date.now() - start}ms`);
        console.log('Mobile image length:', capture.mobile.base64Image.length);
        console.log('Desktop image length:', capture.desktop.base64Image.length);
    } catch (e) {
        console.error('Error during capture:', e);
    }
    process.exit(0);
})();
