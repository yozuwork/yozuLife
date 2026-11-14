import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../lib/firebase';
import { ADMIN_UID, connectStorage } from './cloud-storage.js';
import { cachedAppearance, applyAppearance, readAppearance, cacheAppearance, defaultArtwork, defaultIcon } from './appearance.js';
import { loader } from './ui.js';

const content = document.createElement('div');
content.hidden = true;
while (document.body.firstChild) content.append(document.body.firstChild);
document.body.append(content);
const gate = document.createElement('main');
gate.className = 'yl-auth';
let signedOut = false;
try { signedOut = sessionStorage.getItem('yozu-signed-out') === '1'; sessionStorage.removeItem('yozu-signed-out'); } catch {}
gate.innerHTML = `<section class="yl-auth-panel"><a class="yl-auth-brand" href="${import.meta.env.BASE_URL}" aria-label="YozuLife 首頁"><img src="${defaultIcon}" alt="" width="32" height="32">YozuLife<span>PRIVATE JOURNAL</span></a><div class="yl-auth-copy"><span class="yl-eyebrow"><i class="yl-live-dot"></i> A SPACE THAT'S ONLY YOURS</span><h1>${signedOut ? '暫別一下，<br>生活待續。' : '生活的喜歡，<br>都有<span>地方</span>安放。'}</h1><p class="yl-auth-description">${signedOut ? '你已登出私人空間。<br>下一次回來，繼續收藏生活裡的小事。' : '把想再看的片刻、想記住的日常，<br>收進一個只屬於你的角落。'}</p><div class="yl-auth-actions"><button class="yl-google-button" type="button" disabled><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.49H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.51l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg><span>使用 Google 登入</span><span class="yl-button-arrow" aria-hidden="true">↗</span></button><div class="yl-auth-status" role="status" aria-live="polite">${loader('正在準備你的空間…')}</div><p class="yl-auth-privacy"><span aria-hidden="true">⌑</span> 僅限你的管理員帳號存取</p></div></div><footer class="yl-auth-footer"><span>慢慢生活，好好收藏。</span><span>© ${new Date().getFullYear()} YOZULIFE</span></footer></section><aside class="yl-auth-visual" aria-label="登入風景"><img data-login-art src="${defaultArtwork}" alt="登入頁的風景圖片"><div class="yl-art-top"><span>THE ART OF EVERYDAY</span><span>01 — ∞</span></div><div class="yl-art-caption"><span class="yl-art-line"></span><p>Make room<br>for your life.</p><span>為日常，留一點空間。</span></div><div class="yl-art-bottom"><span>COLLECT MOMENTS, NOT THINGS.</span><span aria-hidden="true">✳</span></div></aside>`;
document.body.append(gate);
document.body.classList.add('yl-auth-visible');
applyAppearance(cachedAppearance());
document.body.style.visibility = 'visible';
const message = gate.querySelector('.yl-auth-status'), button = gate.querySelector('button');
let loaded = false, busy = false;
button.onclick = async () => {
  if (busy) return;
  busy = true; button.disabled = true;
  message.innerHTML = loader(auth.currentUser ? '正在切換帳號…' : '等待 Google 登入…');
  try { if (auth.currentUser) await signOutUser(); else await signInWithGoogle(); }
  catch (error) {
    const messages = { 'auth/popup-closed-by-user':'已取消登入，準備好時再回來。', 'auth/popup-blocked':'請允許此網站開啟登入視窗後再試。', 'auth/network-request-failed':'目前無法連線，請確認網路後再試。' };
    message.textContent = messages[error.code] || `登入未完成（${error.code}），請重試。`;
  } finally { busy = false; button.disabled = false; }
};
onAuthStateChanged(auth, async user => {
  if (loaded) { content.hidden = true; location.reload(); return; }
  if (!user || user.uid !== ADMIN_UID) {
    message.textContent = user ? '這個帳號沒有存取權限，請切換為你的管理員帳號。' : signedOut ? '已安全登出，期待下次相見。' : '歡迎回來，你的收藏在這裡等你。';
    button.querySelector('span').textContent = user ? '切換 Google 帳號' : '使用 Google 登入';
    button.disabled = false;
    return;
  }
  button.hidden = true;
  gate.setAttribute('aria-busy', 'true');
  message.innerHTML = loader('正在為你打開私人空間…');
  try {
    await connectStorage(user.uid);
    cacheAppearance(readAppearance());
    loaded = true;
    await import('./main.js');
    gate.remove(); document.body.classList.remove('yl-auth-visible'); content.hidden = false;
  } catch (error) {
    loaded = false; gate.removeAttribute('aria-busy');
    message.textContent = `暫時無法開啟私人空間（${error.code || error.message}）。請確認資料庫權限後重新整理。`;
    button.hidden = false; button.disabled = false;
    button.querySelector('span').textContent = '登出並切換帳號';
  }
}, () => { message.textContent = '無法確認登入狀態，請確認網路後重新整理。'; });
