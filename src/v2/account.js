import { auth, signOutUser } from '../lib/firebase';
import { openSettings } from './settings.js';
import { readAppearance, applyAppearance, defaultIcon } from './appearance.js';
import { confirmDialog, notify } from './ui.js';
import { hasPendingChanges } from './cloud-storage.js';

const user = auth.currentUser;
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
setStatus(window.yozuSyncStatus || '正在同步至雲端…');
window.addEventListener('yozu-remote-change', () => {
  if (document.getElementById('cloud-refresh')) return;
  const refresh = document.createElement('button');
  refresh.id = 'cloud-refresh'; refresh.className = 'yl-text-button';
  refresh.type = 'button'; refresh.textContent = '載入其他裝置的更新 ↗';
  refresh.onclick = () => location.reload();
  status.parentElement.append(refresh);
  notify('其他裝置有新的更新，請重新整理後繼續。');
});
let leaving = false;
async function logout() {
  if (leaving) return false;
  if (hasPendingChanges()) { notify('資料仍在同步，請等帳號列顯示已同步後再登出。', true); return false; }
  leaving = true;
  try {
    const accepted = await confirmDialog({ title: '暫別一下，生活待續。', description: '已同步的收藏會好好留在你的私人空間。準備好時，再回來繼續。', confirmLabel: '安心登出 ↗', danger: false });
    if (!accepted) return false;
    if (hasPendingChanges()) { notify('資料仍在同步，請稍候再登出。', true); return false; }
    try { sessionStorage.setItem('yozu-signed-out', '1'); } catch {}
    await signOutUser();
    return true;
  } catch (error) { notify(`登出失敗（${error.code || error.message}），請再試一次。`, true); return false; }
  finally { leaving = false; }
}
const showSettings = () => openSettings(logout);
name.textContent = user?.displayName || '我的生活收藏';
const identity = document.createElement('div'); identity.className = 'yl-account-identity';
const info = name.parentElement; info.before(identity); identity.append(info);
const avatarButton = document.createElement('button'); avatarButton.type = 'button';
avatarButton.className = 'yl-account-avatar-button'; avatarButton.setAttribute('aria-label', '開啟個人與外觀設定');
const avatar = document.createElement('img'); avatar.className = 'yl-account-avatar'; avatar.alt = '我的大頭貼';
avatar.dataset.accountAvatar = ''; avatar.dataset.googleAvatar = user?.photoURL || defaultIcon;
avatar.referrerPolicy = 'no-referrer'; avatarButton.append(avatar); identity.prepend(avatarButton);
avatarButton.onclick = showSettings;
button.textContent = '個人設定 ↗'; button.disabled = false; button.onclick = showSettings;
mobileButton.querySelector('span').textContent = '我的';
mobileButton.disabled = false; mobileButton.setAttribute('aria-label', '開啟個人與外觀設定');
const mobileAvatar = avatar.cloneNode(); mobileAvatar.className = 'yl-mobile-avatar';
mobileButton.querySelector('i').after(mobileAvatar); mobileButton.onclick = showSettings;
[avatar,mobileAvatar].forEach(img => img.onerror = () => { if (!img.src.endsWith('yozu-mark.svg')) img.src = defaultIcon; });
applyAppearance(readAppearance());
