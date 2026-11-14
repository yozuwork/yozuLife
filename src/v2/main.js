import { confirmDialog } from './ui.js';
import { storage } from './cloud-storage.js';
import { renderVideoSection } from './videos.js';
import './account.js';
import { renderMedicalSection } from './medical.js';
import { renderMapsSection } from './maps.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import bootstrapIcons from 'bootstrap-icons/font/bootstrap-icons.json';
import { version } from '../../package.json';
document.querySelectorAll('[data-version]').forEach(el => { el.textContent = `v${version}`; });

/* ───────── Data (之後轉 React 可直接搬成 config) ───────── */
const ICONS = {
  life:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8"/><path d="M12 13c0-4.2 2.9-6.6 7.5-6.6 0 4.2-2.9 6.6-7.5 6.6z"/><path d="M12 10.6C12 7 9.6 4.6 5 4.6c0 3.6 2.4 6 7 6z"/></svg>',
  hero:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5.2c0 4.6-3 8-7 9.8-4-1.8-7-5.2-7-9.8V6l7-3z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>',
  transit:'<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="19" height="14" rx="3"/><path d="M3 14h19"/><path d="M7 19h4"/><path d="M25.5 12.5c1.4 1.3 1.4 5.7 0 7"/><path d="M28.5 10c2.4 2.4 2.4 9.6 0 12"/></svg>',
  calendar:'<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="7" width="22" height="20" rx="3.5"/><path d="M5 12.5h22"/><path d="M11 4.5v5M21 4.5v5"/><text x="16" y="23.6" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">' + new Date().getDate() + '</text></svg>',
  subscription:'<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="7" width="22" height="20" rx="3.5"/><path d="M5 12.5h22"/><path d="M11 4.5v5M21 4.5v5"/><path d="M19.8 18a3.9 3.9 0 1 1-1.2-2.8"/><path d="M19 13.6v2.2h-2.2"/></svg>'
};
const PIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6l-1 5 3 3v1H7v-1l3-3-1-5z"/><path d="M12 13v7"/></svg>';
const GRIP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';

const validIcon = icon => Object.hasOwn(ICONS, icon) || (typeof icon === 'string' && icon.startsWith('bi:') && Object.hasOwn(bootstrapIcons, icon.slice(3)));
const iconHTML = icon => typeof icon === 'string' && icon.startsWith('bi:') && validIcon(icon)
  ? `<i class="bi bi-${icon.slice(3)}" aria-hidden="true"></i>` : (ICONS[icon] || ICONS.life);
let SECTIONS = [
  { id:'transit',      name:'交通卡片', group:'交通', icon:'transit',      color:'#3F6186', keywords:'悠遊卡 一卡通 捷運 公車 transit' },
  { id:'subscription', name:'訂閱卡片', group:'財務', icon:'subscription', color:'#8A4F6C', keywords:'訂閱 月費 netflix spotify subscription' },
  { id:'calendar',     name:'行事曆',   group:'生活', icon:'calendar',     color:'#4F6B47', keywords:'行事曆 日曆 今天 日期 calendar' }
];

/* ───────── State ───────── */
const KEY = 'yozulife:v1';
let state = { order: SECTIONS.map(s=>s.id), pinned: [] };
try{
  const saved = JSON.parse(storage.getItem(KEY) || 'null');
  if(saved && Array.isArray(saved.order)){
    if(Array.isArray(saved.sections)){
      const ids = new Set();
      SECTIONS = saved.sections.filter(s => {
        if(!s || typeof s.id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(s.id) || ids.has(s.id) || ['life','hero'].includes(s.id) || typeof s.name !== 'string' || !s.name.trim() || typeof s.group !== 'string' || !s.group.trim() || !validIcon(s.icon) || !/^#[a-fA-F0-9]{6}$/.test(s.color)) return false;
        ids.add(s.id); return true;
      }).map(s=>({...s, keywords:typeof s.keywords === 'string' ? s.keywords : ''}));
    }
    const known = SECTIONS.map(s=>s.id);
    state.order = [...new Set(saved.order.filter(id=>known.includes(id)))].concat(known.filter(id=>!saved.order.includes(id)));
    state.pinned = Array.isArray(saved.pinned) ? saved.pinned.filter(id=>known.includes(id)) : [];
  }
}catch(e){}
const save = ()=>{ try{ storage.setItem(KEY, JSON.stringify({...state, sections:SECTIONS})); }catch(e){ document.getElementById('account-status').textContent = '無法儲存分區設定，請確認瀏覽器儲存空間；重新整理後可能遺失變更。'; } };
const byId = id => SECTIONS.find(s=>s.id===id);
// Attach the medical feature to an existing user-created consultation section.
let medicalSection = SECTIONS.find(s=>s.feature==='medical' || /看[診整]|就醫/.test(s.name));
let medicalAdded = false;
try{medicalAdded=storage.getItem('yozulife:medical-section-added')==='1';}catch{}
if(!medicalSection){
  medicalSection = {id:'medical',name:'看診分區',group:'生活',icon:'bi:hospital-fill',color:'#4F6B47',keywords:'看診 內分泌 定期檢查 醫療',feature:'medical'};
  if(!medicalAdded){
    SECTIONS.push(medicalSection); state.order.push(medicalSection.id);
    save();
  }
}
if(SECTIONS.includes(medicalSection)){
  medicalSection.feature='medical'; save();
}
try{storage.setItem('yozulife:medical-section-added','1');}catch{}
let mapSection=SECTIONS.find(s=>s.feature==='maps'||/地圖/.test(s.name));
let mapsAdded=false;
try{mapsAdded=storage.getItem('yozulife:maps-section-added')==='1';}catch{}
if(!mapSection&&!mapsAdded){
  mapSection={id:`maps-${crypto.randomUUID()}`,name:'地圖',group:'交通',icon:'bi:map-fill',color:'#3F6186',keywords:'地圖 地址 路線 導航 maps',feature:'maps'};
  SECTIONS.push(mapSection);state.order.push(mapSection.id);
}
if(mapSection){mapSection.feature='maps';save();}
try{storage.setItem('yozulife:maps-section-added','1');}catch{}
let videoSection=SECTIONS.find(s=>s.feature==='videos'||/影片|視頻/.test(s.name));
if(!videoSection){
 videoSection={id:'videos',name:'影片',group:'生活',icon:'bi:youtube',color:'#8B8245',keywords:'影片 收藏 video youtube bilibili',feature:'videos'};
 SECTIONS.push(videoSection);state.order.push(videoSection.id);
}
videoSection.feature='videos';save();
let query = '', filter = '全部', firstRender = true;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── Helpers ───────── */
document.querySelectorAll('[data-icon]').forEach(el=>{ el.outerHTML = ICONS[el.dataset.icon]; });
const TODAY = (()=>{
  const d = new Date(), w = '日一二三四五六'[d.getDay()];
  const h = d.getHours(), hi = h<11 ? '早安' : h<18 ? '午安' : '晚安';
  return { greet:`${hi}，${d.getMonth()+1}月${d.getDate()}日 星期${w}`, day:d.getDate() };
})();

const $groups = document.getElementById('groups');

function cardHTML(s, i){
  const pinned = state.pinned.includes(s.id);
  return `<li><button class="card" data-id="${s.id}" style="--c:${s.color};--i:${i}" aria-label="${escapeHTML(s.name)}">
    <span class="ic">${iconHTML(s.icon)}</span>
    <span class="nm">${escapeHTML(s.name)}</span>
    <span class="grip" aria-hidden="true">${GRIP}</span>
  </button><details class="card-menu"><summary aria-expanded="false" aria-label="${escapeHTML(s.name)} 的更多選項"><span aria-hidden="true">⋯</span></summary><div class="card-menu-options"><button class="menu-pin" type="button" data-pin="${s.id}" aria-pressed="${pinned}">${PIN}<span>${pinned?'取消置頂':'置頂分區'}</span></button><button class="delete-section" type="button" data-delete="${s.id}"><i class="bi bi-trash3" aria-hidden="true"></i><span>刪除分區</span></button></div></details></li>`;
}

function render(){
  document.getElementById('section-total').textContent=SECTIONS.length;
  const ordered = state.order.map(byId);
  let html = '', i = 0;
  const section = (title, key, items) =>
    `<section class="group">${title?`<h2>${escapeHTML(title)}<small>${items.length}</small></h2>`:''}<ul class="grid" data-sec="${escapeHTML(key)}">${items.map(s=>cardHTML(s,i++)).join('')}</ul></section>`;
  if(query){
    const q = query.toLowerCase();
    const hits = ordered.filter(s => (s.name + s.group + s.keywords).toLowerCase().includes(q));
    html = hits.length
      ? `<section class="group"><h2>搜尋結果<small>${hits.length} 個</small></h2><ul class="grid">${hits.map(s=>cardHTML(s,i++)).join('')}</ul></section>`
      : `<div class="empty-search"><strong>找不到「${escapeHTML(query)}」</strong>換個關鍵字，或清除搜尋看全部分區。</div>`;
  } else if(filter === '全部'){
    const pins = ordered.filter(s=>state.pinned.includes(s.id));
    const rest = ordered.filter(s=>!state.pinned.includes(s.id));
    if(pins.length) html += section('釘選', 'pinned', pins);
    if(rest.length) html += section(pins.length ? '其他分區' : '', 'all', rest);
  } else {
    const items = ordered.filter(s=>s.group===filter);
    html += section(filter, filter, items);
  }
  $groups.innerHTML = SECTIONS.length ? html : '<div class="empty-search"><strong>還沒有分區</strong>點「新增分區」，建立你的第一個分區。</div>';
  renderChips();
  $groups.classList.toggle('enter', firstRender && !reduce);
  if(firstRender && !reduce) setTimeout(()=>$groups.classList.remove('enter'), 1300);
  firstRender = false;
}
function renderChips(){
  const all = ['全部', ...new Set(SECTIONS.map(s=>s.group).filter(g=>g!=='全部'))];
  document.getElementById('chips').innerHTML = all.map(g=>{
    const n = g==='全部' ? SECTIONS.length : SECTIONS.filter(s=>s.group===g).length;
    return `<button class="chip" data-chip="${escapeHTML(g)}" aria-pressed="${g===filter && !query}">${escapeHTML(g)}<small>${n}</small></button>`;
  }).join('');
}
document.getElementById('chips').addEventListener('click', e=>{
  const c = e.target.closest('[data-chip]'); if(!c) return;
  filter = c.dataset.chip;
  if(query){ $q.value=''; query=''; $clear.hidden = true; }
  flip(()=>render());
});
function escapeHTML(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ───────── Search ───────── */
const $q = document.getElementById('q'), $clear = document.getElementById('clear');
$q.addEventListener('input', ()=>{ query = $q.value.trim(); $clear.hidden = !$q.value; render(); });
$clear.addEventListener('click', ()=>{ $q.value=''; query=''; $clear.hidden = true; render(); $q.focus(); });

function togglePin(id){
  const at = state.pinned.indexOf(id);
  at > -1 ? state.pinned.splice(at,1) : state.pinned.push(id);
  save(); flip(()=>render());
}

/* FLIP: animate cards from old to new positions */
function flip(mutate){
  const before = new Map();
  $groups.querySelectorAll('.card').forEach(c=>before.set(c.dataset.id, c.getBoundingClientRect()));
  mutate();
  if(reduce) return;
  $groups.querySelectorAll('.card').forEach(c=>{
    const b = before.get(c.dataset.id); if(!b) return;
    const a = c.getBoundingClientRect();
    const dx = b.left-a.left, dy = b.top-a.top;
    if(dx||dy) c.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
  $groups.classList.remove('enter');
}

/* Write a section's new visual order back into the global order */
function commitSection(grid){
  const ids = [...grid.querySelectorAll('.card')].map(c=>c.dataset.id);
  const slots = state.order.map((id,i)=>ids.includes(id)?i:-1).filter(i=>i>-1);
  slots.forEach((slot,k)=>{ state.order[slot] = ids[k]; });
  save();
}

/* ───────── Card interactions ───────── */
let drag = null, suppressClick = false, settling = false;
const menuAnimations=new WeakMap();
function setCardMenu(menu,expanded){
  const panel=menu.querySelector('.card-menu-options');
  const wasOpen=menu.open;
  const style=wasOpen?getComputedStyle(panel):null;
  const from={opacity:style?.opacity||'0',transform:style?.transform||'translateY(-10px) scale(.94)',clipPath:style?.clipPath||'inset(0 0 100% 0 round 12px)'};
  menuAnimations.get(menu)?.cancel();
  menu.querySelector('summary').setAttribute('aria-expanded',String(expanded));
  if(reduce){menu.open=expanded;return;}
  menu.open=true;
  const to=expanded?{opacity:1,transform:'translateY(0) scale(1)',clipPath:'inset(0 0 0% 0 round 12px)'}:{opacity:0,transform:'translateY(-10px) scale(.94)',clipPath:'inset(0 0 100% 0 round 12px)'};
  const animation=panel.animate([from,to],{duration:800,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
  menuAnimations.set(menu,animation);
  animation.onfinish=()=>{
    if(!expanded)menu.open=false;
    animation.cancel();menuAnimations.delete(menu);
  };
}
document.addEventListener('pointerdown', e=>{
  $groups.querySelectorAll('.card-menu[open]').forEach(menu=>{
    if(!menu.contains(e.target) && menu.querySelector('summary').getAttribute('aria-expanded')==='true') setCardMenu(menu,false);
  });
});
document.addEventListener('keydown', e=>{
  if(e.key!=='Escape')return;
  const menu=$groups.querySelector('.card-menu[open]');
  if(menu){setCardMenu(menu,false);menu.querySelector('summary').focus();e.preventDefault();}
});

$groups.addEventListener('click', async e=>{
  const summary=e.target.closest('.card-menu summary');
  if(summary){
    e.preventDefault();
    if(drag||settling||suppressClick)return;
    const menu=summary.closest('.card-menu');
    const expanded=summary.getAttribute('aria-expanded')!=='true';
    if(expanded)$groups.querySelectorAll('.card-menu[open]').forEach(other=>{if(other!==menu)setCardMenu(other,false);});
    setCardMenu(menu,expanded);return;
  }
  if(drag || settling || suppressClick) return;
  const remove = e.target.closest('[data-delete]');
  if(remove){
    const section = byId(remove.dataset.delete);
    const menu=remove.closest('.card-menu');
    if(menu){setCardMenu(menu,false);menu.querySelector('summary').focus();}
    if(!section || !(await confirmDialog({title:'刪除這個分區？', description:section.name}))) return;
    SECTIONS = SECTIONS.filter(s=>s.id!==section.id);
    state.order = state.order.filter(id=>id!==section.id);
    state.pinned = state.pinned.filter(id=>id!==section.id);
    if(filter!=='全部' && !SECTIONS.some(s=>s.group===filter)) filter='全部';
    save(); render(); document.getElementById('add-section').focus(); return;
  }
  const pin = e.target.closest('[data-pin]');
  if(pin){ e.stopPropagation(); const id=pin.dataset.pin; togglePin(id); $groups.querySelector(`.card-menu:has([data-pin="${id}"]) summary`)?.focus(); return; }
  const card = e.target.closest('.card');
  if(!card || suppressClick || e.target.closest('.grip')) return;
  openFrom = card;
  location.hash = card.dataset.id;
});

$groups.addEventListener('keydown', e=>{
  const card = e.target.closest('.card');
  if(!card || drag || settling || !e.altKey) return;
  if(e.key==='p' || e.key==='P'){ e.preventDefault(); togglePin(card.dataset.id); focusCard(card.dataset.id); return; }
  const dir = {ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[e.key];
  if(!dir) return;
  e.preventDefault();
  const li = card.parentElement, grid = li.parentElement;
  const sib = dir<0 ? li.previousElementSibling : li.nextElementSibling;
  if(!sib) return;
  const id = card.dataset.id;
  flip(()=>{ dir<0 ? grid.insertBefore(li, sib) : grid.insertBefore(sib, li); commitSection(grid); render(); });
  focusCard(id);
});
function focusCard(id){ const c = $groups.querySelector(`.card[data-id="${id}"]`); c && c.focus(); }

$groups.addEventListener('pointerdown', e=>{
  if(drag || settling || !e.isPrimary) return;
  if(e.pointerType==='touch' && !e.target.closest('.grip')) return;
  $groups.classList.remove('enter');
  if(e.target.closest('[data-pin]')) return;
  const card = e.target.closest('.card'); if(!card) return;
  if(e.button !== 0) return;
  const r = card.getBoundingClientRect();
  const grid = card.closest('.grid');
  drag = { card, li:card.parentElement, grid, original:[...grid.children], pointerId:e.pointerId, sx:e.clientX, sy:e.clientY, ox:e.clientX-r.left, oy:e.clientY-r.top, r, started:false };
});

window.addEventListener('pointermove', e=>{
  if(!drag || e.pointerId!==drag.pointerId) return;
  if(!drag.started){
    if(Math.hypot(e.clientX-drag.sx, e.clientY-drag.sy) < 6) return;
    drag.started = true;
    suppressClick = true;
    drag.card.setPointerCapture(e.pointerId);
    document.body.classList.add('sorting');
    const {card, li, r} = drag;
    const ph = document.createElement('div'); ph.className = 'ph'; ph.style.height = r.height+'px';
    li.appendChild(ph); drag.ph = ph;
    Object.assign(card.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
    card.classList.add('dragging');
  }
  e.preventDefault();
  drag.card.style.left = (e.clientX - drag.ox)+'px';
  drag.card.style.top  = (e.clientY - drag.oy)+'px';
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const targetLi = under && under.closest('.grid > li');
  if(targetLi && targetLi !== drag.li && targetLi.parentElement === drag.grid){
    const lis = [...drag.grid.children];
    const from = lis.indexOf(drag.li), to = lis.indexOf(targetLi);
    const before = new Map(lis.map(l=>[l, l.getBoundingClientRect()]));
    drag.grid.insertBefore(drag.li, from < to ? targetLi.nextSibling : targetLi);
    if(!reduce) lis.forEach(l=>{
      if(l===drag.li) return;
      const b = before.get(l), a = l.getBoundingClientRect();
      const dx=b.left-a.left, dy=b.top-a.top;
      if(dx||dy) l.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
    });
  }
}, {passive:false});

function endDrag(event){
  if(!drag || (event && event.pointerId!==drag.pointerId)) return;
  const d = drag; drag = null;
  if(!d.started) return;
  settling = true;
  document.body.classList.remove('sorting');
  if(d.card.hasPointerCapture(d.pointerId)) d.card.releasePointerCapture(d.pointerId);
  if(event?.type==='pointercancel') d.original.forEach(li=>d.grid.appendChild(li));
  commitSection(d.grid);
  const t = d.ph.getBoundingClientRect();
  const finish = ()=>{
    d.card.classList.remove('dragging');
    d.card.removeAttribute('style'); d.card.style.cssText = `--c:${byId(d.card.dataset.id).color};--i:0`;
    d.ph.remove();
    settling = false;
    setTimeout(()=>suppressClick=false, 100);
    d.card.focus({preventScroll:true});
  };
  if(reduce){ finish(); return; }
  d.card.style.transition = 'left .28s cubic-bezier(.2,.8,.2,1), top .28s cubic-bezier(.2,.8,.2,1), transform .28s, box-shadow .28s';
  d.card.style.left = t.left+'px'; d.card.style.top = t.top+'px';
  d.card.style.transform = 'none';
  setTimeout(finish, 290);
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

/* ───────── Routing & views ───────── */
const $detail = document.getElementById('detail');
let openFrom = null, openId = null, cameFromLife = false;

function setTab(tab){
  document.getElementById('view-life').hidden = tab!=='life';
  document.getElementById('view-hero').hidden = tab!=='hero';
  document.querySelectorAll('[data-tab]').forEach(a=>{
    a.toggleAttribute('aria-current', a.dataset.tab===tab);
    if(a.dataset.tab===tab) a.setAttribute('aria-current','page');
  });
  document.title = (tab==='hero' ? '習慣Hero' : 'LIFE區') + '｜YozuLife';
}

function route(){
  const h = location.hash.slice(1);
  const sec = byId(h);
  if(sec){ setTab('life'); openDetail(sec); return; }
  if(openId) closeDetail();
  setTab(h==='hero' ? 'hero' : 'life');
  if(h!=='hero') cameFromLife = true;
}

function insetFrom(card){
  const c = card.getBoundingClientRect(), d = $detail.getBoundingClientRect();
  return `inset(${c.top-d.top}px ${d.right-c.right}px ${d.bottom-c.bottom}px ${c.left-d.left}px round 22px)`;
}

function openDetail(sec){
  openId = sec.id;
  const medical = sec.feature==='medical' || /看[診整]|就醫/.test(sec.name);
  const maps = sec.feature==='maps' || /地圖/.test(sec.name);
  const videos=sec.feature==='videos'||/影片|視頻/.test(sec.name);
  document.querySelector('.d-empty').hidden = medical || maps || videos;
  let videoContent=document.getElementById('videos-content');
  if(!videoContent){videoContent=document.createElement('div');videoContent.id='videos-content';document.querySelector('.d-body').append(videoContent);}
  videoContent.hidden=!videos;
  if(videos)renderVideoSection(videoContent);
  const content = document.getElementById('medical-content');
  content.hidden = !medical;
  if(medical) renderMedicalSection(content);
  const mapsContent=document.getElementById('maps-content');
  mapsContent.hidden=!maps;
  if(maps)renderMapsSection(mapsContent);
  $detail.style.setProperty('--c', sec.color);
  document.getElementById('d-ic').innerHTML = iconHTML(sec.icon).replace(/width="26" height="26"/,'width="32" height="32"');
  document.getElementById('d-title').textContent = sec.name;
  document.getElementById('d-bar-title').textContent = sec.name;
  const $dg = document.getElementById('d-group');
  $dg.textContent = sec.id==='calendar' ? TODAY.greet : `分類：${sec.group}`;
  $dg.classList.toggle('today', sec.id==='calendar');
  document.title = sec.name + '｜YozuLife';
  $detail.hidden = false; $detail.scrollTop = 0; $detail.classList.remove('scrolled');
  document.body.classList.add('locked');
  const card = openFrom && openFrom.isConnected ? openFrom : $groups.querySelector(`.card[data-id="${sec.id}"]`);
  const show = ()=>{ $detail.classList.add('shown'); document.getElementById('back').focus({preventScroll:true}); };
  if(card && !reduce){
    $detail.animate([{clipPath:insetFrom(card)},{clipPath:'inset(0px 0px 0px 0px round 0px)'}],{duration:560,easing:'cubic-bezier(.2,.8,.2,1)'});
    setTimeout(show, 200);
  } else {
    if(!reduce) $detail.animate([{opacity:0},{opacity:1}],{duration:240});
    show();
  }
  openFrom = null;
}

function closeDetail(){
  const id = openId; openId = null;
  const card = $groups.querySelector(`.card[data-id="${id}"]`);
  $detail.classList.remove('shown');
  const done = ()=>{ $detail.hidden = true; document.body.classList.remove('locked'); card && card.focus({preventScroll:true}); };
  if(card && !reduce){
    const a = $detail.animate([{clipPath:'inset(0px 0px 0px 0px round 0px)'},{clipPath:insetFrom(card)}],{duration:440,easing:'cubic-bezier(.4,0,.2,1)'});
    a.onfinish = done;
  } else done();
}

document.getElementById('back').addEventListener('click', ()=>{
  if(cameFromLife) history.back(); else location.hash = 'life';
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && openId) document.getElementById('back').click(); });
$detail.addEventListener('scroll', ()=>$detail.classList.toggle('scrolled', $detail.scrollTop > 70));

window.addEventListener('hashchange', route);
const dialog = document.getElementById('section-dialog');
const form = document.getElementById('section-form');
const iconSelect = document.getElementById('section-icon');
const iconSearch = document.getElementById('icon-search');
const iconGrid = document.getElementById('icon-grid');
const iconMore = document.getElementById('icon-more');
const iconNames = Object.keys(bootstrapIcons).sort();
const aliases = {醫療:'hospital heart-pulse capsule prescription bandaid',健康:'heart-pulse activity',看診:'hospital clipboard2-pulse',閱讀:'book journal',書:'book journal',交通:'bus train car bicycle',財務:'cash coin wallet bank',生活:'house cup basket',音樂:'music headphones',遊戲:'controller joystick',工作:'briefcase laptop',旅行:'airplane luggage globe',運動:'activity bicycle',購物:'cart bag',日曆:'calendar',愛心:'heart',星星:'star',寵物:'dog cat',設定:'gear tools'};
let selectedIcon = 'life', iconLimit = 72;
function renderIconPicker(){
  const query = iconSearch.value.trim().toLowerCase().replace(/^bi[-:]/,'');
  const terms = (aliases[query] || query).split(/\s+/).filter(Boolean);
  const matches = iconNames.filter(name=>!terms.length || terms.some(term=>name.includes(term)));
  iconGrid.innerHTML = matches.slice(0,iconLimit).map(name=>`<button type="button" class="icon-option" data-bootstrap-icon="${name}" title="${name}" aria-label="${name}" aria-pressed="${selectedIcon===`bi:${name}`}"><i class="bi bi-${name}" aria-hidden="true"></i><span>${name}</span></button>`).join('');
  iconMore.hidden = matches.length<=iconLimit;
  document.getElementById('icon-count').textContent = matches.length ? `顯示 ${Math.min(iconLimit,matches.length)} / ${matches.length} 個圖示` : '找不到圖示，試試 heart、book 或 hospital。';
  const label = selectedIcon.startsWith('bi:') ? selectedIcon.slice(3) : iconSelect.selectedOptions[0].textContent;
  document.getElementById('icon-selection').innerHTML = `${iconHTML(selectedIcon)}<span>目前選擇：${label}</span>`;
}
iconSearch.addEventListener('input',()=>{iconLimit=72;renderIconPicker();});
iconMore.addEventListener('click',()=>{iconLimit+=72;renderIconPicker();});
iconSelect.addEventListener('change',()=>{selectedIcon=iconSelect.value;renderIconPicker();});
iconGrid.addEventListener('click',e=>{
  const button=e.target.closest('[data-bootstrap-icon]'); if(!button) return;
  selectedIcon=`bi:${button.dataset.bootstrapIcon}`;
  iconGrid.querySelectorAll('[data-bootstrap-icon]').forEach(b=>b.setAttribute('aria-pressed',b===button));
  document.getElementById('icon-selection').innerHTML = `${iconHTML(selectedIcon)}<span>目前選擇：${button.dataset.bootstrapIcon}</span>`;
});
document.getElementById('add-section').addEventListener('click', ()=>{
  form.reset();
  selectedIcon='life'; iconSearch.value=''; iconLimit=72; renderIconPicker();
  document.getElementById('section-message').textContent = '';
  document.getElementById('section-groups').innerHTML = [...new Set(SECTIONS.map(s=>s.group))].map(g=>`<option value="${escapeHTML(g)}"></option>`).join('');
  dialog.showModal();
  document.getElementById('section-name').focus();
});
document.getElementById('section-cancel').addEventListener('click', ()=>dialog.close());
form.addEventListener('submit', e=>{
  e.preventDefault();
  const data = new FormData(form);
  const name = data.get('name').trim(), group = data.get('group').trim();
  const message = document.getElementById('section-message');
  if(!name || !group){ message.textContent = '請輸入分區名稱與分類。'; return; }
  if(group==='全部'){ message.textContent = '「全部」為保留名稱，請使用其他分類。'; return; }
  if(SECTIONS.some(s=>s.name===name)){ message.textContent = '已有相同名稱的分區，請換個名稱。'; return; }
  const id = `section-${crypto.randomUUID()}`;
  SECTIONS.push({id, name, group, icon:selectedIcon, color:data.get('color'), keywords:name+' '+group});
  state.order.push(id);
  query=''; filter='全部'; $q.value=''; $clear.hidden=true;
  save(); render(); dialog.close(); focusCard(id);
});
render();
route();
