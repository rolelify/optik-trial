import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { PlaywrightResult, ViewportData, ExtractedElement, BBox } from './types';

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 }
};

async function captureViewport(page: Page, url: string, viewportName: 'mobile' | 'desktop', runId: string): Promise<ViewportData> {
  await page.setViewportSize(VIEWPORTS[viewportName]);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // forced settle

  const artifactsDir = path.join(process.cwd(), 'public', 'runs', runId, viewportName);
  fs.mkdirSync(artifactsDir, { recursive: true });

  const fullPath = path.join(artifactsDir, 'full.png');
  await page.screenshot({ path: fullPath, fullPage: true });
  
  // Read back as base64 for Gemini
  const base64Image = fs.readFileSync(fullPath, 'base64');

  // Query elements
  const elements = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-optikops]');
    const results: ExtractedElement[] = [];
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const val = node.getAttribute('data-optikops') || '';
      // Create a unique selector just for reference
      const tag = node.tagName.toLowerCase();
      // Add id or class for better representation if possible, or just the intent
      let selector = `${tag}[data-optikops="${val}"]`;
      if (node.id) selector += `#${node.id}`;
      
      results.push({
        selector,
        intentValue: val,
        innerText: (node as HTMLElement).innerText?.trim().substring(0, 100) || '',
        bbox: rect.width === 0 && rect.height === 0 ? null : [rect.x, rect.y, rect.width, rect.height]
      });
    });
    return results;
  });

  const primaryTarget = elements.find(e => e.intentValue === 'primary-cta');
  let primaryBBox = null;

  if (primaryTarget && primaryTarget.bbox) {
    primaryBBox = primaryTarget.bbox as BBox;
    
    try {
      // Find the actual element to scroll into view
      const locator = page.locator('[data-optikops="primary-cta"]').first();
      await locator.scrollIntoViewIfNeeded();
      
      // Get the current position after scrolling
      const box = await locator.boundingBox();
      if (box) {
        const viewport = VIEWPORTS[viewportName];
        const clip = {
          x: Math.max(0, box.x - 40),
          y: Math.max(0, box.y - 40),
          width: Math.min(viewport.width - Math.max(0, box.x - 40), box.width + 80),
          height: Math.min(viewport.height - Math.max(0, box.y - 40), box.height + 80)
        };

        await page.screenshot({
          path: path.join(artifactsDir, 'crop-primary-cta.png'),
          clip
        });
      }
    } catch (err) {
      console.warn('Failed to crop primary CTA', err);
    }
  }

  return {
    viewport: viewportName,
    base64Image,
    elements: elements as ExtractedElement[],
    primaryBBox
  };
}

export async function runPlaywrightExtraction(url: string, runId: string): Promise<PlaywrightResult> {
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

export async function checkOcclusion(url: string, viewportName: 'mobile' | 'desktop', bbox: BBox): Promise<boolean> {
  // Silent safety harness
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize(VIEWPORTS[viewportName]);
    await page.goto(url, { waitUntil: 'networkidle' });
    // Force scroll to top to ensure bbox and viewport coords align reliably
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const [x, y, w, h] = bbox;
    
    // Check multiple points: center and 4 corners (slightly inset)
    const points = [
      { px: x + w / 2, py: y + h / 2 },
      { px: x + 5, py: y + 5 },
      { px: x + w - 5, py: y + 5 },
      { px: x + 5, py: y + h - 5 },
      { px: x + w - 5, py: y + h - 5 },
    ];

    const results = await Promise.all(points.map(async ({ px, py }) => {
      return page.evaluate(({ px, py }) => {
        // elementFromPoint expects viewport coordinates
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const vpx = px - scrollX;
        const vpy = py - scrollY;

        const topEl = document.elementFromPoint(vpx, vpy);
        if (!topEl) return true; // Offscreen or obscured
        const cta = document.querySelector('[data-optikops="primary-cta"]');
        if (!cta) return true;

        // If top element is the CTA itself or contained within it, it's NOT occluded
        const isTarget = topEl === cta || cta.contains(topEl);
        return !isTarget; 
      }, { px, py });
    }));

    // If ANY point is occluded, we consider the whole element at risk
    return results.some(r => r === true);
  } catch {
    return false;
  } finally {
    await browser.close();
  }
}
