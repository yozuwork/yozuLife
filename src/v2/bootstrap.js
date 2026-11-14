import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../lib/firebase';
import { ADMIN_UID, connectStorage } from './cloud-storage.js';

const content = document.createElement('div');
content.hidden = true;
while (document.body.firstChild) content.append(document.body.firstChild);
document.body.append(content);
const gate = document.createElement('main');
gate.innerHTML = '<div class="wrap"><h1>YozuLife</h1><p role="status">確認登入狀態中…</p><button type="button">使用 Google 登入</button></div>';
document.body.append(gate);
document.body.style.visibility = 'visible';
const message = gate.querySelector('p');
const button = gate.querySelector('button');
button.onclick = async () => {
  button.disabled = true;
  try { if (auth.currentUser) await signOutUser(); else await signInWithGoogle(); }
  catch (error) { message.textContent = `登入失敗（${error.code}），請重試。`; }
  finally { button.disabled = false; }
};
let loaded = false;
onAuthStateChanged(auth, async user => {
  if (loaded) { location.reload(); return; }
  if (!user || user.uid !== ADMIN_UID) {
    message.textContent = user ? '此帳號沒有存取權限，請改用管理員帳號登入。' : '請登入你的管理員帳號，以存取私人資料。';
    button.textContent = user ? '登出並切換帳號' : '使用 Google 登入';
    return;
  }
  button.hidden = true;
  message.textContent = '正在載入雲端資料…';
  try {
    await connectStorage(user.uid);
    loaded = true;
    await import('./main.js');
    gate.remove();
    content.hidden = false;
  } catch (error) {
    message.textContent = `無法載入資料（${error.code || error.message}），請確認資料庫規則後重新整理。`;
    button.hidden = false;
    button.textContent = '登出';
  }
});
