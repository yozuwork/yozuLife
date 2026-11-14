import { storage } from './cloud-storage.js';

export const APPEARANCE_KEY = 'yozulife:appearance:v1';
const CACHE_KEY = 'yozulife:login-appearance:v1';
export const defaultArtwork = `${import.meta.env.BASE_URL}images/quiet-landscape.svg`;
export const defaultIcon = `${import.meta.env.BASE_URL}images/yozu-mark.svg`;
export const defaultAppearance = { background: '', avatar: '', icon: '', position: 50, theme: 'system' };
export const safeImage = value => typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';
export function readAppearance() {
  try { return normalize(JSON.parse(storage.getItem(APPEARANCE_KEY) || '{}')); }
  catch { return { ...defaultAppearance }; }
}
function normalize(data) {
  return { background: safeImage(data?.background), avatar: safeImage(data?.avatar), icon: safeImage(data?.icon), position: Math.max(0, Math.min(100, (Number.isFinite(Number(data?.position)) ? Number(data.position) : 50))), theme: ['light','dark','system'].includes(data?.theme) ? data.theme : 'system' };
}
export function cachedAppearance() {
  try { return normalize(JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')); }
  catch { return { ...defaultAppearance }; }
}
export function applyAppearance(settings) {
  if (settings.theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = settings.theme;
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.append(icon); }
  icon.href = safeImage(settings.icon) || defaultIcon;
  document.querySelectorAll('[data-account-avatar]').forEach(image => {
    image.src = safeImage(settings.avatar) || image.dataset.googleAvatar || defaultIcon;
  });
  document.querySelectorAll('[data-login-art]').forEach(image => {
    image.src = safeImage(settings.background) || defaultArtwork;
    image.style.objectPosition = `${settings.position}% center`;
  });
}
export function saveAppearance(settings) {
  const normalized = normalize(settings);
  storage.setItem(APPEARANCE_KEY, JSON.stringify(normalized));
  // Login art and favicon are deliberately available before authentication on this browser.
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...normalized, avatar: '' })); } catch { /* Cloud data remains queued. */ }
  applyAppearance(normalized);
  window.dispatchEvent(new Event('yozu-appearance-change'));
}
export function cacheAppearance(settings) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...settings, avatar: '' })); } catch { /* Optional presentation cache. */ }
  applyAppearance(settings);
}

export async function prepareImage(file, kind) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('請選擇 JPG、PNG 或 WebP 圖片。');
  if (file.size > 15 * 1024 * 1024) throw new Error('請選擇 15 MB 以下的圖片。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.width * image.height > 50000000) throw new Error('圖片尺寸過大，請先縮小後再上傳。');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('瀏覽器無法處理圖片。');
    if (kind === 'background') {
      const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      canvas.width = canvas.height = kind === 'icon' ? 96 : 320;
      const side = Math.min(image.width, image.height);
      context.drawImage(image, (image.width-side)/2, (image.height-side)/2, side, side, 0, 0, canvas.width, canvas.height);
    }
    let output = canvas.toDataURL('image/webp', .86);
    const limit = kind === 'background' ? 650000 : 100000;
    for (let quality = .7; output.length > limit && quality >= .3; quality -= .15) output = canvas.toDataURL('image/webp', quality);
    if (output.length > limit) throw new Error('圖片細節太多，請選擇較小的圖片。');
    return output;
  } finally { URL.revokeObjectURL(url); }
}
