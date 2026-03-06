import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 }
};

export type ViewportCapture = {
  base64Image: string;
  domSummary: string;
};

export type PlaywrightCaptureResult = {
  mobile: ViewportCapture;
  desktop: ViewportCapture;
};

async function captureViewport(page: Page, url: string, viewportName: 'mobile' | 'desktop', runId: string): Promise<ViewportCapture> {
  console.log(`[${runId}] [${viewportName}] Setting viewport size...`);
  await page.setViewportSize(VIEWPORTS[viewportName]);
  
  console.log(`[${runId}] [${viewportName}] Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'load' });
  
  console.log(`[${runId}] [${viewportName}] Waiting 500ms...`);
  await page.waitForTimeout(500); // short settle

  const artifactsDir = path.join(process.cwd(), 'public', 'runs', runId, viewportName);
  console.log(`[${runId}] [${viewportName}] Creating dir ${artifactsDir}...`);
  fs.mkdirSync(artifactsDir, { recursive: true });

  // Save full-page PNG for the UI report
  const fullPath = path.join(artifactsDir, 'full.png');
  console.log(`[${runId}] [${viewportName}] Taking full screenshot...`);
  await page.screenshot({ path: fullPath, fullPage: true });

  // Take a small viewport-only JPEG for Gemini (much smaller payload)
  console.log(`[${runId}] [${viewportName}] Taking viewport JPEG for AI...`);
  const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 70 });
  const base64Image = screenshotBuffer.toString('base64');
  
  console.log(`[${runId}] [${viewportName}] AI image size: ${Math.round(base64Image.length / 1024)}KB base64`);

  console.log(`[${runId}] [${viewportName}] Evaluating DOM...`);
  const domSummary = await page.evaluate(() => {
    const summary: string[] = [];
    
    // h1_texts (first 1–2 h1 strings)
    const h1s = Array.from(document.querySelectorAll('h1'))
      .map(el => (el as HTMLElement).innerText.trim())
      .filter(t => t.length > 0)
      .slice(0, 2);
    if (h1s.length > 0) summary.push(`h1_texts: ${h1s.join(' | ')}`);

    // primary_ctas (first 1–3 visible buttons/links above fold)
    const ctas = Array.from(document.querySelectorAll('button, .button, a[role="button"]'))
      .map(el => (el as HTMLElement).innerText.trim())
      .filter(text => text.length > 0)
      .slice(0, 3);
    if (ctas.length > 0) summary.push(`primary_ctas: ${ctas.join(' | ')}`);

    // nav_labels (top nav link texts)
    const navs = Array.from(document.querySelectorAll('nav a'))
      .map(el => (el as HTMLElement).innerText.trim())
      .filter(text => text.length > 0)
      .slice(0, 8);
    if (navs.length > 0) summary.push(`nav_labels: ${navs.join(' | ')}`);

    // pricing_signals (strings like "$", "/month", plan names, “free trial”, “per seat”)
    const bodyText = document.body.innerText.toLowerCase();
    const pricingKeywords = ['$', '/month', 'pricing', 'plans', 'free trial', 'per seat', 'per user', 'billed annually'];
    const foundPricing = pricingKeywords.filter(k => bodyText.includes(k));
    if (foundPricing.length > 0) summary.push(`pricing_signals: ${foundPricing.join(', ')}`);

    // trust_signals (strings like “SOC2”, “GDPR”, “Trusted by”, testimonials, star ratings)
    const trustKeywords = ['soc2', 'soc 2', 'gdpr', 'trusted by', 'testimonial', 'rating', 'guarantee', 'enterprise', 'compliance', 'security'];
    const foundTrust = trustKeywords.filter(k => bodyText.includes(k));
    if (foundTrust.length > 0) summary.push(`trust_signals: ${foundTrust.join(', ')}`);

    return summary.join('\\n');
  });

  console.log(`[${runId}] [${viewportName}] Viewport capture complete.`);
  return {
    base64Image,
    domSummary
  };
}

export async function runPlaywrightExtraction(url: string, runId: string): Promise<PlaywrightCaptureResult> {
  console.log(`[${runId}] Launching headless chromium...`);
  const browser = await chromium.launch({ headless: true });
  try {
    console.log(`[${runId}] Creating new context...`);
    const context = await browser.newContext();
    console.log(`[${runId}] Creating mobile page...`);
    const pageMobile = await context.newPage();
    console.log(`[${runId}] Creating desktop page...`);
    const pageDesktop = await context.newPage();
    
    console.log(`[${runId}] Starting parallel Promise.all capture...`);
    const [mobile, desktop] = await Promise.all([
      captureViewport(pageMobile, url, 'mobile', runId),
      captureViewport(pageDesktop, url, 'desktop', runId)
    ]);
    
    console.log(`[${runId}] Playwright extraction completely finished.`);
    return { mobile, desktop };
  } finally {
    console.log(`[${runId}] Closing browser...`);
    await browser.close();
  }
}
