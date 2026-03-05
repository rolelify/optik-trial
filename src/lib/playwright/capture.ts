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
  await page.setViewportSize(VIEWPORTS[viewportName]);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // forced settle

  const artifactsDir = path.join(process.cwd(), 'public', 'runs', runId, viewportName);
  fs.mkdirSync(artifactsDir, { recursive: true });

  const fullPath = path.join(artifactsDir, 'full.png');
  await page.screenshot({ path: fullPath, fullPage: true });
  
  const base64Image = fs.readFileSync(fullPath, 'base64');

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

  return {
    base64Image,
    domSummary
  };
}

export async function runPlaywrightExtraction(url: string, runId: string): Promise<PlaywrightCaptureResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const mobile = await captureViewport(page, url, 'mobile', runId);
    const desktop = await captureViewport(page, url, 'desktop', runId);

    return { mobile, desktop };
  } finally {
    await browser.close();
  }
}
