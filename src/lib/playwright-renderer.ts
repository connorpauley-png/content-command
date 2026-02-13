import { chromium, Browser, BrowserContext } from 'playwright';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

async function getBrowser(): Promise<BrowserContext> {
  if (context) return context;
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 2,
  });
  return context;
}

export async function renderHtmlToPng(
  html: string,
  width = 1080,
  height = 1080
): Promise<Buffer> {
  const ctx = await getBrowser();
  // Update viewport if non-default
  const page = await ctx.newPage();
  if (width !== 1080 || height !== 1080) {
    await page.setViewportSize({ width, height });
  }
  await page.setContent(html, { waitUntil: 'networkidle' });
  const buffer = await page.screenshot({ type: 'png' });
  await page.close();
  return Buffer.from(buffer);
}
