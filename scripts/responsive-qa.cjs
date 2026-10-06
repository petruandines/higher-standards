// Headless development QA for the published site. No request is sent to WhatsApp.
const { createRequire } = require('node:module');
const { mkdir, writeFile } = require('node:fs/promises');
const assert = require('node:assert/strict');
const { chromium } = createRequire(`${process.env.QA_TOOLS}/package.json`)('playwright');
const url = 'https://higherstandards.petruandines.com/';
(async () => {
  await mkdir('qa-results', { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 960 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => { window.open = url => { window.__quoteURL = url; return null; }; });
      await page.goto(`${url}?qa=${process.env.GITHUB_SHA || Date.now()}`, { waitUntil: 'networkidle' });
      await page.locator('h1').waitFor();
      assert.equal(await page.locator('h1').innerText(), 'Fly Cleaner.\nFly Higher.');
      await page.evaluate(() => document.fonts.ready);
      // Scroll all images into view, so lazy loading is also checked.
      for (const img of await page.locator('img').all()) await img.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
      const layout = await page.evaluate(() => ({
        viewport: innerWidth, document: document.documentElement.scrollWidth,
        overflow: [...document.querySelectorAll('main *, header *, footer *')].filter(el => {
          if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false;
          const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1;
        }).map(el => `${el.tagName}.${el.className}`),
        images: [...document.images].map(i => ({ src: i.getAttribute('src'), loaded: i.naturalWidth > 0 })),
        styles: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.getAttribute('href'))
      }));
      assert(layout.document <= width + 1, `Document overflow at ${width}: ${JSON.stringify(layout)}`);
      assert.deepEqual(layout.overflow, [], `Element overflow at ${width}`);
      assert(!layout.images.some(i => /aircraft-hero.svg|cabin.svg|cockpit.svg/.test(i.src)));
      const toggle = page.locator('.menu-toggle');
      if (width < 1100) {
        assert(await toggle.isVisible());
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        await page.screenshot({ path: `qa-results/menu-${width}.png` });
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        await toggle.click();
        await page.locator('#site-nav a[href="#services"]').click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      } else assert(!(await toggle.isVisible()));
      await page.getByLabel('Your name', { exact: true }).fill('Test Petru & Inés');
      await page.getByLabel('Aircraft model').fill('Tecnam P92');
      await page.getByLabel('Location / aerodrome').fill('Test aerodrome');
      await page.getByLabel('Preferred date').fill('2026-11-16');
      await page.getByLabel('Service required').selectOption({ label: 'Cabin & upholstery care' });
      await page.getByLabel('Notes').fill('QA only: accents é & symbols +');
      await page.getByRole('button', { name: 'Continue on WhatsApp' }).click();
      const quote = new URL(await page.evaluate(() => window.__quoteURL));
      assert.equal(quote.origin, 'https://wa.me');
      assert.equal(quote.pathname, '/40772053562');
      for (const text of ['Test Petru & Inés', 'Tecnam P92', 'Test aerodrome', '2026-11-16', 'Cabin & upholstery care', 'QA only: accents é & symbols +']) assert(quote.searchParams.get('text').includes(text));
      assert.equal(await page.locator('#form-status a').getAttribute('href'), quote.href);
      await page.screenshot({ path: `qa-results/contact-${width}.png` });
      await page.locator('#top').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `qa-results/hero-${width}.png` });
      await page.screenshot({ path: `qa-results/full-${width}.png`, fullPage: true });
      assert.deepEqual(errors, [], `JavaScript errors at ${width}`);
      results.push({ width, status: 'passed', ...layout });
      await context.close();
      console.log(`PASS ${width}px: no overflow, images loaded, menu and WhatsApp data checked.`);
    }
  } finally { await browser.close(); await writeFile('qa-results/results.json', JSON.stringify(results, null, 2)); }
})().catch(error => { console.error(error); process.exitCode = 1; });

