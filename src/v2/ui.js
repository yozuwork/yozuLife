import './experience.css';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const loader = (label = '載入中') => `<span class="yl-loader" role="status"><span class="yl-loader-orbit" aria-hidden="true"><i></i><i></i><i></i></span><span>${escapeHTML(label)}</span></span>`;

/** Native dialog supplies focus trapping, inert background, and Escape handling. */
export function createDialog({ title, description = '', eyebrow = 'YOZULIFE / A LITTLE SPACE', content, wide = false }) {
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = `yl-dialog${wide ? ' yl-dialog-wide' : ''}`;
  const id = `dialog-${crypto.randomUUID()}`;
  dialog.setAttribute('aria-labelledby', id);
  dialog.innerHTML = `<header class="yl-dialog-header"><span class="yl-eyebrow">${escapeHTML(eyebrow)}</span><button class="yl-close" type="button" aria-label="關閉視窗">×</button></header><h2 id="${id}">${escapeHTML(title)}</h2>${description ? `<p class="yl-dialog-description" id="${id}-description">${escapeHTML(description)}</p>` : ''}<div class="yl-dialog-content"></div>`;
  if (description) dialog.setAttribute('aria-describedby', `${id}-description`);
  if (content) dialog.querySelector('.yl-dialog-content').append(content);
  document.body.append(dialog);
  const close = () => dialog.close();
  dialog.querySelector('.yl-close').onclick = close;
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (previousFocus?.isConnected) previousFocus.focus();
  }, { once: true });
  dialog.showModal();
  return dialog;
}

export function confirmDialog({ title = '確定刪除這筆收藏？', description = '', confirmLabel = '確定刪除', danger = true } = {}) {
  return new Promise(resolve => {
    const content = document.createElement('div');
    content.className = 'yl-confirm-content';
    content.innerHTML = `<div class="yl-dialog-symbol" aria-hidden="true">${danger ? '−' : '↗'}</div><div class="yl-dialog-actions"><button type="button" class="yl-button yl-button-secondary" data-cancel>${danger ? '先保留' : '繼續停留'}</button><button type="button" class="yl-button ${danger ? 'yl-button-danger' : ''}" data-confirm>${escapeHTML(confirmLabel)}</button></div>`;
    const dialog = createDialog({ title, description, content, eyebrow: danger ? 'TAKE A MOMENT / 再確認一下' : 'UNTIL NEXT TIME / 暫別一下' });
    let accepted = false;
    content.querySelector('[data-cancel]').onclick = () => dialog.close();
    content.querySelector('[data-confirm]').onclick = () => { accepted = true; dialog.close(); };
    dialog.addEventListener('close', () => resolve(accepted), { once: true });
    content.querySelector('[data-cancel]').focus();
  });
}

export function notify(message, error = false) {
  const toast = document.createElement('div');
  toast.className = `yl-toast${error ? ' yl-toast-error' : ''}`;
  toast.setAttribute('role', error ? 'alert' : 'status');
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 5000);
}
