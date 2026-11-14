import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ADMIN_UID = 'K6DbALyBPVdX8SkUf36TnyF20433';
export const DATA_KEYS = ['yozulife:v1', 'yozulife:videos:v1', 'yozulife:video-sections:v1', 'yozulife:endocrinology:v1', 'yozulife:maps:v1', 'yozulife:medical-section-added', 'yozulife:maps-section-added', 'yozulife:maps:tsgh-keelung-added'];
const values = new Map();
const pending = new Map();
let target, running = false, retryTimer, remoteChanged = false;
const pendingKey = key => `yozulife:pending:${key}`;
const backupKey = key => `yozulife:backup:${key}`;
function status(message) {
  window.yozuSyncStatus = message;
  window.dispatchEvent(new CustomEvent('yozu-sync-status', { detail: message }));
}

// Keep a durable local outbox; only server acknowledgements clear it.
async function flush() {
  if (running || !target || !pending.size) return;
  running = true;
  status('正在同步至雲端…');
  try {
    while (pending.size) {
      const [key, value] = pending.entries().next().value;
      const batch = writeBatch(db);
      // Chunk strings so uploaded covers cannot exceed Firestore's document limit.
      const parts = Array.from({ length: Math.max(1, Math.ceil(value.length / 150000)) }, (_, i) => value.slice(i * 150000, (i + 1) * 150000));
      if (parts.length > 450) throw new Error('資料過大，請減少上傳封面大小');
      parts.forEach((part, i) => batch.set(doc(target, `${key}--${i}`), { part }));
      batch.set(doc(target, key), { count: parts.length });
      await batch.commit();
      if (pending.get(key) === value) {
        pending.delete(key);
        localStorage.removeItem(pendingKey(key));
      }
    }
    status('已同步至雲端');
  } catch (error) {
    console.error('Cloud sync failed', error);
    status(`雲端同步失敗（${error.code || error.message}），資料已保留於此瀏覽器，稍後重試`);
    retryTimer = setTimeout(flush, 15000);
  } finally {
    running = false;
  }
}

export const storage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) {
    if (!target || !DATA_KEYS.includes(key)) throw new Error('尚未登入管理員帳號');
    if (remoteChanged) throw new Error('其他裝置已更新資料，請先重新整理');
    value = String(value);
    if (values.get(key) === value) return;
    localStorage.setItem(pendingKey(key), value);
    localStorage.setItem(key, value);
    values.set(key, value);
    pending.set(key, value);
    void flush();
  },
};

export function connectStorage(uid) {
  if (uid !== ADMIN_UID) return Promise.reject(new Error('此帳號沒有權限'));
  target = collection(db, 'users', uid, 'siteData');
  return new Promise((resolve, reject) => {
    let initialized = false;
    const unsubscribe = onSnapshot(target, { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
      const remote = new Map();
      const documents = new Map(snapshot.docs.map(item => [item.id, item.data()]));
      for (const key of DATA_KEYS) {
        const manifest = documents.get(key);
        if (!manifest) continue;
        if (!Number.isInteger(manifest.count) || manifest.count < 1 || manifest.count > 450) {
          status('雲端資料格式錯誤，停止載入以保護資料');
          return;
        }
        const parts = Array.from({ length: manifest.count }, (_, i) => documents.get(`${key}--${i}`)?.part);
        if (parts.some(part => typeof part !== 'string')) return;
        remote.set(key, parts.join(''));
      }
      if (!initialized) {
        for (const key of DATA_KEYS) {
          const local = localStorage.getItem(key);
          const queued = localStorage.getItem(pendingKey(key));
          if (local !== null && localStorage.getItem(backupKey(key)) === null) localStorage.setItem(backupKey(key), local);
          const value = queued ?? remote.get(key) ?? local;
          if (value !== null && value !== undefined) {
            values.set(key, value);
            localStorage.setItem(key, value);
            if (queued !== null || !remote.has(key)) {
              pending.set(key, value);
              localStorage.setItem(pendingKey(key), value);
            }
          }
        }
        initialized = true;
        status(pending.size ? '正在上傳此瀏覽器的既有資料…' : '已同步至雲端');
        resolve(unsubscribe);
        void flush();
      } else {
        let changed = false;
        for (const [key, value] of remote) {
          if (!pending.has(key) && values.get(key) !== value) {
            localStorage.setItem(key, value);
            changed = true;
          }
        }
        // Reinitialize module state without discarding an open editor.
        if (changed) {
          remoteChanged = true;
          status('其他裝置已更新資料，關閉編輯視窗後重新整理即可載入');
          window.dispatchEvent(new Event('yozu-remote-change'));
        }
      }
    }, error => {
      status(`無法讀取雲端資料（${error.code}），請確認 Firestore 規則`);
      if (!initialized) { unsubscribe(); reject(error); }
    });
  });
}

window.addEventListener('online', () => { clearTimeout(retryTimer); void flush(); });
