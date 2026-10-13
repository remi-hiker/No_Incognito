import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('../extension/background.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

function harness({ allowed = true, windows = [], failRemoval = false, vanished = false } = {}) {
  const events = {};
  const calls = { removed: [], badges: [], titles: [], options: 0, errors: [] };
  const event = name => ({ addListener: listener => { events[name] = listener; } });
  const chrome = {
    extension: { isAllowedIncognitoAccess: async () => allowed },
    windows: {
      getAll: async () => windows,
      remove: async id => { calls.removed.push(id); if (failRemoval) throw new Error('remove failed'); },
      get: async () => { if (vanished) throw new Error('already closed'); return {}; },
      onCreated: event('created')
    },
    action: {
      setBadgeBackgroundColor: async () => {},
      setBadgeText: async value => { calls.badges.push(value.text); },
      setTitle: async value => { calls.titles.push(value.title); }
    },
    runtime: {
      id: 'test-extension',
      onInstalled: event('installed'), onStartup: event('startup'), onMessage: event('message'),
      openOptionsPage: async () => { calls.options++; }
    }
  };
  vm.runInNewContext(source, { chrome, console: { warn: (...args) => calls.errors.push(args) } });
  return { events, calls, chrome, setAllowed: value => { allowed = value; } };
}

test('worker boot closes only incognito windows, including popup windows', async () => {
  const { calls } = harness({ windows: [
    { id: 1, incognito: false }, { id: 2, incognito: true },
    { id: 3, incognito: true, type: 'popup' }, { incognito: true }, { id: -1, incognito: true }
  ] });
  await settle();
  assert.deepEqual(calls.removed, [2, 3]);
  assert.equal(calls.badges.at(-1), 'ON');
});

test('listeners are installed synchronously; creation closes private windows only', async () => {
  const { events, calls } = harness();
  assert.deepEqual(Object.keys(events).sort(), ['created', 'installed', 'message', 'startup']);
  events.created({ id: 11, incognito: false });
  events.created({ id: 12, incognito: true });
  await settle();
  assert.deepEqual(calls.removed, [12]);
});

test('missing permission leaves windows alone and shows setup required', async () => {
  const { calls } = harness({ allowed: false, windows: [{ id: 2, incognito: true }] });
  await settle();
  assert.deepEqual(calls.removed, []);
  assert.equal(calls.badges.at(-1), '!');
});

test('status check picks up permission grant and revocation', async () => {
  const h = harness({ allowed: false, windows: [{ id: 2, incognito: true }] });
  await settle();
  const query = () => new Promise(resolve => {
    assert.equal(h.events.message({ type: 'check-status' }, { id: 'test-extension' }, resolve), true);
  });
  h.setAllowed(true);
  assert.equal((await query()).allowed, true);
  assert.deepEqual(h.calls.removed, [2]);
  h.setAllowed(false);
  assert.equal((await query()).allowed, false);
  assert.equal(h.calls.badges.at(-1), '!');
});

test('first install opens setup; updates do not', async () => {
  const { events, calls } = harness();
  events.installed({ reason: 'install' });
  events.installed({ reason: 'update' });
  await settle();
  assert.equal(calls.options, 1);
});

test('startup sweeps existing windows again', async () => {
  const { events, calls } = harness({ windows: [{ id: 2, incognito: true }] });
  await settle();
  calls.removed.length = 0;
  events.startup();
  await settle();
  assert.deepEqual(calls.removed, [2]);
});

test('already-closed window races are harmless', async () => {
  const { calls } = harness({ windows: [{ id: 2, incognito: true }], failRemoval: true, vanished: true });
  await settle();
  assert.equal(calls.errors.length, 0);
  assert.equal(calls.badges.at(-1), 'ON');
});

test('real closing failures report an error instead of claiming active protection', async () => {
  const h = harness({ windows: [{ id: 2, incognito: true }], failRemoval: true });
  await settle();
  const response = await new Promise(resolve => h.events.message({ type: 'check-status' }, { id: 'test-extension' }, resolve));
  assert.match(response.error, /Could not check protection/);
  assert.equal(h.calls.badges.at(-1), '!');
});

test('unrelated or external messages are ignored', () => {
  const { events } = harness();
  const unexpected = () => assert.fail('unexpected response');
  assert.equal(events.message({ type: 'check-status' }, { id: 'other' }, unexpected), undefined);
  assert.equal(events.message({ type: 'other' }, { id: 'test-extension' }, unexpected), undefined);
});

test('manifest uses spanning MV3 with no sensitive permissions or content scripts', () => {
  const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url)));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.incognito, 'spanning');
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  for (const file of [manifest.background.service_worker, manifest.action.default_popup, manifest.options_ui.page]) {
    assert.ok(readFileSync(new URL(`../extension/${file}`, import.meta.url)).length);
  }
});
