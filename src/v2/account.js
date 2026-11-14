import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../lib/firebase';

const name = document.getElementById('account-name');
const status = document.getElementById('account-status');
const button = document.getElementById('account-action');
const mobileButton = document.getElementById('mobile-account-action');
const mobileStatus = document.getElementById('mobile-account-status');
function setStatus(text) {
  status.textContent = text;
  mobileStatus.textContent = text;
  mobileStatus.hidden = !text;
}
window.addEventListener('yozu-sync-status', event => setStatus(event.detail));
if (window.yozuSyncStatus) setStatus(window.yozuSyncStatus);
window.addEventListener('yozu-remote-change', () => {
  if (document.getElementById('cloud-refresh')) return;
  const refresh = document.createElement('button');
  refresh.id = 'cloud-refresh';
  refresh.type = 'button';
  refresh.textContent = '載入其他裝置的更新';
  refresh.onclick = () => location.reload();
  status.parentElement.append(refresh);
});
let user = null;
let busy = false;
let ready = false;

function renderAccount() {
  name.textContent = user ? (user.displayName || user.email || '已登入') : '訪客模式';
  button.textContent = busy ? '處理中…' : user ? '登出' : '使用 Google 登入';
  button.disabled = busy || !ready;
  mobileButton.querySelector('span').textContent = busy ? '處理中…' : user ? '登出' : '登入';
  mobileButton.querySelector('i').className = user ? 'bi bi-box-arrow-right' : 'bi bi-box-arrow-in-right';
  mobileButton.disabled = busy || !ready;
  mobileButton.setAttribute('aria-label', user ? `登出 ${user.displayName || user.email || '帳號'}` : '使用 Google 登入');
}

onAuthStateChanged(auth, (currentUser) => {
  user = currentUser;
  ready = true;
  renderAccount();
}, () => {
  setStatus('無法確認登入狀態，請重新整理後再試。');
  button.textContent = '登入暫時無法使用';
  button.disabled = true;
  mobileButton.disabled = true;
  mobileButton.querySelector('span').textContent = '無法登入';
});

async function handleAccountAction() {
  if (busy || !ready) return;
  busy = true;
  setStatus('處理中…');
  renderAccount();
  try {
    if (user) {
      await signOutUser();
      setStatus('已登出，分區設定仍儲存於此瀏覽器');
    } else {
      await signInWithGoogle();
      setStatus('已登入，分區設定目前僅儲存於此瀏覽器');
    }
  } catch (error) {
    const messages = {
      'auth/popup-closed-by-user': '已取消登入，可隨時重試。',
      'auth/cancelled-popup-request': '已取消登入，可隨時重試。',
      'auth/popup-blocked': '瀏覽器封鎖了登入視窗，請允許彈出視窗後重試。',
      'auth/unauthorized-domain': '此網站網域尚未加入 Firebase 的授權網域。',
      'auth/network-request-failed': '網路連線失敗，請確認連線後重試。',
      'auth/operation-not-allowed': 'Firebase 尚未啟用 Google 登入。',
    };
    setStatus(messages[error.code] || '操作失敗，請稍後再試。');
  } finally {
    busy = false;
    renderAccount();
  }
}
button.addEventListener('click', handleAccountAction);
mobileButton.addEventListener('click', handleAccountAction);
