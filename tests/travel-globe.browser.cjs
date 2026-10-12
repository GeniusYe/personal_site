// Requires Playwright. Set BROWSER_CHANNEL=msedge to use an installed Edge browser.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const publicDir = path.resolve(__dirname, "../public");
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".geojson": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(publicDir, "." + (pathname === "/" ? "/index.html" : pathname));
  if (path.relative(publicDir, file).startsWith("..")) { response.writeHead(403).end(); return; }
  try {
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    response.end(await fs.readFile(file));
  } catch { response.end(); }
});

async function mapState(page) {
  return page.evaluate(() => {
    const visible = id => {
      const node = document.getElementById(id);
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden";
    };
    return { unavailable: visible("globe-unavailable"), loading: visible("globe-loading"), globe: visible("travel-globe"), controls: visible("globe-controls") };
  });
}

async function assertUnavailable(page) {
  assert.deepEqual(await mapState(page), { unavailable: true, loading: false, globe: false, controls: false });
  assert.equal(await page.locator(".world-map-visual img").count(), 0);
  assert.equal(await page.locator("#globe-unavailable a").getAttribute("href"), "https://beeneverywhere.net/user/GeniusYe");
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      const errors = [];
      let scriptGate, dataGate, releaseScript, releaseData;
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.text().startsWith("Travel globe:")) console.log(message.text()); });
      await page.route("**/*", route => route.request().url().startsWith(origin + "/") ? route.continue() : route.abort());
      // Expose the map only in the test to verify the first visible render and controls.
      await page.route("**/travel-globe.js", async route => {
        await scriptGate;
        const script = (await fs.readFile(path.join(publicDir, "travel-globe.js"), "utf8")).replace("map = new Map(", "map = window.__travelMap = new Map(");
        await route.fulfill({ contentType: "text/javascript", body: script });
      });
      await page.route("**/assets/globe/*.geojson", async route => {
        await dataGate;
        await route.continue();
      });
      await page.addInitScript(() => {
        window.__startupViolations = [];
        function inspectFrame() {
          const globe = document.getElementById("travel-globe");
          const unavailable = document.getElementById("globe-unavailable");
          if (unavailable && getComputedStyle(unavailable).display !== "none") window.__startupViolations.push("unavailable message visible");
          if (globe && getComputedStyle(globe).display !== "none" && getComputedStyle(globe).visibility !== "hidden") {
            const map = window.__travelMap;
            if (!map?.loaded() || map.getProjection()?.type !== "globe") window.__startupViolations.push("unfinished globe visible");
            // Also check the actual rendered projection, not just the style setting.
            if (map?.style.projection.transitionState !== 1) window.__startupViolations.push("flat projection visible");
          }
          requestAnimationFrame(inspectFrame);
        }
        requestAnimationFrame(inspectFrame);
      });
      for (let refresh = 0; refresh < 3; refresh++) {
        scriptGate = new Promise(resolve => { releaseScript = resolve; });
        dataGate = new Promise(resolve => { releaseData = resolve; });
        if (refresh === 0) await page.goto(origin + "/#world", { waitUntil: "commit" });
        else await page.reload({ waitUntil: "commit" });
        await page.locator("#globe-loading").waitFor();
        assert.deepEqual(await mapState(page), { unavailable: false, loading: true, globe: false, controls: false });
        releaseScript();
        await page.locator("#travel-globe").scrollIntoViewIfNeeded();
        await page.waitForFunction(() => !!window.__travelMap);
        assert.deepEqual(await mapState(page), { unavailable: false, loading: true, globe: false, controls: false });
        releaseData();
        await page.waitForFunction(() => document.getElementById("travel-globe").dataset.globeReady === "true");
        assert.deepEqual(await mapState(page), { unavailable: false, loading: false, globe: true, controls: true });
        assert.deepEqual(await page.evaluate(() => window.__startupViolations), []);
      }
      for (const [id, longitude] of [["globe-americas", -90], ["globe-europe-africa", 15], ["globe-asia", 100]]) {
        await page.locator("#" + id).click();
        await page.waitForFunction(lng => Math.abs(window.__travelMap.getCenter().lng - lng) < 0.1 && !window.__travelMap.isMoving(), longitude);
      }
      await page.locator("button.maplibregl-ctrl-zoom-in").click();
      await page.waitForFunction(() => window.__travelMap.getZoom() > 1.9 && !window.__travelMap.isMoving());
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: three delayed refreshes, no flat frames, region controls and zoom`);
      if (process.env.GLOBE_SCREENSHOT && width === 1440) {
        await page.locator("#globe-europe-africa").click();
        await page.waitForFunction(() => !window.__travelMap.isMoving());
        await page.locator(".world-map-card").screenshot({ path: process.env.GLOBE_SCREENSHOT });
      }
      await page.close();
    }
    const noJs = await browser.newPage({ javaScriptEnabled: false });
    await noJs.goto(origin);
    await assertUnavailable(noJs);
    if (process.env.GLOBE_UNAVAILABLE_SCREENSHOT) await noJs.locator(".world-map-card").screenshot({ path: process.env.GLOBE_UNAVAILABLE_SCREENSHOT });
    await noJs.close();
    console.log("PASS JavaScript disabled: text link remains available");

    for (const failure of ["data", "webgl"]) {
      const page = await browser.newPage();
      await page.route("**/*", route => route.request().url().startsWith(origin + "/") ? route.continue() : route.abort());
      if (failure === "data") await page.route("**/assets/globe/countries.geojson", route => route.fulfill({ status: 404, body: "missing" }));
      else await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return type.startsWith("webgl") ? null : original.call(this, type, ...args);
        };
      });
      await page.goto(origin);
      await page.locator(".world-map-card").scrollIntoViewIfNeeded();
      await page.locator("#globe-unavailable").waitFor();
      await assertUnavailable(page);
      await page.close();
      console.log(`PASS ${failure} failure: text link replaces loading state`);
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
