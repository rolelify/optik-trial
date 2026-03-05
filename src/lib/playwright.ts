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

export async function checkOcclusion(url: string, viewportName: 'mobile' | 'desktop'): Promise<boolean> {
      const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize(VIEWPORTS[viewportName]);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // First, scroll the element cleanly into the center of the viewport
    await page.evaluate(() => {
      const el = document.querySelector('[data-optikops="primary-cta"]');
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
      }
    });

    // Wait for scroll and any stickies to settle
    await page.waitForTimeout(500);

    const isOccluded = await page.evaluate(() => {
      const el = document.querySelector('[data-optikops="primary-cta"]');
      if (!el) return false;

      const rect = el.getBoundingClientRect();
      
      // If rect is totally outside the viewport bounds, elementFromPoint breaks
      if (rect.y < 0 || rect.y > window.innerHeight || rect.x < 0 || rect.x > window.innerWidth) {
        return true; // Technically offscreen/occluded by viewport edges
      }

      // Check multiple points: center and 4 corners (slightly inset)
      const points = [
        { px: rect.x + rect.width / 2, py: rect.y + rect.height / 2 },
        { px: rect.x + 5, py: rect.y + 5 },
        { px: rect.x + rect.width - 5, py: rect.y + 5 },
        { px: rect.x + 5, py: rect.y + rect.height - 5 },
        { px: rect.x + rect.width - 5, py: rect.y + rect.height - 5 },
      ];

      return points.some(p => {
        const topEl = document.elementFromPoint(p.px, p.py);
        if (!topEl) return true;
        
        // If top element is the CTA itself or contained within it, it's NOT occluded
        return !(topEl === el || el.contains(topEl));
      });
    });

    return isOccluded;
  } catch {
    return false;
  } finally {
    await browser.close();
  }
}

