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
    const results: any[] = [];
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
    const [x, y, w, h] = primaryBBox;
    
    // Attempt crop screenshot
    const clip = {
      x: Math.max(0, x - 40),
      y: Math.max(0, y - 40),
      width: w + 80,
      height: h + 80
    };
    try {
      await page.screenshot({
        path: path.join(artifactsDir, 'crop-primary-cta.png'),
        clip
      });
    } catch (e) {
      console.warn('Failed to crop primary CTA', e);
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
    await page.waitForTimeout(1500);
    
    const [x, y, w, h] = bbox;
    const cx = x + w / 2;
    const cy = y + h / 2;

    const isOccluded = await page.evaluate(({cx, cy}) => {
      const topEl = document.elementFromPoint(cx, cy);
      if (!topEl) return true; // Offscreen or obscured
      const cta = topEl.closest('[data-optikops="primary-cta"]');
      return !cta; // If top element is not the CTA or within it, it's occluded by something else
    }, {cx, cy});

    return isOccluded;
  } catch (e) {
    return false; // Can't prove occlusion, so return false
  } finally {
    await browser.close();
  }
}
