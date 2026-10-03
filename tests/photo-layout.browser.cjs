// Requires Playwright. Set BROWSER_CHANNEL=msedge to use an installed Edge browser.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const publicDir = path.resolve(__dirname, "../public");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(publicDir, "." + (pathname === "/" ? "/index.html" : pathname));
  if (path.relative(publicDir, file).startsWith("..")) { response.writeHead(403).end(); return; }
  try {
    const content = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" }).end(content);
  } catch { response.writeHead(404).end(); }
});

async function inspect(page, selector) {
  return page.locator(selector).evaluateAll(cards => {
    const grid = cards[0]?.parentElement;
    const gridWidth = grid?.getBoundingClientRect().width;
    const gap = grid ? parseFloat(getComputedStyle(grid).columnGap) : 0;
    const rows = [];
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      let row = rows.find(row => Math.abs(row.top - rect.top) < 1);
      if (!row) { row = { top: rect.top, cards: [], span: 0 }; rows.push(row); }
      const wide = card.matches(".postcard-wide,.culture-card-wide");
      row.span += Number(getComputedStyle(card).gridColumnStart.replace("span ", ""));
      row.cards.push({ wide, width: rect.width, left: rect.left });
    }
    return { rows, gridWidth, gap, count: cards.length, unique: new Set(cards.map(card => card.querySelector("img").getAttribute("src"))).size, overflow: document.documentElement.scrollWidth > innerWidth };
  });
}

function assertDesktopRows(state) {
  for (const row of state.rows) {
    assert.equal(row.span, 6, "every visible desktop row fills six tracks");
    for (let i = 1; i < row.cards.length; i++) {
      assert(row.cards[i].left >= row.cards[i - 1].left + row.cards[i - 1].width + state.gap - 1);
    }
    if (row.cards.some(card => card.wide)) {
      assert.equal(row.cards.length, 2);
      const wide = row.cards.find(card => card.wide);
      const allocation = (state.gridWidth - state.gap) * 2 / 3 + state.gap / 3;
      assert(Math.abs(wide.width - allocation * 0.9) < 1, "wide cards retain their smaller sizing");
    } else if (row.cards.length === 2) {
      for (const card of row.cards) assert(Math.abs(card.width - (state.gridWidth - state.gap) / 2) < 1, "two singles each fill half the row");
    }
  }
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  try {
    for (const width of [1440, 950, 768, 701, 700, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => route.request().url().startsWith(origin + "/") ? route.continue() : route.abort());
      // Check every intermediate load before the automatic observer can add more.
      await page.addInitScript(() => { delete window.IntersectionObserver; });
      for (let reload = 0; reload < (width === 1440 ? 5 : 1); reload++) {
        await page.goto(origin);
        const culture = await inspect(page, ".culture-card");
        assert.equal(culture.count, 12);
        if (width > 700) assertDesktopRows(culture);
        while (true) {
          const state = await inspect(page, ".postcard");
          assert.equal(state.count, state.unique);
          assert(!state.overflow);
          if (width > 700) assertDesktopRows(state);
          if (await page.locator("#travel-sentinel").isHidden()) { assert.equal(state.count, 32); break; }
          await page.locator("#load-more-photos").evaluate(button => button.click());
        }
      }
      // Keyboard navigation and wraparound must follow the visible card order.
      const titles = await page.locator(".postcard-caption strong").allTextContents();
      await page.locator(".postcard-open").first().evaluate(link => link.click());
      for (const title of titles) {
        assert.equal(await page.locator("#gallery-photo-title").textContent(), title);
        await page.keyboard.press("ArrowRight");
      }
      assert.equal(await page.locator("#gallery-photo-title").textContent(), titles[0]);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#gallery-dialog").isVisible(), false);
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: full rows, all batches, 32 unique postcards, viewer order and wraparound`);
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    await page.goto(origin + "/#postcards");
    for (let attempt = 0; attempt < 20 && await page.locator("#travel-sentinel").isVisible(); attempt++) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(100);
      await page.locator("#travel-sentinel").evaluate(node => node.scrollIntoView({ behavior: "instant", block: "end" }));
      await page.waitForTimeout(250);
    }
    assert.equal(await page.locator(".postcard").count(), 32);
    assertDesktopRows(await inspect(page, ".postcard"));
    console.log("PASS automatic scrolling loads all complete rows");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
