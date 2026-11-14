import { auth } from '../lib/firebase';
import { createDialog, escapeHTML as esc, loader, notify } from './ui.js';
import { readAppearance, saveAppearance, prepareImage, defaultArtwork, defaultIcon } from './appearance.js';

export function openSettings(onLogout) {
  if (document.querySelector('.yl-settings')) return;
  const draft = { ...readAppearance() }, user = auth.currentUser;
  let processing = 0, disposed = false;
  const content = document.createElement('form');
  content.className = 'yl-settings';
  content.innerHTML = `<div class="yl-settings-profile"><img class="yl-profile-preview" alt="目前大頭貼" src="${esc(draft.avatar || user?.photoURL || defaultIcon)}" referrerpolicy="no-referrer"><div><strong>${esc(user?.displayName || '我的生活收藏')}</strong><span>${esc(user?.email || '')}</span></div><span class="yl-private-badge">私人空間</span></div><section class="yl-setting-section"><div class="yl-setting-heading"><span class="yl-section-number">01</span><div><h3>登入風景</h3><p>每一次回來，都看見自己喜歡的畫面。</p></div></div><div class="yl-background-preview"><img alt="登入背景預覽" src="${esc(draft.background || defaultArtwork)}"><span>MAKE ROOM<br>FOR YOUR LIFE.</span></div><div class="yl-setting-tools"><label class="yl-upload">上傳背景<input type="file" accept="image/jpeg,image/png,image/webp" data-upload="background"></label><button type="button" class="yl-text-button" data-reset="background">恢復預設</button><small>JPG、PNG、WebP · 15 MB 以下</small></div><label class="yl-position-label">畫面焦點 <input type="range" min="0" max="100" value="${draft.position}" aria-label="背景水平焦點"></label></section><section class="yl-setting-section yl-identity-grid">${[['avatar','02','你的大頭貼','預設使用 Google 頭像。','使用 Google 大頭貼'],['icon','03','網站小圖示','出現在瀏覽器分頁上。','恢復預設圖示']].map(([kind,num,title,description,reset])=>`<div><div class="yl-setting-heading"><span class="yl-section-number">${num}</span><div><h3>${title}</h3><p>${description}</p></div></div><div class="yl-identity-preview"><img data-${kind}-preview alt="${title}預覽" referrerpolicy="no-referrer" src="${esc(draft[kind] || (kind==='avatar' ? user?.photoURL : '') || defaultIcon)}"><label class="yl-upload">選擇圖片<input type="file" accept="image/jpeg,image/png,image/webp" data-upload="${kind}"></label></div><button type="button" class="yl-text-button" data-reset="${kind}">${reset}</button></div>`).join('')}</section><section class="yl-setting-section"><div class="yl-setting-heading"><span class="yl-section-number">04</span><div><h3>空間色調</h3><p>選擇最舒服的閱讀光線。</p></div></div><div class="yl-theme-options" role="group" aria-label="網站色調">${[['system','跟隨系統'],['light','日光'],['dark','夜色']].map(([value,label])=>`<button type="button" data-theme-option="${value}" aria-pressed="${draft.theme===value}">${label}</button>`).join('')}</div></section><p class="yl-setting-note">外觀設定會隨帳號同步。登入背景與圖示會保留於此瀏覽器，供登出後顯示。</p><p class="yl-settings-message" role="status" aria-live="polite"></p><footer class="yl-settings-footer"><button type="button" class="yl-text-button" data-logout>登出帳號 ↗</button><div><button type="button" class="yl-button yl-button-secondary" data-cancel>取消</button><button type="submit" class="yl-button">儲存設定 ↗</button></div></footer>`;
  const dialog = createDialog({ title: '把這裡，變成你的樣子。', description: '一張風景、一點個性，留給每天回來的自己。', eyebrow: 'YOUR SPACE / 個人設定', content, wide: true });
  dialog.addEventListener('close', () => { disposed = true; });
  const message = content.querySelector('.yl-settings-message'), submit = content.querySelector('[type=submit]');
  const update = () => {
    const background = content.querySelector('.yl-background-preview img');
    background.src = draft.background || defaultArtwork;
    background.style.objectPosition = `${draft.position}% center`;
    content.querySelectorAll('.yl-profile-preview,[data-avatar-preview]').forEach(img => { img.src = draft.avatar || user?.photoURL || defaultIcon; });
    content.querySelector('[data-icon-preview]').src = draft.icon || defaultIcon;
  };
  content.querySelectorAll('img').forEach(img => img.addEventListener('error', () => { if (!img.src.endsWith('yozu-mark.svg')) img.src = defaultIcon; }));
  content.onchange = async event => {
    const input = event.target;
    if (!input.dataset.upload || !input.files?.[0]) return;
    processing++; submit.disabled = true; input.disabled = true;
    message.innerHTML = loader('正在整理圖片…');
    try {
      const value = await prepareImage(input.files[0], input.dataset.upload);
      if (!disposed) { draft[input.dataset.upload] = value; update(); message.textContent = '圖片已準備好，儲存後套用。'; }
    } catch (error) { if (!disposed) message.textContent = error.message; }
    finally { processing--; input.disabled = false; input.value = ''; submit.disabled = processing > 0; }
  };
  content.querySelector('[type=range]').oninput = event => { draft.position = Number(event.target.value); update(); };
  content.onclick = event => {
    const reset = event.target.closest('[data-reset]');
    if (reset) { draft[reset.dataset.reset] = ''; update(); }
    const theme = event.target.closest('[data-theme-option]');
    if (theme) { draft.theme = theme.dataset.themeOption; content.querySelectorAll('[data-theme-option]').forEach(button => button.setAttribute('aria-pressed', String(button===theme))); }
  };
  content.querySelector('[data-cancel]').onclick = () => dialog.close();
  content.querySelector('[data-logout]').onclick = async () => { if (await onLogout()) dialog.close(); };
  content.onsubmit = event => {
    event.preventDefault(); if (processing) return;
    try { saveAppearance(draft); dialog.close(); notify('已套用你的空間設定，正在同步至雲端。'); }
    catch (error) { message.textContent = `尚未儲存：${error.message}`; }
  };
  update();
}
