import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const extension = path.join(root, 'extension');
const profile = await mkdtemp(path.join(tmpdir(), 'no-incognito-test-'));
const results = path.join(root, 'test-results');
await mkdir(results, { recursive: true });
let context;
const launch = () => chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
});

async function checkState(id, expected) {
  // Chrome reloads the extension when incognito access changes and may close
  // its open pages. Open a fresh status page as the user would.
  const page = await context.newPage();
  await page.setViewportSize({ width: 380, height: 800 });
  await page.goto(`chrome-extension://${id}/status.html`);
  await page.locator(`#status[data-state="${expected}"]`).waitFor();
  return page;
}

async function assertPrivateWindowCloses(page, type = 'normal') {
  const regularIds = await page.evaluate(async () =>
    (await chrome.windows.getAll()).filter(w => !w.incognito).map(w => w.id));
  // Observe the actual removal event independently of the background worker.
  await page.evaluate(async windowType => {
    window.closedPrivateWindow = false;
    const privateIds = new Set();
    const created = w => { if (w.incognito) privateIds.add(w.id); };
    const removed = id => {
      if (privateIds.has(id)) {
        window.closedPrivateWindow = true;
        chrome.windows.onCreated.removeListener(created);
        chrome.windows.onRemoved.removeListener(removed);
      }
    };
    chrome.windows.onCreated.addListener(created);
    chrome.windows.onRemoved.addListener(removed);
    await chrome.windows.create({ incognito: true, type: windowType, url: 'about:blank' });
  }, type);
  await page.waitForFunction(() => window.closedPrivateWindow === true);
  const remaining = await page.evaluate(() => chrome.windows.getAll());
  assert.equal(remaining.some(w => w.incognito), false);
  assert.deepEqual(remaining.filter(w => !w.incognito).map(w => w.id), regularIds);
}

try {
  context = await launch();
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  let page = await context.newPage();
  await page.setViewportSize({ width: 380, height: 800 });
  await page.goto(`chrome-extension://${id}/status.html`);
  await page.locator('#status[data-state="inactive"]').waitFor();
  await page.screenshot({ path: path.join(results, 'setup.png'), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  console.log('PASS: fresh installation shows setup required, with no layout overflow');

  const settingsPromise = context.waitForEvent('page');
  await page.locator('#open-settings').click();
  const settings = await settingsPromise;
  await settings.waitForURL(`chrome://extensions/?id=${id}`);
  // Match the documented unpacked installation flow. Recent Chrome versions
  // disable unpacked extensions on reload if Developer mode is off.
  await settings.locator('extensions-toolbar cr-toggle').click();
  const toggle = settings.locator('#allow-incognito').locator('cr-toggle');
  await toggle.waitFor();

  // Create a private window before granting permission and verify it survives.
  const browserSession = await context.browser().newBrowserCDPSession();
  const marker = 'about:blank#no-incognito-before-permission';
  await page.evaluate(url => chrome.windows.create({ incognito: true, url }), marker);
  const hasMarker = async () => (await browserSession.send('Target.getTargets')).targetInfos.some(t => t.url === marker);
  assert.equal(await hasMarker(), true);
  const enabledWorker = context.waitForEvent('serviceworker');
  await toggle.click();
  await enabledWorker;
  page = await checkState(id, 'active');
  assert.equal(await hasMarker(), false);
  assert.equal(await page.locator('#setup').isVisible(), false);
  await page.screenshot({ path: path.join(results, 'active.png'), fullPage: true });
  console.log('PASS: enabling permission closes an existing private window and updates status');

  await assertPrivateWindowCloses(page);
  await assertPrivateWindowCloses(page, 'popup');
  console.log('PASS: new incognito windows and popups close; normal windows stay open');

  const session = await context.newCDPSession(page);
  await session.send('ServiceWorker.enable');
  await session.send('ServiceWorker.stopAllWorkers');
  await assertPrivateWindowCloses(page);
  console.log('PASS: window creation wakes the stopped worker and still closes the window');

  await context.close();
  context = await launch();
  const restartedPage = await context.newPage();
  await restartedPage.goto(`chrome-extension://${id}/status.html`);
  await restartedPage.locator('#status[data-state="active"]').waitFor();
  await assertPrivateWindowCloses(restartedPage);
  console.log('PASS: permission and blocking survive a full browser restart');

  const restartedSettings = await context.newPage();
  await restartedSettings.goto(`chrome://extensions/?id=${id}`);
  const disabledWorker = context.waitForEvent('serviceworker');
  await restartedSettings.locator('#allow-incognito').locator('cr-toggle').click();
  await disabledWorker;
  await checkState(id, 'inactive');
  console.log('PASS: revoking permission returns the status to setup required');
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
