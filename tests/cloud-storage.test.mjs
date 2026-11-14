import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../src/v2/cloud-storage.js', import.meta.url), 'utf8')
  .replace(/^import .*$/gm, '').replace(/export /g, '');
function setup(initial = {}, fail = false) {
  const local = new Map(Object.entries(initial)), writes = [], events = [];
  let snapshot;
  const context = vm.createContext({
    db: {}, console: { error() {} },
    localStorage: { getItem: k => local.get(k) ?? null, setItem: (k,v) => local.set(k,v), removeItem: k => local.delete(k) },
    window: { addEventListener() {}, dispatchEvent: event => events.push(event), },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    Event: class { constructor(type) { this.type = type; } },
    setTimeout() {}, clearTimeout() {},
    collection: (...args) => args, doc: (_, id) => id,
    onSnapshot: (_, options, callback) => { snapshot = callback; return () => {}; },
    writeBatch: () => { const changes = []; return { set: (id, data) => changes.push([id,data]), commit: async () => { if(fail) throw {code:'permission-denied'}; writes.push(changes); } }; },
  });
  vm.runInContext(source + '\nglobalThis.api = { connectStorage, storage, ADMIN_UID };', context);
  return { ...context.api, local, writes, events, emit: docs => snapshot({ metadata: { hasPendingWrites:false, fromCache:false }, docs: Object.entries(docs).map(([id,data]) => ({id,data:()=>data})) }) };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
test('rejects other accounts and writes before authentication', async () => {
  const s = setup();
  await assert.rejects(s.connectStorage('someone-else'));
  assert.throws(() => s.storage.setItem('yozulife:v1', '{}'));
  assert.equal(s.writes.length, 0);
});
test('migrates existing browser videos, backs them up and clears acknowledged outbox', async () => {
  const s = setup({'yozulife:videos:v1':'[{"id":"existing"}]'});
  const ready = s.connectStorage(s.ADMIN_UID); s.emit({}); await ready; await tick();
  assert.equal(s.storage.getItem('yozulife:videos:v1'), '[{"id":"existing"}]');
  assert.equal(s.local.get('yozulife:backup:yozulife:videos:v1'), '[{"id":"existing"}]');
  assert.equal(s.writes.length, 1);
  assert.equal(s.local.has('yozulife:pending:yozulife:videos:v1'), false);
});
test('cloud takes precedence over stale local data; remote changes prevent stale edits', async () => {
  const s = setup({'yozulife:videos:v1':'old'});
  const ready = s.connectStorage(s.ADMIN_UID);
  s.emit({'yozulife:videos:v1':{count:1},'yozulife:videos:v1--0':{part:'new'}}); await ready;
  assert.equal(s.storage.getItem('yozulife:videos:v1'), 'new');
  assert.equal(s.writes.length, 0);
  s.emit({'yozulife:videos:v1':{count:1},'yozulife:videos:v1--0':{part:'newer'}});
  assert.throws(() => s.storage.setItem('yozulife:videos:v1','stale-edit'));
  assert.equal(s.local.get('yozulife:videos:v1'), 'newer');
});
test('large covers are split atomically; failed writes stay in durable outbox', async () => {
  const s = setup({}, true);
  const ready = s.connectStorage(s.ADMIN_UID); s.emit({}); await ready;
  const value = 'x'.repeat(350000);
  s.storage.setItem('yozulife:videos:v1', value); await tick();
  assert.equal(s.local.get('yozulife:pending:yozulife:videos:v1'), value);
  const healthy = setup();
  const loaded = healthy.connectStorage(healthy.ADMIN_UID); healthy.emit({}); await loaded;
  healthy.storage.setItem('yozulife:videos:v1', value); await tick();
  assert.equal(healthy.writes[0].length, 4);
  assert.equal(healthy.writes[0].at(-1)[1].count, 3);
});
