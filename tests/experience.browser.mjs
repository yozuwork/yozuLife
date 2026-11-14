// UI-only fixtures replace authentication and storage in intercepted browser requests.
// They never ship in the production bundle or contact the real database.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.YOZU_PLAYWRIGHT || 'playwright');
const base = process.env.YOZU_PREVIEW || 'http://127.0.0.1:5173/yozuLife/';
const out = process.env.YOZU_SCREENSHOTS || 'artifacts/experience';
await mkdir(out, { recursive:true });
const browser = await chromium.launch({ channel:'chrome', headless:true });
const errors = [];
const page = await browser.newPage({ viewport:{width:1440,height:1000}, colorScheme:'light' });
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(base);
  await page.locator('.yl-auth').waitFor();
  await page.waitForTimeout(1000);
  await page.screenshot({path:`${out}/login-desktop.png`,fullPage:true});
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `login overflow at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`${out}/login-mobile.png`,fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  const motion = await page.evaluate(async () => {
    const {loader} = await import('/yozuLife/src/v2/ui.js');
    const host = document.createElement('div');host.innerHTML=loader();document.body.append(host);
    const result=getComputedStyle(host.querySelector('.yl-loader-orbit')).animationName;host.remove();return result;
  });
  assert.equal(motion,'none');
  await page.emulateMedia({reducedMotion:'no-preference'});

  await page.route('**/src/lib/firebase.ts*', route => route.fulfill({contentType:'application/javascript',body:`
    export const auth={currentUser:{uid:'K6DbALyBPVdX8SkUf36TnyF20433',displayName:'Yozu',email:'yozu@example.test',photoURL:'/yozuLife/images/yozu-mark.svg'}};
    export const db={}; export const signInWithGoogle=async()=>{};
    export const signOutUser=async()=>{auth.currentUser=null;localStorage.setItem('qa-logged-out','1');location.reload();};
  `}));
  await page.route('**/src/v2/cloud-storage.js*', route => route.fulfill({contentType:'application/javascript',body:`
    export const ADMIN_UID='K6DbALyBPVdX8SkUf36TnyF20433';
    export const storage={getItem:key=>localStorage.getItem('qa:'+key),setItem:(key,value)=>localStorage.setItem('qa:'+key,value)};
    export const hasPendingChanges=()=>false;
    export const connectStorage=async()=>{window.yozuSyncStatus='已同步至雲端';};
  `}));
  await page.route('**/src/v2/auth-page.js*', async route => {
    const response = await route.fetch();
    const source = (await response.text()).replace(/import\s*\{\s*onAuthStateChanged\s*\}\s*from\s*[^;]+;/, `const onAuthStateChanged=(auth,callback)=>setTimeout(()=>callback(localStorage.getItem('qa-logged-out')?null:auth.currentUser),0);`);
    await route.fulfill({response,body:source});
  });
  await page.setViewportSize({width:1440,height:1000});
  await page.reload();
  await page.locator('#account-action').click();
  await page.locator('.yl-settings').waitFor();
  await page.waitForTimeout(350);
  await page.screenshot({path:`${out}/settings-desktop.png`,fullPage:true});
  const fixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  for (const kind of ['background','avatar','icon']) {
    await page.locator(`[data-upload=${kind}]`).setInputFiles({name:'test.png',mimeType:'image/png',buffer:fixture});
    await page.waitForFunction(() => !document.querySelector('.yl-settings [type=submit]').disabled);
    assert.match(await page.locator('.yl-settings-message').innerText(), /儲存後/);
  }
  await page.locator('.yl-settings [type=range]').fill('0');
  await page.locator('.yl-settings [type=submit]').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('qa:yozulife:appearance:v1')));
  for (const kind of ['background','avatar','icon']) assert.match(saved[kind],/^data:image\//);
  assert.equal(saved.position,0);
  assert.match(await page.locator('link[rel=icon]').getAttribute('href'),/^data:image\//);
  assert.match(await page.locator('.yl-account-avatar').getAttribute('src'),/^data:image\//);
  await page.reload();
  assert.match(await page.locator('.yl-account-avatar').getAttribute('src'),/^data:image\//);
  await page.locator('#account-action').click();
  await page.locator('[data-reset=avatar]').click();
  await page.locator('[data-cancel]').click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('qa:yozulife:appearance:v1')).avatar), saved.avatar);

  await page.setViewportSize({width:390,height:844});
  await page.locator('#mobile-account-action').click();
  await page.waitForTimeout(350);
  await page.screenshot({path:`${out}/settings-mobile.png`,fullPage:true});
  assert.equal(await page.locator('.yl-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(),0);
  assert.equal(await page.locator('#mobile-account-action').evaluate(el=>el===document.activeElement),true);
  await page.locator('#mobile-account-action').click();
  await page.locator('[data-theme-option=dark]').click();
  await page.locator('.yl-settings [type=submit]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--paper').trim()),'#1D1B17');
  await page.locator('#mobile-account-action').click();
  await page.waitForTimeout(350);
  await page.screenshot({path:`${out}/settings-dark.png`,fullPage:true});
  await page.locator('[data-logout]').click();
  assert.equal(await page.locator('dialog[open]').count(),2);
  await page.waitForTimeout(350);
  await page.screenshot({path:`${out}/logout-confirmation.png`,fullPage:true});
  await page.locator('.yl-confirm-content [data-cancel]').click();
  assert.equal(await page.locator('.yl-settings').count(),1);
  await page.locator('[data-logout]').click();
  await page.locator('[data-confirm]').click();
  await page.locator('.yl-auth h1').waitFor();
  assert.match(await page.locator('.yl-auth h1').innerText(),/暫別/);
  await page.screenshot({path:`${out}/signed-out.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: responsive layouts, image uploads, focus restoration, cancel/save, persistence, theme, reduced motion, nested confirmation and logout.');
} finally { await browser.close(); }
